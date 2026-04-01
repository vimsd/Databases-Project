import unittest
from unittest.mock import patch, MagicMock
from app import app
import json

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    # Test Case 1: Register with missing fields
    def test_register_missing_fields(self):
        response = self.app.post('/api/register', json={"email": "test@gmail.com"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Please provide all required fields")

    # Test Case 2: Register with invalid email domain
    def test_register_invalid_email(self):
        response = self.app.post('/api/register', json={"email": "test@yahoo.com", "password": "pass"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Only Gmail addresses are allowed (@gmail.com)")

    # Test Case 3: Login with missing fields
    def test_login_missing_fields(self):
        response = self.app.post('/api/login', json={"email": "test@gmail.com"})
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Please provide email and password")

    # Test Case 4: Login with invalid credentials (mocking DB connection)
    @patch('auth.get_connection')
    def test_login_invalid_credentials(self, mock_get_conn):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None  # user not found

        response = self.app.post('/api/login', json={"email": "wrong@gmail.com", "password": "wrong"})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data["message"], "Invalid credentials")

    # Test Case 5: Route fallback testing (when frontend is not built)
    @patch('app.os.path.exists')
    def test_fallback_route(self, mock_exists):
        mock_exists.return_value = False
        response = self.app.get('/something-random')
        self.assertEqual(response.status_code, 404)
        self.assertIn(b"Frontend not built", response.data)

if __name__ == '__main__':
    unittest.main()
