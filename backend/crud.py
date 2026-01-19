from sqlalchemy.orm import Session
import models
import schemas

def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    # Check if project type exists, if not create it (auto-add to ProjectType list)
    # This logic supports the "Creatable Select" where new types are added to the list
    existing_type = db.query(models.ProjectType).filter(models.ProjectType.name == project.type).first()
    if not existing_type:
        new_type = models.ProjectType(name=project.type)
        db.add(new_type)
        # We don't commit here yet, can commit with the project or flush. 
        # Safest to just add it to session.

    # Separate images from project data before creating Project
    project_data = project.dict()
    images = project_data.pop('images', [])
    
    db_project = models.Project(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Create ProjectImage records for extracted images
    if images:
        for img_url in images:
            db_image = models.ProjectImage(url=img_url, project_id=db_project.id)
            db.add(db_image)
        db.commit()
        db.refresh(db_project) # Refresh again to load relationships if needed
        
    return db_project

def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        # Also check type for update
        existing_type = db.query(models.ProjectType).filter(models.ProjectType.name == project.type).first()
        if not existing_type:
            new_type = models.ProjectType(name=project.type)
            db.add(new_type)
            
        update_data = project.dict(exclude_unset=True)
        
        # Handle images if present
        if 'images' in update_data:
            images = update_data.pop('images')
            # Clear existing images
            db.query(models.ProjectImage).filter(models.ProjectImage.project_id == project_id).delete()
            # Add new images
            if images:
                for img_url in images:
                    db_image = models.ProjectImage(url=img_url, project_id=project_id)
                    db.add(db_image)
        
        for key, value in update_data.items():
            setattr(db_project, key, value)
            
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        db.delete(db_project)
        db.commit()
    return db_project

def get_project_types(db: Session):
    return db.query(models.ProjectType).all()

# Employee CRUD
def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    emp_data = employee.dict()
    work_exp = emp_data.pop('work_experiences', [])
    educations = emp_data.pop('educations', [])
    certifications = emp_data.pop('certifications', [])
    
    db_employee = models.Employee(**emp_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    for item in work_exp:
        db.add(models.WorkExperience(**item, employee_id=db_employee.id))
    for item in educations:
        db.add(models.Education(**item, employee_id=db_employee.id))
    for item in certifications:
        db.add(models.Certification(**item, employee_id=db_employee.id))
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id).first()

def update_employee(db: Session, employee_id: int, employee: schemas.EmployeeUpdate):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = employee.dict(exclude_unset=True)
    
    # Handle nested fields if present
    if 'work_experiences' in update_data:
        work_exp = update_data.pop('work_experiences')
        db.query(models.WorkExperience).filter(models.WorkExperience.employee_id == employee_id).delete()
        if work_exp:
            for item in work_exp:
                db.add(models.WorkExperience(**item, employee_id=employee_id))
                
    if 'educations' in update_data:
        educations = update_data.pop('educations')
        db.query(models.Education).filter(models.Education.employee_id == employee_id).delete()
        if educations:
            for item in educations:
                db.add(models.Education(**item, employee_id=employee_id))
                
    if 'certifications' in update_data:
        certifications = update_data.pop('certifications')
        db.query(models.Certification).filter(models.Certification.employee_id == employee_id).delete()
        if certifications:
            for item in certifications:
                db.add(models.Certification(**item, employee_id=employee_id))

    if 'team_memberships' in update_data:
        tm_data = update_data.pop('team_memberships')
        for item in tm_data:
            tm_id = item.get('id')
            if tm_id:
                db_tm = db.query(models.ProjectTeamMember).filter(models.ProjectTeamMember.id == tm_id).first()
                if db_tm:
                    for k, v in item.items():
                        if k not in ['id', 'project_id', 'employee_id', 'project', 'employee']:
                            setattr(db_tm, k, v)

    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

def add_team_member(db: Session, project_id: int, member: schemas.ProjectTeamMemberCreate):
    # Logic: 
    # 1. If employee_id is provided, use that.
    # 2. If new_employee provided, create employee first.
    
    emp_id = member.employee_id
    
    if member.new_employee:
        # Create new employee
        new_emp = models.Employee(**member.new_employee.dict())
        db.add(new_emp)
        db.commit()
        db.refresh(new_emp)
        emp_id = new_emp.id
        
    if not emp_id:
        return None # Should probably raise error
        
    # Create relationship
    db_member = models.ProjectTeamMember(
        project_id=project_id,
        employee_id=emp_id,
        role=member.role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def create_project_attachment(db: Session, attachment: schemas.ProjectAttachmentCreate, project_id: int):
    db_attachment = models.ProjectAttachment(**attachment.dict(), project_id=project_id)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

def delete_project_attachment(db: Session, attachment_id: int):
    db_attachment = db.query(models.ProjectAttachment).filter(models.ProjectAttachment.id == attachment_id).first()
    if db_attachment:
        db.delete(db_attachment)
        db.commit()
    return db_attachment
