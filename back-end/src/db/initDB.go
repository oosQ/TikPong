package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error
	dbPath := "data/database.db"

	isNewDatabase, err := isNewSQLiteDatabase(dbPath)
	if err != nil {
		log.Fatal("Error preparing DB path:", err)
	}

	if isNewDatabase {
		if err = cleanupUploadedImages(); err != nil {
			log.Fatal("Error cleaning uploads for new DB:", err)
		}
	}

	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// --- Check the connection to the database ---
	if err = DB.Ping(); err != nil {
		log.Fatal("Error connecting to DB:", err)
	}

	// --- Enable foreign key constraints ---
	_, err = DB.Exec(`PRAGMA foreign_keys = ON;`)
	if err != nil {
		log.Fatal(err)
	}

	// --- Run migrations ---
	if err = runMigrations(DB); err != nil {
		log.Fatal("Error running migrations:", err)
	}

	go cleanupExpiredSessions()
}

func isNewSQLiteDatabase(dbPath string) (bool, error) {
	if dbPath == "" || dbPath == ":memory:" || strings.HasPrefix(dbPath, "file:") {
		return false, nil
	}

	dbDir := filepath.Dir(dbPath)
	if dbDir != "." {
		if err := os.MkdirAll(dbDir, 0o755); err != nil {
			return false, err
		}
	}

	_, err := os.Stat(dbPath)
	if err == nil {
		return false, nil
	}
	if os.IsNotExist(err) {
		return true, nil
	}

	return false, err
}

func cleanupUploadedImages() error {
	uploadDirs := []string{
		"uploads/avatars",
		"uploads/comments",
		"uploads/posts",
	}

	for _, dir := range uploadDirs {
		if err := os.RemoveAll(dir); err != nil {
			return err
		}
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
	}

	return nil
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
