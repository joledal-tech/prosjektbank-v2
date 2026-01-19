from pydantic import BaseModel
from typing import Optional, List

# ProjectType Schemas
class ProjectTypeBase(BaseModel):
    name: str

class ProjectTypeCreate(ProjectTypeBase):
    pass

class ProjectType(ProjectTypeBase):
    id: int
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str # This is the string value, matching the Creatable Select logic
    location: str
    time_frame: Optional[str] = None
    relevance: Optional[str] = None
    challenges: Optional[str] = None # Added field
    relevance_role: Optional[str] = None
    contract_type: Optional[str] = None
    performed_by: Optional[str] = None
    area_m2: Optional[int] = None
    contract_value_mnok: Optional[float] = None
    certification: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    client: Optional[str] = None
    role_description: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = []

class ProjectCreate(ProjectBase):
    images: Optional[List[str]] = []

class ProjectUpdate(ProjectBase):
    images: Optional[List[str]] = None

# Image Schemas
class ProjectImageBase(BaseModel):
    url: str

class ProjectImageCreate(ProjectImageBase):
    pass

class ProjectImage(ProjectImageBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

# CV Section Schemas
class WorkExperienceBase(BaseModel):
    company: str
    title: str
    description: Optional[str] = None
    time_frame: Optional[str] = None

class WorkExperienceCreate(WorkExperienceBase):
    pass

class WorkExperience(WorkExperienceBase):
    id: int
    employee_id: int
    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    institution: str
    degree: str
    time_frame: Optional[str] = None

class EducationCreate(EducationBase):
    pass

class Education(EducationBase):
    id: int
    employee_id: int
    class Config:
        from_attributes = True

class CertificationBase(BaseModel):
    name: str
    year: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class Certification(CertificationBase):
    id: int
    employee_id: int
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    cv_link: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[List[str]] = []
    key_competencies: Optional[List[str]] = []

class EmployeeCreate(EmployeeBase):
    work_experiences: Optional[List[WorkExperienceCreate]] = []
    educations: Optional[List[EducationCreate]] = []
    certifications: Optional[List[CertificationCreate]] = []
    team_memberships: Optional[List['ProjectTeamMemberCreate']] = []

class EmployeeUpdate(EmployeeBase):
    work_experiences: Optional[List[WorkExperienceCreate]] = None
    educations: Optional[List[EducationCreate]] = None
    certifications: Optional[List[CertificationCreate]] = None
    team_memberships: Optional[List['ProjectTeamMemberCreate']] = None

class Employee(EmployeeBase):
    id: int
    work_experiences: List[WorkExperience] = []
    educations: List[Education] = []
    certifications: List[Certification] = []
    class Config:
        from_attributes = True

# Team Member Schemas
class ProjectTeamMemberBase(BaseModel):
    role: str
    cv_relevance: Optional[str] = None
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    role_summary: Optional[str] = None

class ProjectTeamMemberCreate(ProjectTeamMemberBase):
    id: Optional[int] = None
    employee_id: Optional[int] = None # If selecting existing
    new_employee: Optional[EmployeeCreate] = None # If creating new

class ProjectTeamMember(ProjectTeamMemberBase):
    id: int
    project_id: int
    employee_id: int
    employee: Employee
    
    class Config:
        from_attributes = True

# Extended schema for Employee Detail View to avoid circular dependency issues
# We need a simplified Project schema here or use ProjectBase
class ProjectTeamMemberWithProject(ProjectTeamMemberBase):
    id: int
    project_id: int
    project: ProjectBase # Minimal project info
    
    class Config:
        from_attributes = True

class EmployeeDetail(Employee):
    team_memberships: List[ProjectTeamMemberWithProject] = []


# Attachment Schemas
class ProjectAttachmentBase(BaseModel):
    filename: str
    file_path: str
    file_type: Optional[str] = None
    upload_date: Optional[str] = None

class ProjectAttachmentCreate(ProjectAttachmentBase):
    pass

class ProjectAttachment(ProjectAttachmentBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

class Project(ProjectBase):
    id: int
    images: List[ProjectImage] = []
    attachments: List[ProjectAttachment] = []
    team_members: List[ProjectTeamMember] = []
    
    class Config:
        from_attributes = True
