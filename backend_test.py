#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Smile Dental Temps
Tests all authentication, job posting, and application endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def log_success(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
    
    def log_failure(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"TEST SUMMARY")
        print(f"{'='*50}")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*50}")

# Global test results
results = TestResults()

# Test data storage
test_data = {
    'client_token': None,
    'professional_token': None,
    'client_id': None,
    'professional_id': None,
    'job_id': None,
    'application_id': None
}

def test_client_registration():
    """Test client registration with dental office details"""
    url = f"{API_BASE}/auth/register"
    
    # Use timestamp to ensure unique email
    import time
    timestamp = int(time.time())
    
    client_data = {
        "email": f"drsmith{timestamp}@smiledental.com",
        "password": "SecurePass123!",
        "first_name": "Dr. John",
        "last_name": "Smith",
        "role": "client",
        "phone": "+1-555-0123",
        "dental_office_name": "Smile Dental Care",
        "office_address": "123 Main Street",
        "office_city": "San Francisco",
        "office_state": "CA",
        "office_zip": "94102",
        "office_latitude": 37.7749,
        "office_longitude": -122.4194
    }
    
    try:
        response = requests.post(url, json=client_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if all(key in data for key in ['access_token', 'token_type', 'user_role', 'user_id']):
                if data['user_role'] == 'client':
                    test_data['client_token'] = data['access_token']
                    test_data['client_id'] = data['user_id']
                    test_data['client_email'] = client_data['email']
                    results.log_success("Client Registration")
                else:
                    results.log_failure("Client Registration", f"Wrong user role: {data['user_role']}")
            else:
                results.log_failure("Client Registration", f"Missing required fields in response: {data}")
        else:
            results.log_failure("Client Registration", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Client Registration", f"Request failed: {str(e)}")

def test_professional_registration():
    """Test professional registration with profession details"""
    url = f"{API_BASE}/auth/register"
    
    # Use timestamp to ensure unique email
    import time
    timestamp = int(time.time())
    
    professional_data = {
        "email": f"sarah.johnson{timestamp}@email.com",
        "password": "HygienistPass456!",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "role": "professional",
        "phone": "+1-555-0456",
        "profession_type": "dental_hygienist",
        "license_number": "DH-CA-12345",
        "experience_years": 5
    }
    
    try:
        response = requests.post(url, json=professional_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if all(key in data for key in ['access_token', 'token_type', 'user_role', 'user_id']):
                if data['user_role'] == 'professional':
                    test_data['professional_token'] = data['access_token']
                    test_data['professional_id'] = data['user_id']
                    test_data['professional_email'] = professional_data['email']
                    results.log_success("Professional Registration")
                else:
                    results.log_failure("Professional Registration", f"Wrong user role: {data['user_role']}")
            else:
                results.log_failure("Professional Registration", f"Missing required fields in response: {data}")
        else:
            results.log_failure("Professional Registration", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Professional Registration", f"Request failed: {str(e)}")

def test_client_login():
    """Test client login"""
    if not test_data.get('client_email'):
        results.log_failure("Client Login", "No client email available from registration")
        return
        
    url = f"{API_BASE}/auth/login"
    
    login_data = {
        "email": test_data['client_email'],
        "password": "SecurePass123!"
    }
    
    try:
        response = requests.post(url, json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('user_role') == 'client' and 'access_token' in data:
                # Update token in case it's different from registration
                test_data['client_token'] = data['access_token']
                results.log_success("Client Login")
            else:
                results.log_failure("Client Login", f"Invalid login response: {data}")
        else:
            results.log_failure("Client Login", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Client Login", f"Request failed: {str(e)}")

def test_professional_login():
    """Test professional login"""
    if not test_data.get('professional_email'):
        results.log_failure("Professional Login", "No professional email available from registration")
        return
        
    url = f"{API_BASE}/auth/login"
    
    login_data = {
        "email": test_data['professional_email'],
        "password": "HygienistPass456!"
    }
    
    try:
        response = requests.post(url, json=login_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('user_role') == 'professional' and 'access_token' in data:
                # Update token in case it's different from registration
                test_data['professional_token'] = data['access_token']
                results.log_success("Professional Login")
            else:
                results.log_failure("Professional Login", f"Invalid login response: {data}")
        else:
            results.log_failure("Professional Login", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Professional Login", f"Request failed: {str(e)}")

def test_auth_me_client():
    """Test /auth/me endpoint with client token"""
    if not test_data['client_token']:
        results.log_failure("Client Auth Me", "No client token available")
        return
    
    url = f"{API_BASE}/auth/me"
    headers = {"Authorization": f"Bearer {test_data['client_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('role') == 'client' and 'dental_office_name' in data:
                results.log_success("Client Auth Me")
            else:
                results.log_failure("Client Auth Me", f"Invalid user data: {data}")
        else:
            results.log_failure("Client Auth Me", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Client Auth Me", f"Request failed: {str(e)}")

def test_auth_me_professional():
    """Test /auth/me endpoint with professional token"""
    if not test_data['professional_token']:
        results.log_failure("Professional Auth Me", "No professional token available")
        return
    
    url = f"{API_BASE}/auth/me"
    headers = {"Authorization": f"Bearer {test_data['professional_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('role') == 'professional' and 'profession_type' in data:
                results.log_success("Professional Auth Me")
            else:
                results.log_failure("Professional Auth Me", f"Invalid user data: {data}")
        else:
            results.log_failure("Professional Auth Me", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Professional Auth Me", f"Request failed: {str(e)}")

def test_create_job_posting():
    """Test job posting creation by client"""
    if not test_data['client_token']:
        results.log_failure("Create Job Posting", "No client token available")
        return
    
    url = f"{API_BASE}/jobs"
    headers = {"Authorization": f"Bearer {test_data['client_token']}"}
    
    # Job for tomorrow
    tomorrow = datetime.now() + timedelta(days=1)
    
    job_data = {
        "title": "Dental Hygienist Needed - Urgent",
        "job_type": "dental_hygienist",
        "description": "We need an experienced dental hygienist for a full day of cleanings and patient care.",
        "hourly_rate": 45.00,
        "location_address": "123 Main Street",
        "location_city": "San Francisco",
        "location_state": "CA",
        "location_zip": "94102",
        "location_latitude": 37.7749,
        "location_longitude": -122.4194,
        "job_date": tomorrow.isoformat(),
        "start_time": "08:00",
        "end_time": "17:00",
        "is_recurring": False
    }
    
    try:
        response = requests.post(url, json=job_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and data.get('job_type') == 'dental_hygienist':
                test_data['job_id'] = data['id']
                results.log_success("Create Job Posting")
            else:
                results.log_failure("Create Job Posting", f"Invalid job data: {data}")
        else:
            results.log_failure("Create Job Posting", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Create Job Posting", f"Request failed: {str(e)}")

def test_get_all_jobs():
    """Test getting all job listings"""
    if not test_data['professional_token']:
        results.log_failure("Get All Jobs", "No professional token available")
        return
    
    url = f"{API_BASE}/jobs"
    headers = {"Authorization": f"Bearer {test_data['professional_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if our created job is in the list
                job_found = any(job.get('id') == test_data['job_id'] for job in data)
                if job_found:
                    results.log_success("Get All Jobs")
                else:
                    results.log_failure("Get All Jobs", "Created job not found in job listings")
            else:
                results.log_failure("Get All Jobs", f"Expected list of jobs, got: {data}")
        else:
            results.log_failure("Get All Jobs", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Get All Jobs", f"Request failed: {str(e)}")

def test_get_my_job_postings():
    """Test client getting their own job postings"""
    if not test_data['client_token']:
        results.log_failure("Get My Job Postings", "No client token available")
        return
    
    url = f"{API_BASE}/jobs/my-postings"
    headers = {"Authorization": f"Bearer {test_data['client_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if our created job is in the list
                job_found = any(job.get('id') == test_data['job_id'] for job in data)
                if job_found:
                    results.log_success("Get My Job Postings")
                else:
                    results.log_failure("Get My Job Postings", "Created job not found in client's postings")
            else:
                results.log_failure("Get My Job Postings", f"Expected list of jobs, got: {data}")
        else:
            results.log_failure("Get My Job Postings", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Get My Job Postings", f"Request failed: {str(e)}")

def test_apply_to_job():
    """Test professional applying to a job"""
    if not test_data['professional_token'] or not test_data['job_id']:
        results.log_failure("Apply to Job", "Missing professional token or job ID")
        return
    
    url = f"{API_BASE}/jobs/{test_data['job_id']}/apply"
    headers = {"Authorization": f"Bearer {test_data['professional_token']}"}
    
    application_data = {
        "job_id": test_data['job_id'],
        "message": "I am very interested in this position. I have 5 years of experience as a dental hygienist and am available for the requested date and time."
    }
    
    try:
        response = requests.post(url, json=application_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and data.get('job_id') == test_data['job_id']:
                test_data['application_id'] = data['id']
                results.log_success("Apply to Job")
            else:
                results.log_failure("Apply to Job", f"Invalid application data: {data}")
        else:
            results.log_failure("Apply to Job", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Apply to Job", f"Request failed: {str(e)}")

def test_get_my_applications():
    """Test professional getting their applications"""
    if not test_data['professional_token']:
        results.log_failure("Get My Applications", "No professional token available")
        return
    
    url = f"{API_BASE}/applications/my-applications"
    headers = {"Authorization": f"Bearer {test_data['professional_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if our application is in the list
                app_found = any(app.get('id') == test_data['application_id'] for app in data)
                if app_found:
                    results.log_success("Get My Applications")
                else:
                    results.log_failure("Get My Applications", "Created application not found in professional's applications")
            else:
                results.log_failure("Get My Applications", f"Expected list of applications, got: {data}")
        else:
            results.log_failure("Get My Applications", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Get My Applications", f"Request failed: {str(e)}")

def test_get_received_applications():
    """Test client getting received applications"""
    if not test_data['client_token']:
        results.log_failure("Get Received Applications", "No client token available")
        return
    
    url = f"{API_BASE}/applications/received"
    headers = {"Authorization": f"Bearer {test_data['client_token']}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if our application is in the list
                app_found = any(app.get('id') == test_data['application_id'] for app in data)
                if app_found:
                    results.log_success("Get Received Applications")
                else:
                    results.log_failure("Get Received Applications", "Created application not found in client's received applications")
            else:
                results.log_failure("Get Received Applications", f"Expected list of applications, got: {data}")
        else:
            results.log_failure("Get Received Applications", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Get Received Applications", f"Request failed: {str(e)}")

def test_job_filters():
    """Test job filtering functionality"""
    if not test_data['professional_token']:
        results.log_failure("Job Filters", "No professional token available")
        return
    
    url = f"{API_BASE}/jobs"
    headers = {"Authorization": f"Bearer {test_data['professional_token']}"}
    
    # Test filtering by job type
    params = {"job_type": "dental_hygienist"}
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                # All jobs should be dental_hygienist type
                all_correct_type = all(job.get('job_type') == 'dental_hygienist' for job in data)
                if all_correct_type:
                    results.log_success("Job Filters")
                else:
                    results.log_failure("Job Filters", "Filter not working correctly - found jobs with wrong type")
            else:
                results.log_failure("Job Filters", f"Expected list of jobs, got: {data}")
        else:
            results.log_failure("Job Filters", f"HTTP {response.status_code}: {response.text}")
    
    except Exception as e:
        results.log_failure("Job Filters", f"Request failed: {str(e)}")

def run_all_tests():
    """Run all backend API tests in sequence"""
    print("Starting Smile Dental Temps Backend API Tests...")
    print(f"Backend URL: {API_BASE}")
    print("="*50)
    
    # Authentication tests
    print("\n🔐 AUTHENTICATION TESTS")
    test_client_registration()
    test_professional_registration()
    test_client_login()
    test_professional_login()
    test_auth_me_client()
    test_auth_me_professional()
    
    # Job posting tests
    print("\n💼 JOB POSTING TESTS")
    test_create_job_posting()
    test_get_all_jobs()
    test_get_my_job_postings()
    test_job_filters()
    
    # Application tests
    print("\n📝 APPLICATION TESTS")
    test_apply_to_job()
    test_get_my_applications()
    test_get_received_applications()
    
    # Print final results
    results.summary()
    
    return results.failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)