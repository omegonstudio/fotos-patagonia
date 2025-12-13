from sqlalchemy.orm import Session

class BaseService():
    def __init__(self, db: Session):
        self.db = db
    
    def _save_and_refresh(self, obj):
        self.db.add(obj)
        self.db.commit()
        self.db.flush()
        self.db.refresh(obj)
        return obj
    
    def _delete_and_refresh(self, obj):
        self.db.delete(obj)
        self.db.commit()
        self.db.flush()
        return None