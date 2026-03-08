import os
import pymysql
from db import get_connection

def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

def migrate():
    load_env()
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # Create topup_requests table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS topup_requests (
                    request_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                );
            """)
        connection.commit()
        print("Migration successful: topup_requests table created.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals() and connection:
            connection.close()

if __name__ == "__main__":
    migrate()

