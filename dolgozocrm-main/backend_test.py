import requests
import sys
import json
from datetime import datetime

class DolgozoCRMTester:
    def __init__(self):
        self.base_url = "https://hr-workforce-1.preview.emergentagent.com/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials
        self.admin_creds = {"email": "admin@dolgozocrm.hu", "password": "admin123"}
        self.user_creds = {"email": "toborzo@dolgozocrm.hu", "password": "toborzo123"}
        
        # Test data IDs will be stored here
        self.test_data = {
            "worker_type_id": None,
            "status_id": None,
            "tag_id": None,
            "worker_id": None,
            "project_id": None
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "PASS"
        else:
            status = "FAIL"
        
        result = {
            "test": name,
            "status": status,
            "details": details
        }
        self.test_results.append(result)
        print(f"[{status}] {name}" + (f" - {details}" if details else ""))
        return success

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            return success, response.json() if success else response.text, response.status_code
            
        except Exception as e:
            return False, str(e), 0

    def test_health_endpoint(self):
        """Test basic health check"""
        success, data, status = self.make_request('GET', '')
        return self.log_test("Health check", success, f"Status: {status}")

    def test_seed_data(self):
        """Initialize seed data"""
        success, data, status = self.make_request('POST', 'seed')
        # 200 = seeded, 409 = already exists - both OK
        success = status in [200, 409]
        return self.log_test("Seed data initialization", success, f"Status: {status}")

    def test_admin_login(self):
        """Test admin login"""
        success, data, status = self.make_request('POST', 'auth/login', self.admin_creds)
        if success and 'token' in data:
            self.admin_token = data['token']
            user = data.get('user', {})
            success = user.get('role') == 'admin'
            details = f"Role: {user.get('role')}, Email: {user.get('email')}"
        else:
            details = f"Status: {status}, Data: {data}"
            
        return self.log_test("Admin login", success, details)

    def test_user_login(self):
        """Test user (toborzó) login"""
        success, data, status = self.make_request('POST', 'auth/login', self.user_creds)
        if success and 'token' in data:
            self.user_token = data['token']
            user = data.get('user', {})
            success = user.get('role') == 'user'
            details = f"Role: {user.get('role')}, Email: {user.get('email')}"
        else:
            details = f"Status: {status}, Data: {data}"
            
        return self.log_test("User (Toborzó) login", success, details)

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint"""
        success, data, status = self.make_request('GET', 'auth/me', token=self.admin_token)
        if success:
            details = f"User: {data.get('name', data.get('email'))}, Role: {data.get('role')}"
        else:
            details = f"Status: {status}"
        return self.log_test("Get current user info", success, details)

    def test_worker_types_crud(self):
        """Test worker types CRUD operations"""
        # Get existing types
        success, data, status = self.make_request('GET', 'worker-types', token=self.admin_token)
        if not self.log_test("Get worker types", success, f"Found {len(data) if success else 0} types"):
            return False

        # Create new type (admin only)
        new_type_data = {"name": "Test Munkás"}
        success, data, status = self.make_request('POST', 'worker-types', new_type_data, self.admin_token, 200)
        if success:
            self.test_data["worker_type_id"] = data.get('id')
        self.log_test("Create worker type (admin)", success, f"Created ID: {data.get('id') if success else 'N/A'}")

        # Try to create type as user (should fail)
        success, data, status = self.make_request('POST', 'worker-types', new_type_data, self.user_token, 403)
        self.log_test("Create worker type (user - should fail)", success, f"Status: {status}")

        # Delete type (admin only)
        if self.test_data["worker_type_id"]:
            success, data, status = self.make_request('DELETE', f'worker-types/{self.test_data["worker_type_id"]}', token=self.admin_token)
            self.log_test("Delete worker type", success, f"Status: {status}")

        return True

    def test_statuses_crud(self):
        """Test statuses CRUD operations"""
        # Get existing statuses
        success, data, status = self.make_request('GET', 'statuses', token=self.admin_token)
        if success and len(data) > 0:
            self.test_data["status_id"] = data[0]['id']
        self.log_test("Get statuses", success, f"Found {len(data) if success else 0} statuses")

        # Create new status (admin only)
        new_status_data = {"name": "Test Státusz"}
        success, data, status = self.make_request('POST', 'statuses', new_status_data, self.admin_token, 200)
        test_status_id = data.get('id') if success else None
        self.log_test("Create status (admin)", success, f"Created ID: {test_status_id}")

        # Try to create status as user (should fail)
        success, data, status = self.make_request('POST', 'statuses', new_status_data, self.user_token, 403)
        self.log_test("Create status (user - should fail)", success, f"Status: {status}")

        # Delete test status
        if test_status_id:
            success, data, status = self.make_request('DELETE', f'statuses/{test_status_id}', token=self.admin_token)
            self.log_test("Delete status", success, f"Status: {status}")

        return True

    def test_tags_crud(self):
        """Test tags CRUD operations"""
        # Get existing tags
        success, data, status = self.make_request('GET', 'tags', token=self.admin_token)
        if success and len(data) > 0:
            self.test_data["tag_id"] = data[0]['id']
        self.log_test("Get tags", success, f"Found {len(data) if success else 0} tags")

        # Create new tag (admin only)
        new_tag_data = {"name": "Test Tag", "color": "#ff0000"}
        success, data, status = self.make_request('POST', 'tags', new_tag_data, self.admin_token, 200)
        test_tag_id = data.get('id') if success else None
        self.log_test("Create tag (admin)", success, f"Created ID: {test_tag_id}")

        # Delete test tag
        if test_tag_id:
            success, data, status = self.make_request('DELETE', f'tags/{test_tag_id}', token=self.admin_token)
            self.log_test("Delete tag", success, f"Status: {status}")

        return True

    def test_workers_crud(self):
        """Test workers CRUD operations"""
        if not self.test_data["worker_type_id"]:
            # Get first available worker type
            success, data, status = self.make_request('GET', 'worker-types', token=self.admin_token)
            if success and len(data) > 0:
                self.test_data["worker_type_id"] = data[0]['id']

        # Create worker
        worker_data = {
            "name": "Teszt Dolgozó",
            "phone": "+36301234567",
            "worker_type_id": self.test_data["worker_type_id"],
            "category": "Felvitt dolgozók",
            "address": "Budapest",
            "email": "teszt@example.com"
        }
        
        success, data, status = self.make_request('POST', 'workers', worker_data, self.user_token, 200)
        if success:
            self.test_data["worker_id"] = data.get('id')
        self.log_test("Create worker", success, f"Created ID: {data.get('id') if success else 'N/A'}")

        # Get workers (user should see only their own)
        success, data, status = self.make_request('GET', 'workers', token=self.user_token)
        user_workers_count = len(data) if success else 0
        self.log_test("Get workers (as user)", success, f"User sees {user_workers_count} workers")

        # Get workers (admin should see all + owner filter)
        success, data, status = self.make_request('GET', 'workers', token=self.admin_token)
        admin_workers_count = len(data) if success else 0
        self.log_test("Get workers (as admin)", success, f"Admin sees {admin_workers_count} workers")

        # Get specific worker
        if self.test_data["worker_id"]:
            success, data, status = self.make_request('GET', f'workers/{self.test_data["worker_id"]}', token=self.user_token)
            self.log_test("Get specific worker", success, f"Worker: {data.get('name') if success else 'N/A'}")

            # Update worker
            update_data = {"name": "Teszt Dolgozó Frissítve"}
            success, data, status = self.make_request('PUT', f'workers/{self.test_data["worker_id"]}', update_data, self.user_token)
            self.log_test("Update worker", success, f"Updated name: {data.get('name') if success else 'N/A'}")

        return True

    def test_worker_permissions(self):
        """Test worker permission restrictions"""
        if not self.test_data["worker_id"]:
            return False

        # User should NOT be able to delete worker
        success, data, status = self.make_request('DELETE', f'workers/{self.test_data["worker_id"]}', token=self.user_token, expected_status=403)
        self.log_test("Delete worker (user - should fail)", success, f"Status: {status}")

        # Admin SHOULD be able to delete worker
        success, data, status = self.make_request('DELETE', f'workers/{self.test_data["worker_id"]}', token=self.admin_token)
        self.log_test("Delete worker (admin)", success, f"Status: {status}")

        return True

    def test_projects_crud(self):
        """Test projects CRUD operations"""
        # Create project with expected_workers
        project_data = {
            "name": "Teszt Projekt",
            "date": "2024-12-31",
            "location": "Budapest",
            "notes": "Test project notes",
            "expected_workers": 5
        }
        
        success, data, status = self.make_request('POST', 'projects', project_data, self.user_token, 200)
        if success:
            self.test_data["project_id"] = data.get('id')
            # Check if expected_workers is included in response
            expected_workers = data.get('expected_workers', 0)
            self.log_test("Create project with expected_workers", 
                         expected_workers == 5, 
                         f"Expected workers: {expected_workers}")
        self.log_test("Create project", success, f"Created ID: {data.get('id') if success else 'N/A'}")

        # Get projects
        success, data, status = self.make_request('GET', 'projects', token=self.user_token)
        self.log_test("Get projects", success, f"Found {len(data) if success else 0} projects")

        # Get specific project - check expected_workers and worker_count fields
        if self.test_data["project_id"]:
            success, data, status = self.make_request('GET', f'projects/{self.test_data["project_id"]}', token=self.user_token)
            if success:
                has_expected = 'expected_workers' in data
                has_count = 'worker_count' in data
                self.log_test("Project has expected_workers field", has_expected, f"Expected: {data.get('expected_workers')}")
                self.log_test("Project has worker_count field", has_count, f"Count: {data.get('worker_count')}")
            self.log_test("Get specific project", success, f"Project: {data.get('name') if success else 'N/A'}")

            # Update project expected_workers
            update_data = {"name": "Teszt Projekt Frissítve", "expected_workers": 8}
            success, data, status = self.make_request('PUT', f'projects/{self.test_data["project_id"]}', update_data, self.user_token)
            if success:
                updated_expected = data.get('expected_workers', 0)
                self.log_test("Update project expected_workers", 
                             updated_expected == 8, 
                             f"Updated expected: {updated_expected}")
            self.log_test("Update project", success, f"Updated name: {data.get('name') if success else 'N/A'}")

        return True

    def test_project_worker_assignment(self):
        """Test adding workers to projects"""
        if not self.test_data["project_id"]:
            return False

        # Create a new worker for assignment test
        worker_data = {
            "name": "Projekt Teszt Dolgozó", 
            "phone": "+36301234568",
            "worker_type_id": self.test_data["worker_type_id"],
            "category": "Felvitt dolgozók"
        }
        success, data, status = self.make_request('POST', 'workers', worker_data, self.user_token, 200)
        if not success:
            return self.log_test("Create worker for project test", False, "Could not create test worker")
        
        test_worker_id = data.get('id')

        # Add worker to project
        assignment_data = {"worker_id": test_worker_id, "status_id": self.test_data["status_id"]}
        success, data, status = self.make_request('POST', f'projects/{self.test_data["project_id"]}/workers', assignment_data, self.user_token)
        self.log_test("Add worker to project", success, f"Status: {status}")

        # Update worker status in project
        if success and self.test_data["status_id"]:
            status_update_data = {"status_id": self.test_data["status_id"]}
            success, data, status = self.make_request('PUT', f'projects/{self.test_data["project_id"]}/workers/{test_worker_id}/status', status_update_data, self.user_token)
            self.log_test("Update worker status in project", success, f"Status: {status}")

        # Remove worker from project
        success, data, status = self.make_request('DELETE', f'projects/{self.test_data["project_id"]}/workers/{test_worker_id}', token=self.user_token)
        self.log_test("Remove worker from project", success, f"Status: {status}")

        # Clean up test worker
        requests.delete(f"{self.base_url}/workers/{test_worker_id}", headers={'Authorization': f'Bearer {self.admin_token}'})

        return True

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        # Get users (admin only)
        success, data, status = self.make_request('GET', 'users', token=self.admin_token)
        self.log_test("Get users (admin)", success, f"Found {len(data) if success else 0} users")

        # Try to get users as regular user (should fail)
        success, data, status = self.make_request('GET', 'users', token=self.user_token, expected_status=403)
        self.log_test("Get users (user - should fail)", success, f"Status: {status}")

        # Get user stats (admin only)
        success, data, status = self.make_request('GET', 'users/stats', token=self.admin_token)
        self.log_test("Get user stats (admin)", success, f"Found {len(data) if success else 0} stats")

        return True

    def test_profile_and_password(self):
        """Test profile and password change"""
        # Update profile
        profile_data = {"name": "Updated Admin Name"}
        success, data, status = self.make_request('PUT', 'auth/profile', profile_data, self.admin_token)
        self.log_test("Update profile", success, f"Status: {status}")

        # Change password (with wrong current password - should fail)
        wrong_password_data = {"current_password": "wrongpassword", "new_password": "newpassword123"}
        success, data, status = self.make_request('PUT', 'auth/password', wrong_password_data, self.admin_token, expected_status=400)
        self.log_test("Change password (wrong current - should fail)", success, f"Status: {status}")

        return True

    def test_excel_export(self):
        """Test Excel export functionality"""
        # Test worker export for current user
        try:
            response = requests.get(f"{self.base_url}/export/workers", 
                                  headers={'Authorization': f'Bearer {self.user_token}'}, 
                                  timeout=10)
            success = response.status_code == 200
            content_type = response.headers.get('content-type', '')
            is_excel = 'spreadsheet' in content_type or 'excel' in content_type
            file_size = len(response.content) if success else 0
            
            self.log_test("Export workers Excel (user)", 
                         success and is_excel, 
                         f"Status: {response.status_code}, Size: {file_size} bytes, Type: {content_type}")
                         
        except Exception as e:
            self.log_test("Export workers Excel (user)", False, f"Error: {str(e)}")

        # Test admin export for specific user (if we have user data)
        if self.admin_token:
            try:
                # Get users first to get a user ID
                users_response = requests.get(f"{self.base_url}/users", 
                                            headers={'Authorization': f'Bearer {self.admin_token}'})
                if users_response.status_code == 200:
                    users = users_response.json()
                    if users:
                        user_id = users[0]['id']
                        response = requests.get(f"{self.base_url}/export/workers/{user_id}", 
                                              headers={'Authorization': f'Bearer {self.admin_token}'}, 
                                              timeout=10)
                        success = response.status_code == 200
                        content_type = response.headers.get('content-type', '')
                        is_excel = 'spreadsheet' in content_type or 'excel' in content_type
                        file_size = len(response.content) if success else 0
                        
                        self.log_test("Export user workers Excel (admin)", 
                                     success and is_excel, 
                                     f"Status: {response.status_code}, Size: {file_size} bytes")
                        
            except Exception as e:
                self.log_test("Export user workers Excel (admin)", False, f"Error: {str(e)}")

        # Test admin export all workers
        if self.admin_token:
            try:
                response = requests.get(f"{self.base_url}/export/all", 
                                      headers={'Authorization': f'Bearer {self.admin_token}'}, 
                                      timeout=15)  # Longer timeout for large export
                success = response.status_code == 200
                content_type = response.headers.get('content-type', '')
                is_excel = 'spreadsheet' in content_type or 'excel' in content_type
                file_size = len(response.content) if success else 0
                
                self.log_test("Export all workers Excel (admin)", 
                             success and is_excel, 
                             f"Status: {response.status_code}, Size: {file_size} bytes")
                             
            except Exception as e:
                self.log_test("Export all workers Excel (admin)", False, f"Error: {str(e)}")

        # Test user trying to access admin export (should fail)
        try:
            response = requests.get(f"{self.base_url}/export/all", 
                                  headers={'Authorization': f'Bearer {self.user_token}'}, 
                                  timeout=10)
            success = response.status_code == 403
            self.log_test("Export all workers (user - should fail)", success, f"Status: {response.status_code}")
                             
        except Exception as e:
            self.log_test("Export all workers (user - should fail)", False, f"Error: {str(e)}")

        return True

    def cleanup_test_data(self):
        """Clean up any remaining test data"""
        if self.test_data["project_id"]:
            requests.delete(f"{self.base_url}/projects/{self.test_data['project_id']}", 
                          headers={'Authorization': f'Bearer {self.admin_token}'})

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Dolgozó CRM API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_endpoint():
            print("❌ Health check failed - stopping tests")
            return False
            
        if not self.test_seed_data():
            print("❌ Seed data failed - stopping tests")
            return False

        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ User login failed - stopping tests")  
            return False

        self.test_auth_me_endpoint()

        # CRUD operations
        self.test_worker_types_crud()
        self.test_statuses_crud()
        self.test_tags_crud()
        self.test_workers_crud()
        self.test_worker_permissions()
        self.test_projects_crud()
        self.test_project_worker_assignment()
        
        # Admin functions
        self.test_admin_endpoints()
        self.test_profile_and_password()
        
        # Excel export tests
        self.test_excel_export()

        # Cleanup
        self.cleanup_test_data()

        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   - {result['test']}: {result['details']}")

        return self.tests_passed == self.tests_run

def main():
    tester = DolgozoCRMTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())