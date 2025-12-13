import logging
from sqlalchemy import text
from db.init_db import init_db
from db.session import SessionLocal, engine  # Import engine
from db.base import Base  # Import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Iniciando la inicialización de la base de datos.")
    try:
        logger.info("Asegurando que todas las tablas existan...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas verificadas/creadas exitosamente.")

        logger.info("Poblando data inicial (roles, permisos, admin)...")
        db = SessionLocal()
        init_db(db)

        # HACK: Reset the sequence for photo_sessions to fix potential duplicate key error
        # This can happen in development if the database is persisted but sequences are reset.
        try:
            logger.info("Attempting to reset photo_sessions_id_seq...")
            max_id = db.execute(text("SELECT MAX(id) FROM photo_sessions")).scalar() or 0
            next_val = max_id + 1
            # Set the next value of the sequence, and the 'false' means the next nextval() will return this value.
            db.execute(text(f"SELECT setval('photo_sessions_id_seq', {next_val}, false)"))
            logger.info(f"Sequence photo_sessions_id_seq reset. Next value will be {next_val}.")
            db.commit()
        except Exception as e:
            logger.warning(f"Could not reset photo_sessions_id_seq: {e}")
            db.rollback()

        db.close()
        logger.info("Data inicial poblada exitosamente.")
    except Exception as e:
        logger.error(f"Ocurrió un error durante la inicialización de la base de datos: {e}")
        # Re-raise the exception to make the container fail clearly
        raise e


if __name__ == "__main__":
    main()