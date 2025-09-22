from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import date, datetime
import asyncio
import sys
import os
import httpx
import json
import uuid
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import get_db, engine
from shared.models import Base, User, Client, Setting, Attribute, Communication

load_dotenv()

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


async def call_n8n_webhook(db: Session, user: User, client: Client, text: str):
    webhook_setting = db.query(Setting).filter(Setting.key == "URL_AGENT").first()
    answer_setting = db.query(Setting).filter(Setting.key == "URL_ANSWER_HOST").first()
    if webhook_setting and webhook_setting.value:
        webhook_url = webhook_setting.value

        prompt = text

        agent_port = os.getenv("AGENT_PORT", "8001")

        payload = {
            "session_id": user.session_id,
            "answer_ep": f"{answer_setting.value}:{agent_port}{ANSWER_ENDPOINT}",
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
        
        user.session_id = str(uuid.uuid4())
        db.commit()

    else:
        client = user.client

    asyncio.create_task(manager.send_personal_message("new_message", user.id))
    asyncio.create_task(call_n8n_webhook(db, user, client, texto))

    return {"status": "message received"}


@app.get(ANSWER_ENDPOINT)
async def add_response(session_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.session_id == session_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with the specified session_id not found")

    last_communication = db.query(Communication).filter(Communication.session_id == session_id).order_by(Communication.id.desc()).first()

    if not last_communication:
        return {"status": "no new message to send"}

    # Handle cases where created_at might be None for old records
    created_at_iso = last_communication.created_at.isoformat() if last_communication.created_at else datetime.utcnow().isoformat()

    response_data = {
        "id": last_communication.id,
        "session_id": last_communication.session_id,
        "message": last_communication.message,
        "created_at": created_at_iso
    }

    asyncio.create_task(manager.send_personal_message(json.dumps(response_data), user.id))

    return {"status": "notification sent"}


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
    port = int(os.getenv("AGENT_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
