import pymysql
import os
from pymongo import MongoClient

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "cinema_db"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

def get_mongo_db():
    # Use environment variable for MongoDB URI, default to local if not set
    # The default mongo_db from docker-compose is cinema_mongo
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cinema_logs")
    client = MongoClient(mongo_uri)
    # The database name will be extracted from the URI or we can specify it
    return client.get_database()
