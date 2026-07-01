from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from jose import jwt, JWTError
from ..core.config import settings

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user email to their active websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, email: str):
        await websocket.accept()
        if email not in self.active_connections:
            self.active_connections[email] = []
        self.active_connections[email].append(websocket)

    def disconnect(self, websocket: WebSocket, email: str):
        if email in self.active_connections:
            if websocket in self.active_connections[email]:
                self.active_connections[email].remove(websocket)
            if not self.active_connections[email]:
                del self.active_connections[email]

    async def broadcast_to_user(self, email: str, message: dict):
        if email in self.active_connections:
            for connection in self.active_connections[email]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/dashboard")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, email)
    try:
        while True:
            # We expect to just hold the connection open to push data to the client
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, email)
