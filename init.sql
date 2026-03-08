DROP TABLE IF EXISTS payments;

DROP TABLE IF EXISTS topup_requests;

DROP TABLE IF EXISTS book_seat;

DROP TABLE IF EXISTS booking;

DROP TABLE IF EXISTS seats;

DROP TABLE IF EXISTS showtimes;

DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
);

-- SHOWTIMES
CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id VARCHAR(50) NOT NULL, -- References MongoDB ObjectId
    theater_id VARCHAR(50) NOT NULL, -- References MongoDB ObjectId
    showtime DATETIME NOT NULL
);

-- BOOKING
CREATE TABLE booking (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
);

-- SEATS
CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id VARCHAR(50) NOT NULL, -- References MongoDB ObjectId
    seat VARCHAR(5) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 250.00
);

-- BOOK_SEAT
CREATE TABLE book_seat (
    book_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    book_id INT NOT NULL,
    seat_id INT NOT NULL,
    status ENUM('pending', 'booked') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id),
    FOREIGN KEY (book_id) REFERENCES booking (book_id),
    FOREIGN KEY (seat_id) REFERENCES seats (seat_id),
    UNIQUE (showtime_id, seat_id)
);

-- PAYMENTS
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Failed', 'Pending', 'Paid') DEFAULT 'Pending',
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES booking (book_id)
);

-- TOPUP REQUESTS
CREATE TABLE topup_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

INSERT INTO
    users (
        email,
        password,
        balance,
        role
    )
VALUES (
        'admin@gmail.com',
        'scrypt:32768:8:1$slxychCQmO0Npf8Q$2f47153f81fd277829fd63756c95191078b5ec5b0d9e23c9129339005af4c182d1a40faf85344d5b02468ded056df0d8f5b4a895950f71208b2b1508dd05affd',
        0.00,
        'admin'
    ),
    (
        'user1@gmail.com',
        'scrypt:32768:8:1$b4ehg5pah1bis1g7$c8871d7a43695e2964e6ccbf2bca24149fa16172e72d0e031c7f83eec34edd615596ae17818903bd37b8a9a2a16b7378557fb907fd3049c36aba0e9baa9eb5d9',
        1000.00,
        'user'
    );

-- Note: movies, theaters, showtimes, and seats are now inserted via backend/seed.py
-- for mapping MongoDB string IDs.