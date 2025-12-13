from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from db.base import Base
from datetime import datetime
from sqlalchemy.orm import relationship
from typing import Optional

# Pydantic models (Schemas)
class DiscountBaseSchema(BaseModel):
    code: str
    percentage: float
    expires_at: Optional[datetime] = None
    is_active: bool = True

class DiscountCreateSchema(DiscountBaseSchema):
    pass
class DiscountUpdateSchema(DiscountBaseSchema):
    code: Optional[str] = None
class DiscountInDBBaseSchema(DiscountBaseSchema):
    id: int

    class Config:
        from_attributes = True

class DiscountSchema(DiscountInDBBaseSchema):
    pass

# SQLAlchemy model
class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    percentage = Column(Float, nullable=True)
    value = Column(Float, nullable=True)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    orders = relationship("Order", back_populates="discount")