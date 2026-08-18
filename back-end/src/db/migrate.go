package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	migrate "github.com/rubenv/sql-migrate"
)

const migrationDir = "src/db/migrations"

func runMigrations(db *sql.DB) error {
	migrations, err := loadMigrations(migrationDir)
	if err != nil {
		return err
	}

	source := &migrate.MemoryMigrationSource{Migrations: migrations}
	if _, err := migrate.Exec(db, "sqlite3", source, migrate.Up); err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}

	return nil
}

func loadMigrations(dir string) ([]*migrate.Migration, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read migrations directory: %w", err)
	}

	migrationsByID := make(map[string]*migrate.Migration)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		direction := ""
		switch {
		case strings.HasSuffix(name, ".up.sql"):
			direction = "up"
		case strings.HasSuffix(name, ".down.sql"):
			direction = "down"
		default:
			continue
		}

		id := strings.TrimSuffix(name, "."+direction+".sql")
		contents, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			return nil, fmt.Errorf("read %s migration %s: %w", direction, id, err)
		}

		migration := migrationsByID[id]
		if migration == nil {
			migration = &migrate.Migration{Id: id}
			migrationsByID[id] = migration
		}

		// Keep the whole file as one block. This supports the project's existing
		// multi-statement SQL files without adding sql-migrate markers to each file.
		if direction == "up" {
			migration.Up = []string{string(contents)}
		} else {
			migration.Down = []string{string(contents)}
		}
	}

	migrations := make([]*migrate.Migration, 0, len(migrationsByID))
	for id, migration := range migrationsByID {
		// A missing direction usually means a migration file was renamed or
		// forgotten, so fail during startup instead of discovering it on rollback.
		if migration.Up == nil || migration.Down == nil {
			return nil, fmt.Errorf("migration %s must have both .up.sql and .down.sql files", id)
		}
		migrations = append(migrations, migration)
	}

	return migrations, nil
}
