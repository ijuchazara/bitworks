from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import sys
import os
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from shared.database import engine
from shared.models import Base
from routers import clients, users, conversations, settings, templates, attributes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Core Service")

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

app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(settings.router, prefix="/api", tags=["System Settings"])
app.include_router(templates.router, prefix="/api", tags=["Attribute Templates"])
app.include_router(attributes.router, prefix="/api", tags=["Client Attributes"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("CORE_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)