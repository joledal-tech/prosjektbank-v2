from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN challenges TEXT;"))
            conn.commit()
            print("Migration successful: Added challenges column.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")

if __name__ == "__main__":
    migrate()
