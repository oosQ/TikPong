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

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,           
        title TEXT NOT NULL,
        content TEXT NOT NULL,
		image_path TEXT,
		user_id TEXT NOT NULL,
		privacy TEXT CHECK (privacy IN ('public', 'friends', 'private')) NOT NULL DEFAULT 'public',
		is_edited INTEGER NOT NULL DEFAULT 0,
		edited_at DATETIME DEFAULT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
		FOREIGN KEY (user_id) REFERENCES users(id)
	);`)
	if err != nil {
		log.Fatal("Error creating posts table:", err)
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS hashtags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    );`)
	if err != nil {
		log.Fatal("Error creating hashtags table:", err)
	}

	_, err = DB.Exec(`CREATE TABLE IF NOT EXISTS post_hashtags (
        post_id TEXT NOT NULL,
        hashtag_id TEXT NOT NULL,
        PRIMARY KEY (post_id, hashtag_id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)
    );`)
	if err != nil {
		log.Fatal("Error creating post_hashtags table:", err)
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
