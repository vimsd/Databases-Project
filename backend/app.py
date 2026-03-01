from flask import Flask
from flask_cors import CORS

from users import users_bp
from booking import booking_bp
from showtimes import showtimes_bp
from seats import seats_bp
from auth import auth_bp

app = Flask(__name__)
CORS(app)  # 👈 สำคัญมาก

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(booking_bp)
app.register_blueprint(showtimes_bp)
app.register_blueprint(seats_bp)


# serve frontend build if it exists (so backend can be the single entrypoint)
from flask import send_from_directory
import os

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # look for files under frontend/dist
    build_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    if os.path.exists(os.path.join(build_dir, 'index.html')):
        return send_from_directory(build_dir, 'index.html')
    # fallback to 404 if no build available
    return ("Frontend not built", 404)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
