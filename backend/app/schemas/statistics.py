from pydantic import BaseModel
from typing import Optional

class PhotoSaleStat(BaseModel):
    photo_id: int
    photo_filename: str
    album_name: Optional[str] = "Sin Álbum"
    times_sold: int
    total_revenue: float

    class Config:
        from_attributes = True
