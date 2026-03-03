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

    # Seeding logic below will now use upsert to avoid duplicates
    pass

    # 1. Upsert Movies into MongoDB
    print("Upserting default movies into MongoDB...")
    movies_data = [
        {
            "title": "Dune",
            "synopsis": "A mythic and emotionally charged hero's journey...",
            "release_date": datetime.datetime(2021, 10, 22),
            "duration_minutes": 155,
            "genres": ["Action", "Adventure", "Sci-Fi"],
            "content_rating": "PG-13",
            "cast": [{"name": "Timothee Chalamet", "role": "Paul Atreides"}],
            "media": {"poster_url": "https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg"},
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
            "media": {"poster_url": "https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg"},
            "stats": {"average_rating": 4.9, "total_reviews": 2000},
            "status": "now_showing"
        },
# 1. Barbie
        {
            "title": "Barbie",
            "synopsis": "Barbie suffers a crisis that leads her to question her world and her existence.",
            "release_date": datetime.datetime(2023, 7, 21),
            "duration_minutes": 114,
            "genres": ["Adventure", "Comedy", "Fantasy"],
            "content_rating": "PG-13",
            "cast": [{"name": "Margot Robbie", "role": "Barbie"}, {"name": "Ryan Gosling", "role": "Ken"}],
            "media": {"poster_url": "https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg"},
            "stats": {"average_rating": 4.5, "total_reviews": 1500},
            "status": "now_showing"
        },
    # 2. The Dark Knight (แทน Dune)
        {
            "title": "The Dark Knight",
            "synopsis": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            "release_date": datetime.datetime(2008, 7, 18),
            "duration_minutes": 152,
            "genres": ["Action", "Crime", "Drama"],
            "content_rating": "PG-13",
            "cast": [{"name": "Christian Bale", "role": "Bruce Wayne"}, {"name": "Heath Ledger", "role": "Joker"}],
            "media": {"poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg"},
            "stats": {"average_rating": 4.9, "total_reviews": 5000},
            "status": "now_showing"
        },
    # 3. Spider-Man: Across the Spider-Verse
        {
            "title": "Spider-Man: Across the Spider-Verse",
            "synopsis": "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
            "release_date": datetime.datetime(2023, 6, 2),
            "duration_minutes": 140,
            "genres": ["Animation", "Action", "Adventure"],
            "content_rating": "PG",
            "cast": [{"name": "Shameik Moore", "role": "Miles Morales"}, {"name": "Hailee Steinfeld", "role": "Gwen Stacy"}],
            "media": {"poster_url": "https://upload.wikimedia.org/wikipedia/en/b/b4/Spider-Man-_Across_the_Spider-Verse_poster.jpg"},
            "stats": {"average_rating": 4.9, "total_reviews": 2800},
            "status": "now_showing"
        }
    ]

    movie_ids = {}
    for movie in movies_data:
        title = movie["title"]
        result = mongo_db.movies.update_one(
            {"title": title},
            {"$set": movie},
            upsert=True
        )
        if result.upserted_id:
            movie_ids[title] = str(result.upserted_id)
        else:
            # If not upserted, find the existing one to get ID
            existing = mongo_db.movies.find_one({"title": title})
            movie_ids[title] = str(existing["_id"])
    
    dune_id = movie_ids["Dune"]
    oppenheimer_id = movie_ids["Oppenheimer"]
    print(f"Movies synced! Dune ID: {dune_id}, Oppenheimer ID: {oppenheimer_id}")

    # 2. Insert Showtimes into MySQL using the string IDs
    print("Inserting showtimes into MySQL...")
    with mysql_conn.cursor() as cursor:
        # Define showtimes for all movies
        seeding_data = [
            ("Dune", [('2026-03-04 18:00:00', 1), ('2026-03-04 20:30:00', 1)]),
            ("Oppenheimer", [('2026-03-04 19:00:00', 1)]),
            ("Barbie", [('2026-03-04 14:00:00', 1), ('2026-03-04 16:30:00', 1)]),
            ("The Dark Knight", [('2026-03-04 21:00:00', 1)]),
            ("Spider-Man: Across the Spider-Verse", [('2026-03-04 15:00:00', 1)])
        ]

        for movie_title, times in seeding_data:
            if movie_title in movie_ids:
                m_id = movie_ids[movie_title]
                # Avoid duplicating if already seeded
                cursor.execute("SELECT COUNT(*) as count FROM showtimes WHERE movie_id = %s", (m_id,))
                if cursor.fetchone()['count'] == 0:
                    for st_time, th_id in times:
                        cursor.execute(
                            "INSERT INTO showtimes (movie_id, theater_id, showtime) VALUES (%s, %s, %s)",
                            (m_id, th_id, st_time)
                        )
            
        mysql_conn.commit()

        # 3. Insert Seats (A-H, 1-14)
        print("Seeding theater seats (2-9-3 layout)...")
        # Clear existing seats to avoid duplicates or messy layouts
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute("TRUNCATE TABLE book_seat")
        cursor.execute("TRUNCATE TABLE seats")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        for row in rows:
            for num in range(1, 15):
                seat_label = f"{row}{num}"
                cursor.execute(
                    "INSERT INTO seats (theater_id, seat, price) VALUES (%s, %s, %s)",
                    (1, seat_label, 250.00)
                )
        
        mysql_conn.commit()

    mysql_conn.close()

    print("Data seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
