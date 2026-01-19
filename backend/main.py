from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import os
from dotenv import load_dotenv
from openai import OpenAI

import models
import schemas
import crud
from database import SessionLocal, engine
from utils.parser import parse_pdf
from utils.cv_parser import parse_cv_pdf

from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

def run_migrations():
    """Run database migrations. Called during startup event."""
    migrations = [
        "ALTER TABLE projects ADD COLUMN tags JSONB DEFAULT '[]'",
        "ALTER TABLE employees ADD COLUMN bio TEXT",
        "ALTER TABLE employees ADD COLUMN languages JSON DEFAULT '[]'",
        "ALTER TABLE employees ADD COLUMN key_competencies JSON DEFAULT '[]'",
        "ALTER TABLE project_team_members ADD COLUMN cv_relevance TEXT",
        "ALTER TABLE project_team_members ADD COLUMN reference_name VARCHAR",
        "ALTER TABLE project_team_members ADD COLUMN reference_phone VARCHAR",
        "ALTER TABLE project_team_members ADD COLUMN role_summary TEXT"
    ]
    
    try:
        with engine.connect() as conn:
            for m in migrations:
                try:
                    conn.execute(text(m))
                    conn.commit()
                    print(f"Migration success: {m}")
                except ProgrammingError:
                    conn.rollback()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration error for '{m}': {e}")
    except Exception as e:
        print(f"Could not run migrations (database may not be ready): {e}")


load_dotenv()

# Initialize OpenAI client (lazy - only used when needed)
_openai_client = None

def get_openai_client():
    """Get OpenAI client, initializing lazily to avoid startup crashes."""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            _openai_client = OpenAI(api_key=api_key)
    return _openai_client

app = FastAPI(title="ØMF Prosjektbank v2")

# Configure CORS for frontend
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints for Cloud Run
@app.get("/")
def health_check():
    return {"status": "healthy", "service": "prosjektbank-backend"}

@app.get("/health")
def health():
    return {"status": "ok"}

from fastapi.staticfiles import StaticFiles
import os

# Ensure static directory exists
os.makedirs("static/uploaded_images", exist_ok=True)
os.makedirs("static/project_attachments", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db=db, project=project)

@app.get("/projects/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = crud.get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/projects/{project_id}", response_model=schemas.Project)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    db_project = crud.update_project(db, project_id=project_id, project=project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.delete("/projects/{project_id}", response_model=schemas.Project)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = crud.delete_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.get("/types/", response_model=List[schemas.ProjectType])
def read_project_types(db: Session = Depends(get_db)):
    return crud.get_project_types(db)

@app.get("/tags/", response_model=List[str])
def read_tags(db: Session = Depends(get_db)):
    # Fetch all tags from all projects and return unique list
    # Postgres JSONB support allows aggregation but doing it in python for simplicity/portability
    # or use simple SQL query
    projects = db.query(models.Project.tags).all()
    # projects is list of tuples [(['tag1'],), (None,), ...]
    
    unique_tags = set()
    for p in projects:
        if p.tags: # p.tags is the list
            for tag in p.tags:
                unique_tags.add(tag)
                
    return sorted(list(unique_tags))

# Employee / Team Endpoints
@app.get("/employees/", response_model=List[schemas.Employee])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_employees(db, skip=skip, limit=limit)

@app.post("/employees/", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return crud.create_employee(db=db, employee=employee)

@app.get("/employees/{employee_id}", response_model=schemas.EmployeeDetail)
def read_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@app.put("/employees/{employee_id}", response_model=schemas.Employee)
def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    db_employee = crud.update_employee(db, employee_id=employee_id, employee=employee)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@app.post("/employees/{employee_id}/generate-bio")
def generate_employee_bio(employee_id: int, db: Session = Depends(get_db)):
    # Use schemas.EmployeeDetail or just get the object with relationships
    db_employee = crud.get_employee(db, employee_id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Extract data for prompt
    exp_summary = "\n".join([f"- {exp.title} hos {exp.company} ({exp.time_frame})" for exp in db_employee.work_experiences])
    edu_summary = "\n".join([f"- {edu.degree} fra {edu.institution} ({edu.time_frame})" for edu in db_employee.educations])
    projects = []
    for tm in db_employee.team_memberships:
        proj = tm.project
        projects.append(f"- {proj.name}: Rolle: {tm.role}. {tm.cv_relevance or ''} {tm.role_summary or ''}")
    proj_summary = "\n".join(projects)

    competencies = ", ".join(db_employee.key_competencies) if db_employee.key_competencies else "Ikke spesifisert"

    prompt = f"""
    Du er en profesjonell CV-skriver for entreprenørselskapet Ø.M. Fjeld. 
    Skriv en profiltekst for {db_employee.name}, som har rollen {db_employee.title}.
    
    Teksten skal være:
    1. Informativ, selgende og sannferdig.
    2. Appelere til profesjonelle byggherrer i anbudsrunder.
    3. Fokusere på erfaring, pålitelighet og kompetanse.
    4. Skrevet i 3. person (f.eks. "{db_employee.name.split()[0]} har...")
    
    HER ER BAKGRUNNSDATA:
    Rolle: {db_employee.title}
    Nøkkelkompetanse: {competencies}
    
    ARBEIDSERFARING:
    {exp_summary}
    
    PROSJEKTERFARING:
    {proj_summary}
    
    UTDANNING:
    {edu_summary}
    
    Skriv teksten på norsk. Hold den konsis, men kraftfull (ca 100-150 ord).
    """

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        firstName = db_employee.name.split()[0]
        return {"bio": f"(DEMO-MODUS - Legg inn API-nøkkel for full versjon)\n\n{db_employee.name} er en svært erfaren {db_employee.title} i Ø.M. Fjeld. Gjennom sin karriere har vedkommende opparbeidet seg solid kompetanse innen planlegging og gjennomføring av komplekse byggeprosjekter. {firstName} er kjent for å levere med høyeste kvalitet og har særlig fokus på god dialog med kunden. Erfaringen inkluderer prosjekter med høy teknisk kompleksitet, hvor {firstName} har vist seg som en handlekraftig og løsningsorientert ressursperson."}

    try:
        client = get_openai_client()
        if not client:
            return {"bio": "(API-nøkkel mangler - kan ikke generere bio)"}
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Du er en ekspert på å skrive CV-profiler for bygg- og anleggsbransjen."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        return {"bio": response.choices[0].message.content}
    except Exception as e:
        print(f"AI Generation error: {e}")
        # Log error but don't crash entirely if it's just an API issue
        return {"bio": f"Kunne ikke generere AI-tekst akkurat nå: {str(e)}"}

@app.post("/projects/{project_id}/team", response_model=schemas.ProjectTeamMember)
def add_team_member(project_id: int, member: schemas.ProjectTeamMemberCreate, db: Session = Depends(get_db)):
    # Verify project exists
    db_project = crud.get_project(db, project_id=project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_member = crud.add_team_member(db, project_id=project_id, member=member)
    if not db_member:
        raise HTTPException(status_code=400, detail="Could not add team member")
        
    return db_member

@app.post("/projects/{project_id}/attachments/", response_model=schemas.ProjectAttachment)
async def upload_attachment(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verify project
    db_project = crud.get_project(db, project_id=project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Save file
    safe_filename = file.filename.replace(" ", "_").replace("/", "_")
    unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
    file_path = f"static/project_attachments/{unique_filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # Determine type
    file_type = "file"
    ct = file.content_type
    if ct.startswith("image/"):
        file_type = "image"
    elif ct == "application/pdf":
        file_type = "pdf"
    elif "word" in ct or "document" in ct:
        file_type = "word"
    
    # Create DB entry
    att_in = schemas.ProjectAttachmentCreate(
        filename=file.filename,
        file_path="/" + file_path, # URL path
        file_type=file_type,
        upload_date=datetime.datetime.now().isoformat()
    )
    
    return crud.create_project_attachment(db, att_in, project_id)

@app.delete("/attachments/{attachment_id}", response_model=schemas.ProjectAttachment)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    # Get attachment to find path
    db_att = db.query(models.ProjectAttachment).filter(models.ProjectAttachment.id == attachment_id).first()
    if not db_att:
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    # Remove file
    local_path = db_att.file_path.lstrip("/")
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception as e:
            print(f"Error removing file {local_path}: {e}")
        
    return crud.delete_project_attachment(db, attachment_id)


@app.post("/employees/upload-cv")
async def upload_cv_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    content = await file.read()
    extracted_data = parse_cv_pdf(content)
    
    if "error" in extracted_data:
        raise HTTPException(status_code=422, detail=extracted_data["error"])
        
    return extracted_data

@app.post("/api/upload")
async def parse_project_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    content = await file.read()
    extracted_data = parse_pdf(content)
    return extracted_data

import uuid
import shutil

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1]
    filename = f"img_{uuid.uuid4().hex}.{file_ext}"
    file_path = f"static/uploaded_images/{filename}"
    
    try:
        with open(file_path, "wb") as buffer:
             shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save image: {e}")
        
    return {"url": f"/static/uploaded_images/{filename}"}

# Seed initial types if empty
@app.on_event("startup")
def startup_event():
    # First, try to create tables and run migrations
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully")
    except Exception as e:
        print(f"Could not create database tables: {e}")
        return  # Don't proceed if database connection failed
    
    # Run migrations
    run_migrations()
    
    # Seed project types
    db = SessionLocal()
    try:
        standard_types = [
            "Barnehage", "Bolig", "Helse og omsorg", "Hotell", "Næring", 
            "Offentlig", "Skole", "Spesialbygg", "Undervisning"
        ]
        
        for t_name in standard_types:
            exists = db.query(models.ProjectType).filter(models.ProjectType.name == t_name).first()
            if not exists:
                db.add(models.ProjectType(name=t_name))
        
        db.commit()
        print("Project types seeded successfully")
    except Exception as e:
        print(f"Startup seeding error: {e}")
    finally:
        db.close()
