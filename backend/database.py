from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

def get_database_url():
    """Build database URL, supporting both Cloud SQL Unix socket and standard connections."""
    # Check for Cloud SQL instance connection (used by Cloud Run)
    instance_connection_name = os.getenv("INSTANCE_CONNECTION_NAME")
    
    if instance_connection_name:
        # Cloud SQL via Unix socket
        db_user = os.getenv("DB_USER", "postgres")
        db_pass = os.getenv("DB_PASS", "")
        db_name = os.getenv("DB_NAME", "prosjektbank")
        unix_socket_path = f"/cloudsql/{instance_connection_name}"
        return f"postgresql://{db_user}:{db_pass}@/{db_name}?host={unix_socket_path}"
    
    # Fallback to standard DATABASE_URL
    return os.getenv("DATABASE_URL", "postgresql://user:password@localhost/prosjektbank")

Base = declarative_base()

# Lazy initialization of engine and SessionLocal
_engine = None
_SessionLocal = None

def get_engine():
    """Get or create the database engine lazily."""
    global _engine
    if _engine is None:
        DATABASE_URL = get_database_url()
        _engine = create_engine(DATABASE_URL)
    return _engine

def get_session_local():
    """Get or create the SessionLocal lazily."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

# For backwards compatibility - these are now properties that initialize lazily
@property
def engine():
    return get_engine()

@property  
def SessionLocal():
    return get_session_local()

def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
