package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const migrationDir = "src/db/migrations"

func runMigrations(db *sql.DB) error {
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id TEXT PRIMARY KEY,
			applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`); err != nil {
		return fmt.Errorf("prepare migrations table: %w", err)
	}
	if err := syncLegacyMigrationRecords(db); err != nil {
		return err
	}

	migrations, err := findPairedMigrations(migrationDir)
	if err != nil {
		return err
	}

	for _, migration := range migrations {
		applied, err := isMigrationApplied(db, migration.id)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		if err := applyMigration(db, migration); err != nil {
			return err
		}
	}

	return nil
}

type migrationFiles struct {
	id       string
	upPath   string
	downPath string
}

func findPairedMigrations(dir string) ([]migrationFiles, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read migrations directory: %w", err)
	}

	filesByID := make(map[string]*migrationFiles)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		switch {
		case strings.HasSuffix(name, ".up.sql"):
			id := strings.TrimSuffix(name, ".up.sql")
			files := filesByID[id]
			if files == nil {
				files = &migrationFiles{}
				filesByID[id] = files
			}
			files.id = id
			files.upPath = filepath.Join(dir, name)
		case strings.HasSuffix(name, ".down.sql"):
			id := strings.TrimSuffix(name, ".down.sql")
			files := filesByID[id]
			if files == nil {
				files = &migrationFiles{}
				filesByID[id] = files
			}
			files.id = id
			files.downPath = filepath.Join(dir, name)
		}
	}

	ids := make([]string, 0, len(filesByID))
	for id, files := range filesByID {
		if files.upPath == "" || files.downPath == "" {
			return nil, fmt.Errorf("migration %s must have both .up.sql and .down.sql files", id)
		}
		ids = append(ids, id)
	}

	sort.Strings(ids)
	migrations := make([]migrationFiles, 0, len(ids))
	for _, id := range ids {
		migrations = append(migrations, *filesByID[id])
	}

	return migrations, nil
}

func syncLegacyMigrationRecords(db *sql.DB) error {
	var legacyTable string
	err := db.QueryRow("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gorp_migrations'").Scan(&legacyTable)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return fmt.Errorf("check legacy migrations table: %w", err)
	}

	_, err = db.Exec(`
		INSERT OR IGNORE INTO schema_migrations (id, applied_at)
		SELECT id, applied_at FROM gorp_migrations;
	`)
	if err != nil {
		return fmt.Errorf("sync legacy migrations: %w", err)
	}

	return nil
}

func isMigrationApplied(db *sql.DB, id string) (bool, error) {
	var exists int
	err := db.QueryRow("SELECT 1 FROM schema_migrations WHERE id = ?", id).Scan(&exists)
	if err == nil {
		return true, nil
	}
	if err == sql.ErrNoRows {
		return false, nil
	}

	return false, fmt.Errorf("check migration %s: %w", id, err)
}

func applyMigration(db *sql.DB, migration migrationFiles) error {
	upSQL, err := os.ReadFile(migration.upPath)
	if err != nil {
		return fmt.Errorf("read up migration %s: %w", migration.id, err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin migration %s: %w", migration.id, err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(string(upSQL)); err != nil {
		return fmt.Errorf("apply migration %s: %w", migration.id, err)
	}

	if _, err := tx.Exec("INSERT INTO schema_migrations (id) VALUES (?)", migration.id); err != nil {
		return fmt.Errorf("record migration %s: %w", migration.id, err)
	}

	return tx.Commit()
}
