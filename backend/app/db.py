import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://mindaxis:changeme@localhost:5432/mindaxis",
)

def _init_engine():
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.startswith("postgresql"):
        try:
            eng = create_engine(db_url, connect_args={"connect_timeout": 3})
            with eng.connect():
                pass
            return eng
        except Exception as exc:
            print(f"[db] PostgreSQL connection failed ({exc}). Falling back to SQLite: sqlite:///./mindaxis.db")

    return create_engine("sqlite:///./mindaxis.db", connect_args={"check_same_thread": False})


engine = _init_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
