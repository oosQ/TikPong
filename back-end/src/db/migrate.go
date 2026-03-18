package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	migrate "github.com/rubenv/sql-migrate"
)

const migrationDir = "src/db/migrations"

func runMigrations(db *sql.DB) error {
	source := &pairedFileMigrationSource{Dir: migrationDir}

	if _, err := migrate.Exec(db, "sqlite3", source, migrate.Up); err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}

	return nil
}

type pairedFileMigrationSource struct {
	Dir string
}

type migrationFiles struct {
	upPath   string
	downPath string
}

func (s *pairedFileMigrationSource) FindMigrations() ([]*migrate.Migration, error) {
	entries, err := os.ReadDir(s.Dir)
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
			files.upPath = filepath.Join(s.Dir, name)
		case strings.HasSuffix(name, ".down.sql"):
			id := strings.TrimSuffix(name, ".down.sql")
			files := filesByID[id]
			if files == nil {
				files = &migrationFiles{}
				filesByID[id] = files
			}
			files.downPath = filepath.Join(s.Dir, name)
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
	migrations := make([]*migrate.Migration, 0, len(ids))
	for _, id := range ids {
		migration, err := parsePairedMigration(id, filesByID[id])
		if err != nil {
			return nil, err
		}
		migrations = append(migrations, migration)
	}

	return migrations, nil
}

func parsePairedMigration(id string, files *migrationFiles) (*migrate.Migration, error) {
	upSQL, err := os.ReadFile(files.upPath)
	if err != nil {
		return nil, fmt.Errorf("read up migration %s: %w", id, err)
	}

	downSQL, err := os.ReadFile(files.downPath)
	if err != nil {
		return nil, fmt.Errorf("read down migration %s: %w", id, err)
	}

	var content strings.Builder
	writeMigrationSection(&content, "Up", upSQL)
	content.WriteString("\n")
	writeMigrationSection(&content, "Down", downSQL)

	migration, err := migrate.ParseMigration(id, strings.NewReader(content.String()))
	if err != nil {
		return nil, fmt.Errorf("parse migration %s: %w", id, err)
	}

	return migration, nil
}

func writeMigrationSection(builder *strings.Builder, direction string, body []byte) {
	builder.WriteString("-- +migrate ")
	builder.WriteString(direction)
	builder.WriteString("\n")
	builder.Write(body)
	if len(body) == 0 || body[len(body)-1] != '\n' {
		builder.WriteString("\n")
	}
}
