from flask import Flask
from users import users_bp
from booking import booking_bp
from showtimes import showtimes_bp
from seats import seats_bp
from movies import movies_bp

app = Flask(__name__)

app.register_blueprint(users_bp)
app.register_blueprint(booking_bp)
app.register_blueprint(showtimes_bp)
app.register_blueprint(seats_bp)
app.register_blueprint(movies_bp)

if __name__ == "__main__":
    app.run(debug=True)
