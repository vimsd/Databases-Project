-- 1. ลบตารางเก่าทิ้งตามลำดับความสัมพันธ์ (ลบลูกก่อนแม่)
DROP TABLE IF EXISTS showtimes; 
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies;

-- 2. สร้างตาราง movies ... (โค้ดเดิมของคุณ)
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INT,
    poster_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. สร้างตาราง users ... (โค้ดเดิมของคุณ)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. สร้างตาราง showtimes (ต้องสร้างหลังจากสร้าง movies เสร็จแล้ว)
CREATE TABLE showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT,
    show_time TIME NOT NULL,
    theater_no INT,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- 4. เพิ่มข้อมูลเริ่มต้น (Mock Data)
INSERT INTO movies (title, genre, duration, poster_url) VALUES 
('Interstellar', 'Sci-Fi', 169, 'https://image.tmdb.org/t/p/w500/gEU2QvYBebnSdyVvPoffMa0pAcy.jpg'),
('The Dark Knight', 'Action', 152, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDp9QmSJuaxp7vIBmPi.jpg'),
('Inception', 'Sci-Fi', 148, 'https://image.tmdb.org/t/p/w500/9gk7Fn9UdB10o3uI9Y9EUBoxCqm.jpg');

INSERT INTO users (username, password, role) VALUES 
('admin', '1234', 'admin'),
('user1', '1234', 'user');

INSERT INTO showtimes (movie_id, show_time, theater_no) VALUES 
(1, '10:30:00', 1), (1, '14:30:00', 1), (1, '19:00:00', 2),
(2, '11:00:00', 3), (2, '15:30:00', 1);