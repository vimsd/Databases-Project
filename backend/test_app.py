import pytest
import os
import json
from unittest.mock import patch, MagicMock
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_register_missing_fields(client):
    """
    1. test_register_missing_fields
    สิ่งที่ทำ: ตรวจสอบระบบการลงทะเบียนเมื่อผู้ใช้กรอกข้อมูลไม่ครบ (เช่น ส่งแค่ email แต่ไม่ส่ง password)
    ผลลัพธ์ที่คาดหวัง: ระบบต้องตอบกลับด้วย HTTP 400 และแจ้งเตือนให้กรอกข้อมูลให้ครบ
    """
    response = client.post('/api/register', json={
        "email": "test@gmail.com"
        # missing password
    })
    data = response.get_json()
    assert response.status_code == 400
    assert "Please provide all required fields" in data['message']

def test_register_invalid_email(client):
    """
    2. test_register_invalid_email
    สิ่งที่ทำ: ตรวจสอบการจำกัดโดเมนของอีเมลในการลงทะเบียน
    ผลลัพธ์ที่คาดหวัง: หากใช้อีเมลที่ไม่ใช่ @gmail.com ระบบต้องตอบกลับด้วย HTTP 400 และแจ้งว่าอนุญาตเฉพาะ Gmail เท่านั้น
    """
    response = client.post('/api/register', json={
        "email": "test@yahoo.com",
        "password": "password123"
    })
    data = response.get_json()
    assert response.status_code == 400
    assert "Only Gmail addresses are allowed (@gmail.com)" in data['message']

def test_login_missing_fields(client):
    """
    3. test_login_missing_fields
    สิ่งที่ทำ: ตรวจสอบระบบการเข้าสู่ระบบเมื่อผู้ใช้ส่งข้อมูลมาไม่ครบ
    ผลลัพธ์ที่คาดหวัง: ระบบต้องตอบกลับด้วย HTTP 400 และแจ้งให้ระบุทั้ง email และ password
    """
    response = client.post('/api/login', json={
        "email": "test@gmail.com"
        # missing password
    })
    data = response.get_json()
    assert response.status_code == 400
    assert "Please provide email and password" in data['message']

@patch('auth.get_connection')
def test_login_invalid_credentials(mock_get_connection, client):
    """
    4. test_login_invalid_credentials
    สิ่งที่ทำ: ตรวจสอบการเข้าสู่ระบบด้วยข้อมูลที่ผิด (เช่น รหัสผ่านผิด หรือไม่มีชื่อผู้ใช้นี้) โดยมีการจำลองการเชื่อมต่อฐานข้อมูล (Mocking)
    ผลลัพธ์ที่คาดหวัง: ระบบต้องตอบกลับด้วย HTTP 401 และแจ้งว่าข้อมูลรับรองไม่ถูกต้อง
    """
    # Mocking the connection and cursor
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_connection.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    
    # Simulate user not found (None)
    mock_cursor.fetchone.return_value = None
    
    response = client.post('/api/login', json={
        "email": "wrong@gmail.com",
        "password": "wrongpassword"
    })
    
    data = response.get_json()
    assert response.status_code == 401
    assert "Invalid credentials" in data['message']

@patch('app.os.path.exists')
def test_fallback_route(mock_exists, client):
    """
    5. test_fallback_route
    สิ่งที่ทำ: ตรวจสอบการจัดการเส้นทาง (Route) เมื่อมีการเรียกหน้าที่ไม่มีอยู่จริง หรือในกรณีที่ยังไม่ได้สร้างไฟล์หน้าบ้าน (Frontend)
    ผลลัพธ์ที่คาดหวัง: ระบบต้องตอบกลับด้วย HTTP 404 และแสดงข้อความ "Frontend not built" หรือข้อความแจ้งเตือนที่เหมาะสม
    """
    # Simulate that the frontend build directory/index.html does not exist
    mock_exists.return_value = False
    
    # Using a random route that doesn't exist among the API routes or static files
    response = client.get('/some-random-route-that-does-not-exist')
    
    # Based on app.py, if frontend build isn't found, it returns ("Frontend not built", 404)
    assert response.status_code == 404
    assert b"Frontend not built" in response.data
