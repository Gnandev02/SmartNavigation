from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import auth, vision, sos, location, contacts, ws, admin

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(vision.router, prefix="/api/v1/vision", tags=["vision"])
app.include_router(sos.router, prefix="/api/v1/sos", tags=["sos"])
app.include_router(location.router, prefix="/api/v1/location", tags=["location"])
app.include_router(contacts.router, prefix="/api/v1/contacts", tags=["contacts"])
app.include_router(ws.router, prefix="/api/v1/ws", tags=["websocket"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartNav API"}
