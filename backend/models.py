from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    type = Column(String, index=True)  # Creatable Select: "Bolig", "Næring", etc.
    location = Column(String, index=True)
    
    # Flexible time field (e.g., "Juni 2022 – desember 2022" or "2024")
    time_frame = Column(String, nullable=True)
    
    relevance = Column(Text, nullable=True) # "Relevans" text field
    relevance_role = Column(String, nullable=True)
    challenges = Column(Text, nullable=True) # "Utfordringer" text field
    contract_type = Column(String, nullable=True)  # Entrepriseform
    performed_by = Column(String, nullable=True)  # Datterselskap
    
    area_m2 = Column(Integer, nullable=True)
    contract_value_mnok = Column(Float, nullable=True)
    
    certification = Column(String, nullable=True) # BREEAM, etc.
    
    contact_person = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    
    # New Field for Rapid Registration
    client = Column(String, nullable=True) # Oppdragsgiver
    role_description = Column(Text, nullable=True) # Firmaets rolle i prosjektet

    image_url = Column(String, nullable=True)
    tags = Column(JSON, default=list) # List of strings
    
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")
    attachments = relationship("ProjectAttachment", back_populates="project", cascade="all, delete-orphan")
    team_members = relationship("ProjectTeamMember", back_populates="project", cascade="all, delete-orphan")

class ProjectImage(Base):
    __tablename__ = "project_images"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    project = relationship("Project", back_populates="images")

class ProjectType(Base):
    """
    To store the unique list of project types for the 'Creatable Select' dropdown.
    """
    __tablename__ = "project_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    title = Column(String, nullable=True) # Default title/position
    company = Column(String, nullable=True) # Company/Department
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    cv_link = Column(String, nullable=True) # Link to uploaded CV file
    bio = Column(Text, nullable=True) # Profiltekst
    languages = Column(JSON, default=list) # List of strings or objects
    key_competencies = Column(JSON, default=list) # Nøkkelkompetanse

    # Relationships
    team_memberships = relationship("ProjectTeamMember", back_populates="employee")
    work_experiences = relationship("WorkExperience", back_populates="employee", cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="employee", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="employee", cascade="all, delete-orphan")

class WorkExperience(Base):
    __tablename__ = "work_experiences"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    time_frame = Column(String, nullable=True) # e.g. "2015 - 2020"
    
    employee = relationship("Employee", back_populates="work_experiences")

class Education(Base):
    __tablename__ = "educations"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    time_frame = Column(String, nullable=True) # e.g. "2010 - 2013"
    
    employee = relationship("Employee", back_populates="educations")

class Certification(Base):
    __tablename__ = "certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    name = Column(String, nullable=False)
    year = Column(String, nullable=True) # e.g. "2022"
    
    employee = relationship("Employee", back_populates="certifications")

class ProjectTeamMember(Base):
    __tablename__ = "project_team_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    role = Column(String, nullable=False) # e.g. "Prosjektleder", "Anleggsleder"
    
    # CV specific fields on the bridge
    cv_relevance = Column(Text, nullable=True)
    reference_name = Column(String, nullable=True)
    reference_phone = Column(String, nullable=True)
    role_summary = Column(Text, nullable=True) # More detailed role desc

    project = relationship("Project", back_populates="team_members")
    employee = relationship("Employee", back_populates="team_memberships")

class ProjectAttachment(Base):
    __tablename__ = "project_attachments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True) # "word", "pdf", "image"
    upload_date = Column(String, nullable=True) # storing as string ISO for simplicity

    project = relationship("Project", back_populates="attachments")
