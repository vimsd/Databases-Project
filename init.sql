DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS book_seat;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- SHOWTIMES
-- movie_id, theater_id refer to NoSQL
CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    theater_id INT NOT NULL,
    showtime DATETIME NOT NULL
);

-- BOOKING
CREATE TABLE booking (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
);

-- SEATS
CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id INT NOT NULL,
    seat VARCHAR(5) NOT NULL
);

-- BOOK_SEAT
CREATE TABLE book_seat (
    book_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    book_id INT NOT NULL,
    seat_id INT NOT NULL,

    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id),
    FOREIGN KEY (book_id) REFERENCES booking(book_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id),

    UNIQUE (showtime_id, seat_id)
);

-- PAYMENTS
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Failed', 'Pending', 'Paid') DEFAULT 'Pending',

    FOREIGN KEY (book_id) REFERENCES booking(book_id)
);


