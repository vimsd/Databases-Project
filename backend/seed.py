import datetime
import os
import pymysql
from pymongo import MongoClient

def get_mysql_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "rootpassword"),
        database=os.getenv("DB_NAME", "cinema_db"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

def get_mongo_db():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cinema_logs")
    client = MongoClient(mongo_uri)
    return client.get_database()
                    
import time

def seed_database():
    print("Checking if database needs seeding...")
    
    max_retries = 10
    retry_delay = 5
    
    mongo_db = None
    mysql_conn = None
    
    # Retry loop to wait for DBs to be ready (especially for fresh docker-compose up)
    for i in range(max_retries):
        try:
            print(f"Connection attempt {i+1}/{max_retries}...")
            mongo_db = get_mongo_db()
            mysql_conn = get_mysql_connection()
            # Test MySQL connection
            with mysql_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
            print("Databases are ready!")
            break
        except Exception as e:
            print(f"Wait for DB... ({e})")
            if i < max_retries - 1:
                time.sleep(retry_delay)
            else:
                print("Could not connect to database after several attempts. Skipping seed.")
                return

    try:
        # Check if movies already exist
        if mongo_db.movies.count_documents({}) > 0:
            print("Database already contains movies. Skipping seed to prevent data loss.")
            return

    except Exception as e:
        print(f"Seeding check failed: {e}")
        return

    # 1. Insert Movies into MongoDB
    print("Inserting default movies into MongoDB...")
    movies_data = [
        {
            "title": "Dune",
            "synopsis": "A mythic and emotionally charged hero's journey...",
            "release_date": datetime.datetime(2021, 10, 22),
            "duration_minutes": 155,
            "genres": ["Action", "Adventure", "Sci-Fi"],
            "content_rating": "PG-13",
            "cast": [{"name": "Timothee Chalamet", "role": "Paul Atreides"}],
            "media": {"poster_url": "https://example.com/dune.jpg"},
            "stats": {"average_rating": 4.8, "total_reviews": 1500},
            "status": "now_showing"
        },
        {
            "title": "Oppenheimer",
            "synopsis": "The story of American scientist J. Robert Oppenheimer...",
            "release_date": datetime.datetime(2023, 7, 21),
            "duration_minutes": 180,
            "genres": ["Biography", "Drama", "History"],
            "content_rating": "R",
            "cast": [{"name": "Cillian Murphy", "role": "J. Robert Oppenheimer"}],
            "media": {"poster_url": "https://example.com/oppenheimer.jpg"},
            "stats": {"average_rating": 4.9, "total_reviews": 2000},
            "status": "now_showing"
        }
    ]

    result = mongo_db.movies.insert_many(movies_data)
    dune_id = str(result.inserted_ids[0])
    oppenheimer_id = str(result.inserted_ids[1])
    print(f"Movies inserted! Dune ID: {dune_id}, Oppenheimer ID: {oppenheimer_id}")

    # 2. Insert Showtimes into MySQL using the string IDs
    print("Inserting showtimes into MySQL...")
    with mysql_conn.cursor() as cursor:
        # Avoid duplicating if already seeded
        cursor.execute("SELECT COUNT(*) as count FROM showtimes WHERE movie_id = %s", (dune_id,))
        if cursor.fetchone()['count'] == 0:
            cursor.execute("""
                INSERT INTO showtimes (movie_id, theater_id, showtime)
                VALUES
                (%s, 1, '2026-03-01 18:00:00'),
                (%s, 1, '2026-03-01 20:30:00')
            """, (dune_id, dune_id))

        cursor.execute("SELECT COUNT(*) as count FROM showtimes WHERE movie_id = %s", (oppenheimer_id,))
        if cursor.fetchone()['count'] == 0:
            cursor.execute("""
                INSERT INTO showtimes (movie_id, theater_id, showtime)
                VALUES
                (%s, 1, '2026-03-02 19:00:00')
            """, (oppenheimer_id,))
            
        mysql_conn.commit()
    mysql_conn.close()

    print("Data seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
