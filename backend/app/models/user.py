from sqlalchemy import Column, Integer, String, Boolean
from ..db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(String, default="user") # user, caregiver, admin
    is_active = Column(Boolean, default=True)
