
from database import SessionLocal
from models import Project

db = SessionLocal()
projects = db.query(Project).all()

for p in projects:
    print(f"ID: {p.id}, Name: {p.name}, Type: {p.type}")

db.close()
