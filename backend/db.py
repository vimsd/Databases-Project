import pymysql

def get_connection():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="password",
        database="cinema",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )



