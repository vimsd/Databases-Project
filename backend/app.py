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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
