import pymysql
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load .env if it exists
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

def check_db():
    print("--- Checking MySQL ---")
    try:
        conn = pymysql.connect(
            host=os.getenv("DB_HOST", "p1.secondtrain.org"),
            user=os.getenv("DB_USER", "phuwitpong_pa"),
            password=os.getenv("DB_PASSWORD", "yG0SH7o5"),
            database=os.getenv("DB_NAME", "phuwitpong_pa_db1"),
            port=3306
        )
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM users")
            print(f"Users count: {cursor.fetchone()[0]}")
            cursor.execute("SELECT COUNT(*) FROM showtimes")
            print(f"Showtimes count: {cursor.fetchone()[0]}")
            cursor.execute("SELECT COUNT(*) FROM seats")
            print(f"Seats count: {cursor.fetchone()[0]}")
        conn.close()
    except Exception as e:
        print(f"MySQL Error: {e}")

    print("\n--- Checking MongoDB ---")
    try:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://phuwitpong_pa:yG0SH7o5@p1.secondtrain.org:27017/phuwitpong_pa_mg")
        client = MongoClient(mongo_uri)
        db_name = mongo_uri.split('/')[-1].split('?')[0]
        db = client[db_name]
        print(f"Connected to MongoDB: {db_name}")
        print(f"Movies count: {db.movies.count_documents({})}")
        print(f"Theaters count: {db.theaters.count_documents({})}")
        print(f"Reviews count: {db.reviews.count_documents({})}")
        
        if db.movies.count_documents({}) > 0:
            print("\nSample Movie:")
            print(db.movies.find_one({}, {"title": 1}))
            
    except Exception as e:
        print(f"MongoDB Error: {e}")

if __name__ == "__main__":
    check_db()
