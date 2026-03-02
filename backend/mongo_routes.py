import datetime
from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from db import get_mongo_db

mongo_bp = Blueprint("mongo_routes", __name__)

def serialize_object_id(value):
    if isinstance(value, ObjectId):
        return str(value)
    return value

def serialize_document(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = serialize_object_id(doc["_id"])
        doc["movie_id"] = doc["_id"]  # Ensure backward compatibility with MySQL movie_id
    if "movie_id" in doc and isinstance(doc["movie_id"], ObjectId):
        doc["movie_id"] = serialize_object_id(doc["movie_id"])
    return doc

def serialize_list(cursor):
    return [serialize_document(d) for d in cursor]

# ==============================
# MOVIES
# ==============================

@mongo_bp.route('/api/movies', methods=['GET'])
def api_get_movies():
    """Get all movies from MongoDB"""
    mongo_db = get_mongo_db()
    movies = mongo_db.movies.find()
    
    # Format the data exactly how the frontend expects it 
    # (The frontend expects movie_id and title)
    formatted_movies = []
    for m in movies:
        formatted_movies.append({
            "movie_id": str(m["_id"]),
            "title": m.get("title", "Untitled")
        })
    return jsonify(formatted_movies), 200

@mongo_bp.route('/api/mongo/movies', methods=['POST'])
def api_create_movie():
    """Create a new movie"""
    data = request.get_json() or {}
    required = ['title']
    if any(field not in data for field in required):
        return jsonify({"error": "title is required"}), 400

    mongo_db = get_mongo_db()
    movie_doc = {
        "title": data['title'],
        "synopsis": data.get('synopsis'),
        "release_date": data.get('release_date'),
        "duration_minutes": data.get('duration_minutes'),
        "genres": data.get('genres', []),
        "content_rating": data.get('content_rating'),
        "cast": data.get('cast', []),
        "media": data.get('media', {}),
        "stats": data.get('stats', {"average_rating": 0.0, "total_reviews": 0}),
        "status": data.get('status', 'now_showing')
    }
    result = mongo_db.movies.insert_one(movie_doc)
    created = mongo_db.movies.find_one({"_id": result.inserted_id})
    return jsonify(serialize_document(created)), 201

# ==============================
# THEATERS
# ==============================

@mongo_bp.route('/api/mongo/theaters', methods=['GET'])
def api_get_theaters():
    mongo_db = get_mongo_db()
    theaters = mongo_db.theaters.find()
    return jsonify(serialize_list(theaters)), 200

@mongo_bp.route('/api/mongo/theaters', methods=['POST'])
def api_create_theater():
    """Create a new theater branch"""
    data = request.get_json() or {}
    required = ['branch_name']
    if any(field not in data for field in required):
        return jsonify({"error": "branch_name is required"}), 400

    mongo_db = get_mongo_db()
    theater_doc = {
        "branch_name": data['branch_name'],
        "location": data.get('location', {}),
        "facilities": data.get('facilities', []),
        "screens": data.get('screens', []),
        "updated_at": data.get('updated_at') or datetime.datetime.utcnow()
    }
    result = mongo_db.theaters.insert_one(theater_doc)
    created = mongo_db.theaters.find_one({"_id": result.inserted_id})
    return jsonify(serialize_document(created)), 201

# ==============================
# USER PROFILES
# ==============================

@mongo_bp.route('/api/mongo/user-profiles/<int:mysql_user_id>', methods=['GET'])
def api_get_user_profile(mysql_user_id):
    mongo_db = get_mongo_db()
    profile = mongo_db.user_profiles.find_one({"mysql_user_id": mysql_user_id})
    if not profile:
        return jsonify({"error": "profile not found"}), 404
    return jsonify(serialize_document(profile)), 200

@mongo_bp.route('/api/mongo/user-profiles/<int:mysql_user_id>', methods=['POST', 'PUT', 'PATCH'])
def api_upsert_user_profile(mysql_user_id):
    data = request.get_json() or {}
    mongo_db = get_mongo_db()

    update_fields = {
        "mysql_user_id": mysql_user_id,
        "display_name": data.get('display_name'),
        "avatar_url": data.get('avatar_url'),
        "bio": data.get('bio'),
        "preferences": data.get('preferences', {}),
        "watch_history": data.get('watch_history', []),
    }
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    mongo_db.user_profiles.update_one(
        {"mysql_user_id": mysql_user_id},
        {"$set": update_fields, "$setOnInsert": {"created_at": datetime.datetime.utcnow()}},
        upsert=True
    )
    profile = mongo_db.user_profiles.find_one({"mysql_user_id": mysql_user_id})
    return jsonify(serialize_document(profile)), 200

# ==============================
# REVIEWS
# ==============================

@mongo_bp.route('/api/mongo/movies/<movie_id>/reviews', methods=['GET'])
def api_get_reviews_for_movie(movie_id):
    mongo_db = get_mongo_db()
    try:
        movie_obj_id = ObjectId(movie_id)
    except Exception:
        return jsonify({"error": "invalid movie_id"}), 400

    reviews = mongo_db.reviews.find({"movie_id": movie_obj_id}).sort("created_at", -1)
    return jsonify(serialize_list(reviews)), 200

@mongo_bp.route('/api/mongo/movies/<movie_id>/reviews', methods=['POST'])
def api_create_review(movie_id):
    data = request.get_json() or {}
    required = ['mysql_user_id', 'rating', 'comment']
    if any(field not in data for field in required):
        return jsonify({"error": "mysql_user_id, rating, comment are required"}), 400

    try:
        movie_obj_id = ObjectId(movie_id)
    except Exception:
        return jsonify({"error": "invalid movie_id"}), 400

    mongo_db = get_mongo_db()
    review_doc = {
        "movie_id": movie_obj_id,
        "mysql_user_id": data['mysql_user_id'],
        "rating": data['rating'],
        "comment": data['comment'],
        "contains_spoilers": bool(data.get('contains_spoilers', False)),
        "likes_count": data.get('likes_count', 0),
        "created_at": datetime.datetime.utcnow()
    }
    result = mongo_db.reviews.insert_one(review_doc)
    created = mongo_db.reviews.find_one({"_id": result.inserted_id})
    return jsonify(serialize_document(created)), 201

