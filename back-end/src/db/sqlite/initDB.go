package database

import (
	"database/sql"
	"log"
	"time"
	_ "github.com/mattn/go-sqlite3"

)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "database.db")
	if err != nil {
		log.Fatal(err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatal("Error connecting to DB:", err)
	}

	createTables()
	go cleanupExpiredSessions() 
}


func createTables() {
_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,             
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,

  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,      

  avatar_path TEXT,               
  nickname TEXT,                 
  about_me TEXT,

  is_public INTEGER NOT NULL DEFAULT 1, -- 1 public, 0 private
  role TEXT NOT NULL DEFAULT 'user',    -- user | admin | moderator
  status TEXT CHECK (status IN ('online', 'offline')) DEFAULT 'offline',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`)
	if err != nil {
		log.Fatal("Error creating users table:", err)
	}

		// Sessions table
	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`)
	if err != nil {
		log.Fatal("Error creating sessions table:", err)
	}

	}


	func cleanupExpiredSessions() {
	ticker := time.NewTicker(1 * time.Hour) 
	defer ticker.Stop()

	for range ticker.C {
		_, err := DB.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
		if err != nil {
			log.Printf("Error cleaning up expired sessions: %v", err)
		}
	}
}
