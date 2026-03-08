# Absolute Cinema

A modern movie booking system web application built with React, Flask, and dual-database architecture (MySQL and MongoDB).

## Overview

Absolute Cinema is a comprehensive movie ticketing platform that allows users to browse movies, book seats, manage their wallets, and handle transactions. The application features both user and admin functionalities with a robust backend supporting multiple database systems.

## Features

- **User Registration & Authentication**: Secure user account management with password encryption
- **Movie Browsing**: Browse available movies with showtimes
- **Seat Selection**: Interactive seat selection with real-time availability
- **Booking Management**: Create, view, and manage movie bookings
- **Wallet System**: Digital wallet for storing credits and managing payments
- **Transaction History**: Track all booking and wallet transactions
- **Admin Dashboard**: Administrative tools for managing movies, showtimes, and user data
- **Admin Wallet Management**: Manage wallet operations and user balances
- **Multi-Database Support**: Seamless integration with both MySQL and MongoDB

### Frontend
- **React 18+**: Modern UI library with hooks
- **Vite**: Next-generation build tool for rapid development
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Hot Toast**: Toast notifications for user feedback
- **ES6+**: Modern JavaScript standards

### Backend
- **Flask**: Lightweight Python web framework
- **Flask-CORS**: Cross-Origin Resource Sharing support
- **MySQL**: Relational database (via PyMySQL)
- **MongoDB**: NoSQL document database
- **Cryptography**: Secure password hashing

### DevOps
- **Docker**: Containerization for consistent deployments
- **Docker Compose**: Multi-container orchestration
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## Project Structure

```
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── vite.config.js       # Vite configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
│
├── backend/                 # Flask application
│   ├── app.py              # Main Flask application
│   ├── auth.py             # Authentication logic
│   ├── booking.py          # Booking operations
│   ├── users.py            # User management
│   ├── wallet.py           # Wallet functionality
│   ├── showtimes.py        # Movie showtimes
│   ├── seats.py            # Seat management
│   ├── db.py               # Database connections
│   ├── mongo_routes.py     # MongoDB routes
│   ├── seed.py             # Database seeding
│   └── requirements.txt    # Python dependencies
│
├── docker-compose.yml      # Docker Compose configuration
├── init.sql                # Database initialization script
├── requirements.txt        # Python dependencies (root)
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm (for frontend)
- Python 3.8+ (for backend)
- Docker and Docker Compose
- MySQL database
- MongoDB instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pro
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
FLASK_ENV=development
FLASK_DEBUG=True
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=cinema_db
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=your-secret-key
```

### Database Setup

1. **Initialize MySQL Database**
   ```bash
   mysql -u root -p < init.sql
   ```

2. **Seed Initial Data**
   ```bash
   cd backend
   python seed.py
   cd ..
   ```

## Running the Application

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

After the containers start, open your browser and go to:
> http://localhost:5000
