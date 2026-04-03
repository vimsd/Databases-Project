import pymysql
import os
from pymongo import MongoClient

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "p1.secondtrain.org"),
        port=3306,
        user=os.getenv("DB_USER", "phuwitpong_pa"),
        password=os.getenv("DB_PASSWORD", "yG0SH7o5"),
        database=os.getenv("DB_NAME", "phuwitpong_pa_db1"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

def get_mongo_db():
    # Use environment variable for MongoDB URI, default to local if not set
    # The default mongo_db from docker-compose is cinema_mongo
    mongo_uri = os.getenv("MONGO_URI", "mongodb://phuwitpong_pa:yG0SH7o5@p1.secondtrain.org:27017/phuwitpong_pa_mg")
    client = MongoClient(mongo_uri)
    # The database name will be extracted from the URI or we can specify it
    return client.get_database()
