from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import date
import asyncio
import sys
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import get_db, engine
from shared.models import Base, User, Client, Conversation, Message, Setting, Attribute

QUESTION_ENDPOINT = os.getenv("QUESTION_ENDPOINT", "/question")
ANSWER_ENDPOINT = os.getenv("ANSWER_ENDPOINT", "/answer")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Agent Service")

FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")
origins = [
    f"http://localhost:{FRONTEND_PORT}",
    f"http://127.0.0.1:{FRONTEND_PORT}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)


manager = ConnectionManager()


def build_prompt(db: Session, client: Client, user: User, today_conversation: Conversation) -> str:
    attributes_query = db.query(Attribute).filter(Attribute.client_id == client.id).all()

    context_parts = [f"Contexto de la empresa {client.name}:"]
    for attr in attributes_query:
        if attr.template:
            context_parts.append(f"- {attr.template.description}: {attr.value}")

    context_str = "\n".join(context_parts)

    messages_to_format = []

    message_count_today = db.query(Message).filter(Message.conversation_id == today_conversation.id).count()

    if message_count_today == 1:
        previous_conversation = db.query(Conversation).filter(
            Conversation.user_id == user.id,
            Conversation.id != today_conversation.id
        ).order_by(Conversation.created_at.desc()).first()
        if previous_conversation:
            messages_to_format.extend(
                db.query(Message).filter(Message.conversation_id == previous_conversation.id).order_by(
                    Message.timestamp).all()
            )

    messages_to_format.extend(
        db.query(Message).filter(Message.conversation_id == today_conversation.id).order_by(Message.timestamp).all()
    )

    history_str = "\n".join([f"{msg.role}: {msg.content}" for msg in messages_to_format])

    prompt_parts = [
        context_str,
        "\nResponde a la ultima pregunta del siguiente historial:",
        history_str
    ]

    return "\n".join(prompt_parts)


async def call_n8n_webhook(db: Session, user: User, client: Client, conversation: Conversation):
    webhook_setting = db.query(Setting).filter(Setting.key == "URL_AGENT").first()
    answer_setting = db.query(Setting).filter(Setting.key == "URL_ANSWER_HOST").first()
    if webhook_setting and webhook_setting.value:
        webhook_url = webhook_setting.value

        prompt = build_prompt(db, client, user, conversation)

        agent_port = os.getenv("AGENT_PORT", "8001")

        payload = {
            "user_id": user.id,
            "client_code": client.client_code,
            "answer_endpoint": f"{answer_setting.value}:{agent_port}{ANSWER_ENDPOINT}",
            "prompt": prompt,
        }
        try:
            async with httpx.AsyncClient() as http_client:
                await http_client.post(webhook_url, json=payload)
        except httpx.RequestError as e:
            print(f"Error calling n8n webhook: {e}")


@app.get(QUESTION_ENDPOINT)
async def add_message(username: str, client_code: str, texto: str, db: Session = Depends(get_db)):
    user = db.query(User).join(Client).filter(
        User.username == username,
        Client.client_code == client_code
    ).first()

    if not user:
        client = db.query(Client).filter(Client.client_code == client_code).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with code '{client_code}' not found")

        user = User(username=username, client_id=client.id)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        client = user.client

    today_date = date.today()
    conversation = db.query(Conversation).filter(
        Conversation.user_id == user.id,
        Conversation.created_at >= today_date
    ).first()

    if not conversation:
        conversation = Conversation(user_id=user.id, client_id=user.client_id,
                                    title=f"Conversación {user.username} - {today_date.strftime('%d/%m/%Y')}")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    db_message = Message(conversation_id=conversation.id, role="user", content=texto)
    db.add(db_message)
    db.commit()

    asyncio.create_task(manager.send_personal_message("new_message", user.id))
    asyncio.create_task(call_n8n_webhook(db, user, client, conversation))

    return {"status": "message received"}


@app.get(ANSWER_ENDPOINT)
async def add_response(user_id: int, client_code: str, texto: str, db: Session = Depends(get_db)):
    user = db.query(User).join(Client).filter(
        User.id == user_id,
        Client.client_code == client_code
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found or does not belong to the specified client")

    conversation = db.query(Conversation).filter(
        Conversation.user_id == user.id
    ).order_by(Conversation.created_at.desc()).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="No conversation found for this user")

    db_message = Message(conversation_id=conversation.id, role="agent", content=texto)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    message_data = {
        "id": db_message.id,
        "role": db_message.role,
        "content": db_message.content,
        "timestamp": db_message.timestamp.isoformat()
    }

    asyncio.create_task(manager.send_personal_message(json.dumps(message_data), user_id))
    return {"status": "response sent"}


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AGENT_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)