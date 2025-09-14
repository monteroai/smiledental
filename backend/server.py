from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return user

# Models
class UserRole(BaseModel):
    name: str  # "client" or "professional"

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str  # "client" or "professional"
    phone: Optional[str] = None
    # Professional specific fields
    profession_type: Optional[str] = None  # "dental_hygienist", "dentist", "dental_assistant", "front_desk"
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    # Client specific fields
    dental_office_name: Optional[str] = None
    office_address: Optional[str] = None
    office_city: Optional[str] = None
    office_state: Optional[str] = None
    office_zip: Optional[str] = None
    office_latitude: Optional[float] = None
    office_longitude: Optional[float] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    user_id: str

class JobPosting(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    title: str
    job_type: str  # "dental_hygienist", "dentist", "dental_assistant", "front_desk"
    description: Optional[str] = None
    hourly_rate: float
    location_address: str
    location_city: str
    location_state: str
    location_zip: str
    location_latitude: float
    location_longitude: float
    # Date and time fields
    job_date: datetime
    start_time: str  # "09:00"
    end_time: str    # "17:00"
    # Recurring job fields
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None  # "daily", "weekly", "monthly"
    recurring_days: Optional[List[str]] = None  # For weekly: ["monday", "tuesday"]
    recurring_end_date: Optional[datetime] = None
    # Status and metadata
    status: str = "active"  # "active", "filled", "cancelled"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    applications_count: int = 0

class JobPostingCreate(BaseModel):
    title: str
    job_type: str
    description: Optional[str] = None
    hourly_rate: float
    location_address: str
    location_city: str
    location_state: str
    location_zip: str
    location_latitude: float
    location_longitude: float
    job_date: datetime
    start_time: str
    end_time: str
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None
    recurring_days: Optional[List[str]] = None
    recurring_end_date: Optional[datetime] = None

class JobApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    professional_id: str
    client_id: str
    message: Optional[str] = None
    status: str = "pending"  # "pending", "accepted", "rejected"
    applied_at: datetime = Field(default_factory=datetime.utcnow)

class JobApplicationCreate(BaseModel):
    job_id: str
    message: Optional[str] = None

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register_user(user_data: UserRegistration):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "phone": user_data.phone,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Add role-specific fields
    if user_data.role == "professional":
        user_doc.update({
            "profession_type": user_data.profession_type,
            "license_number": user_data.license_number,
            "experience_years": user_data.experience_years
        })
    elif user_data.role == "client":
        user_doc.update({
            "dental_office_name": user_data.dental_office_name,
            "office_address": user_data.office_address,
            "office_city": user_data.office_city,
            "office_state": user_data.office_state,
            "office_zip": user_data.office_zip,
            "office_latitude": user_data.office_latitude,
            "office_longitude": user_data.office_longitude
        })
    
    # Insert user
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_role=user_data.role,
        user_id=user_id
    )

@api_router.post("/auth/login", response_model=Token)
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_role=user["role"],
        user_id=str(user["_id"])
    )

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    # Remove password hash from response and convert ObjectId to string
    user_info = {k: v for k, v in current_user.items() if k not in ["password_hash", "_id"]}
    user_info["id"] = str(current_user["_id"])
    return user_info

# Job posting endpoints
@api_router.post("/jobs", response_model=JobPosting)
async def create_job_posting(job_data: JobPostingCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can post jobs"
        )
    
    job_doc = job_data.dict()
    job_doc["client_id"] = str(current_user["_id"])
    job_doc["id"] = str(uuid.uuid4())
    job_doc["created_at"] = datetime.utcnow()
    job_doc["applications_count"] = 0
    job_doc["status"] = "active"
    
    # Insert job
    await db.jobs.insert_one(job_doc)
    
    return JobPosting(**job_doc)

@api_router.get("/jobs", response_model=List[JobPosting])
async def get_jobs(
    job_type: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    filter_query = {"status": "active"}
    
    if job_type:
        filter_query["job_type"] = job_type
    if city:
        filter_query["location_city"] = {"$regex": city, "$options": "i"}
    if state:
        filter_query["location_state"] = {"$regex": state, "$options": "i"}
    
    jobs = await db.jobs.find(filter_query).to_list(1000)
    return [JobPosting(**job) for job in jobs]

@api_router.get("/jobs/my-postings", response_model=List[JobPosting])
async def get_my_job_postings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can view their job postings"
        )
    
    jobs = await db.jobs.find({"client_id": str(current_user["_id"])}).to_list(1000)
    return [JobPosting(**job) for job in jobs]

# Job application endpoints
@api_router.post("/jobs/{job_id}/apply", response_model=JobApplication)
async def apply_to_job(job_id: str, application_data: JobApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "professional":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professionals can apply to jobs"
        )
    
    # Check if job exists
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if already applied
    existing_application = await db.applications.find_one({
        "job_id": job_id,
        "professional_id": str(current_user["_id"])
    })
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
    
    # Create application
    application_doc = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "professional_id": str(current_user["_id"]),
        "client_id": job["client_id"],
        "message": application_data.message,
        "status": "pending",
        "applied_at": datetime.utcnow()
    }
    
    # Insert application
    await db.applications.insert_one(application_doc)
    
    # Update job applications count
    await db.jobs.update_one(
        {"id": job_id},
        {"$inc": {"applications_count": 1}}
    )
    
    return JobApplication(**application_doc)

@api_router.get("/applications/my-applications", response_model=List[Dict[str, Any]])
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "professional":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professionals can view their applications"
        )
    
    # Get applications with job details
    pipeline = [
        {"$match": {"professional_id": str(current_user["_id"])}},
        {"$lookup": {
            "from": "jobs",
            "localField": "job_id",
            "foreignField": "id",
            "as": "job_details"
        }},
        {"$unwind": "$job_details"}
    ]
    
    applications = await db.applications.aggregate(pipeline).to_list(1000)
    return applications

@api_router.get("/applications/received", response_model=List[Dict[str, Any]])
async def get_received_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can view received applications"
        )
    
    # Get applications for client's jobs with professional details
    pipeline = [
        {"$match": {"client_id": str(current_user["_id"])}},
        {"$lookup": {
            "from": "jobs",
            "localField": "job_id",
            "foreignField": "id",
            "as": "job_details"
        }},
        {"$lookup": {
            "from": "users",
            "localField": "professional_id",
            "foreignField": "_id",
            "as": "professional_details"
        }},
        {"$unwind": "$job_details"},
        {"$unwind": "$professional_details"}
    ]
    
    applications = await db.applications.aggregate(pipeline).to_list(1000)
    
    # Clean up professional details (remove sensitive info)
    for app in applications:
        if "professional_details" in app:
            prof = app["professional_details"]
            app["professional_details"] = {
                "first_name": prof.get("first_name"),
                "last_name": prof.get("last_name"),
                "email": prof.get("email"),
                "phone": prof.get("phone"),
                "profession_type": prof.get("profession_type"),
                "experience_years": prof.get("experience_years")
            }
    
    return applications

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()