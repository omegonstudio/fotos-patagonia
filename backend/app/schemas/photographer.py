from pydantic import BaseModel
from typing import List

class PhotoEarningSummary(BaseModel):
    photo_id: int
    photo_filename: str
    times_sold: int
    total_earnings: float

    class Config:
        from_attributes = True
