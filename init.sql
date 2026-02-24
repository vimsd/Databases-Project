-- 1. ลบตารางเก่าทิ้งก่อน (ถ้ามี) เพื่อเริ่มใหม่แบบสะอาด
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS movies;

-- 2. สร้างตาราง movies (ใช้เก็บข้อมูลหลักของหนัง)
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INT,
    poster_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. สร้างตาราง users (สำหรับระบบ Login แยกสิทธิ์ Admin/User)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. เพิ่มข้อมูลเริ่มต้น (Mock Data)
INSERT INTO movies (title, genre, duration, poster_url) VALUES 
('Interstellar', 'Sci-Fi', 169, 'https://image.tmdb.org/t/p/w500/gEU2QvYBebnSdyVvPoffMa0pAcy.jpg'),
('The Dark Knight', 'Action', 152, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDp9QmSJuaxp7vIBmPi.jpg'),
('Inception', 'Sci-Fi', 148, 'https://image.tmdb.org/t/p/w500/9gk7Fn9UdB10o3uI9Y9EUBoxCqm.jpg');

INSERT INTO users (username, password, role) VALUES 
('admin', '1234', 'admin'),
('user1', '1234', 'user');