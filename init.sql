DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS book_seat;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);

-- MOVIES
CREATE TABLE movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL
);

-- SHOWTIMES
CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    theater_id INT NOT NULL,
    showtime DATETIME NOT NULL,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
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
    seat VARCHAR(5) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 250.00
);

-- BOOK_SEAT
CREATE TABLE book_seat (
    book_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    book_id INT NOT NULL,
    seat_id INT NOT NULL,
    status ENUM('pending','booked') NOT NULL DEFAULT 'pending',
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
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES booking(book_id)
);


INSERT INTO users (email, password, balance, role)
VALUES 
('user1@gmail.com', 'scrypt:32768:8:1$EKCqQ3fQPSy0kE6C$9f48604b262899df4ce9baaf4d4e52d67bbf6f27977b3bf850e3d1ede5ed4eb9ed9d2a9676df4f37d9e356f90b6188c9ced54e93acfee0579e9cbbc4205182d5', 1000.00, 'user'),
('admin@gmail.com', 'scrypt:32768:8:1$wh46ee9mG9A2fpT5$3403c64152181e24c35ed4a91ab63b5cd0d38b7c472dd226c61eaaf7ef44a80579a5e6354e46d94b8399feba212b1f6abecc8fdd5e50f326d7f8f412a430893c', 0.00, 'admin');

-- sample movies
INSERT INTO movies (title) VALUES ('Dune'), ('Oppenheimer');

INSERT INTO showtimes (movie_id, theater_id, showtime)
VALUES
  (1, 1, '2026-03-01 18:00:00'),
  (1, 1, '2026-03-01 20:30:00'),
  (2, 1, '2026-03-02 19:00:00');

INSERT INTO seats (theater_id, seat, price)
VALUES
  (1, 'A1', 250.00), (1, 'A2', 250.00), (1, 'A3', 250.00), (1, 'A4', 250.00), (1, 'A5', 250.00),
  (1, 'B1', 250.00), (1, 'B2', 250.00), (1, 'B3', 250.00), (1, 'B4', 250.00), (1, 'B5', 250.00);
