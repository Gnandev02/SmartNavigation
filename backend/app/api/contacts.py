from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .deps import get_current_active_user
from ..models.user import User
from ..models.contact import Contact
from ..schemas.contact import ContactCreate, ContactResponse
from ..db.session import get_db

router = APIRouter()

@router.post("/", response_model=ContactResponse)
def create_contact(
    contact_in: ContactCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    contact = Contact(**contact_in.model_dump(), user_id=current_user.id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("/", response_model=List[ContactResponse])
def read_contacts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    return contacts
