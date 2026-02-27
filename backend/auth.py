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

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                return jsonify({"message": "Email is already in use"}), 409

            from werkzeug.security import generate_password_hash
            hashed_password = generate_password_hash(password)

            sql = "INSERT INTO users (email, password) VALUES (%s, %s)"
            cursor.execute(sql, (email, hashed_password))
            
            user_id = cursor.lastrowid
        
        conn.commit()
        return jsonify({"message": "Register success", "user_id": user_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        conn.close()
