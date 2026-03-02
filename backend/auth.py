from flask import Blueprint, request, jsonify
from db import get_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Please provide all required fields"}), 400

    email = data['email']
    password = data['password']

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({"message": "Email is already in use"}), 409

            from werkzeug.security import generate_password_hash
            hashed_password = generate_password_hash(password)

            # new users start with a small balance so they can pay later
            sql = "INSERT INTO users (email, password, balance) VALUES (%s, %s, %s)"
            cursor.execute(sql, (email, hashed_password, 1000.00))
            
            user_id = cursor.lastrowid
        
        conn.commit()
        return jsonify({"message": "Register success", "user_id": user_id, "balance": 1000.00}), 201

    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        if 'conn' in locals():
            conn.close()


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Please provide email and password"}), 400

    email = data['email']
    password = data['password']

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id, password, balance, role FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"message": "Invalid credentials"}), 401

            from werkzeug.security import check_password_hash
            # Check if password matches (handling potential plain text from init.sql for fallback, though hashing is preferred)
            pwd_hash = user['password']
            if not (check_password_hash(pwd_hash, password) or pwd_hash == password):
                return jsonify({"message": "Invalid credentials"}), 401

            # do not expose password hash, but include balance and role
            return jsonify({
                "user_id": user['user_id'],
                "email": email,
                "balance": user.get('balance', 0),
                "role": user.get('role', 'user')
            })
    except Exception as e:
        return jsonify({"message": f"Database error: {str(e)}"}), 500
    finally:
        if 'conn' in locals():
            conn.close()


