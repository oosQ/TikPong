package repo

import (
	"database/sql"
	"errors"
	database "social-network/src/db"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreatePost(post models.Post, hashtags []string) (err error) {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
			return
		}

		err = tx.Commit()
	}()

	_, err = tx.Exec(`INSERT INTO posts (id, user_id, title, content, privacy, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
		post.ID, post.UserID, post.Title, post.Content, post.Privacy, post.ImagePath)
	if err != nil {
		return err
	}

	err = createPostHashtags(tx, post.ID, hashtags)
	if err != nil {
		return err
	}

	return nil
}

func createHashtag(tx *sql.Tx, name string) (string, error) {
	var tagID string
	err := tx.QueryRow(`SELECT id FROM hashtags WHERE name = ?`, name).Scan(&tagID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			tagID, err = utils.GenerateUUID()
			if err != nil {
				return "", err
			}
			_, err = tx.Exec(`INSERT INTO hashtags (id, name) VALUES (?, ?)`, tagID, name)
			if err != nil {
				return "", err
			}
		} else {
			return "", err
		}
	}
	return tagID, nil
}

func createPostHashtags(tx *sql.Tx, postID string, hashtags []string) error {
	for _, tag := range hashtags {
		tagID, err := createHashtag(tx, tag)
		if err != nil {
			return err
		}
		_, err = tx.Exec(`INSERT INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)`, postID, tagID)
		if err != nil {
			return err
		}
	}
	return nil
}
