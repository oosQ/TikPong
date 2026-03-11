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
  
  verified_email INTEGER NOT NULL DEFAULT 0,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,

  avatar_path TEXT,               
  nickname TEXT,                 
  about_me TEXT,

  is_public INTEGER NOT NULL DEFAULT 1, -- 1 public, 0 private
  role TEXT NOT NULL DEFAULT 'user',    -- user | admin | moderator
  status TEXT CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
  date_of_birth  DATETIME NOT NULL ,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`)
	if err != nil {
		log.Fatal("Error creating users table:", err)
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT NOT NULL UNIQUE PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`)
	if err != nil {
		log.Fatal("Error creating sessions table:", err)
	}
	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`)
	if err != nil {
		log.Fatal("Error creating password reset tokens table:", err)
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS email_verification_tokens (
		user_id TEXT NOT NULL,
		token TEXT NOT NULL UNIQUE,
		expires_at DATETIME NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);`)
	if err != nil {
		log.Fatal("Error creating email verification tokens table:", err)
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
