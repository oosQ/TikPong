package models

import "time"
type Post struct {
	ID        string    `db:"id"`
	Title     string    `db:"title"`
    Content   string    `db:"content"`
	UserID    string    `db:"user_id"`
	Privacy   string    `db:"privacy"` 
	IsEdited  bool      `db:"is_edited"`
	EditedAt  time.Time `db:"edited_at"`
    ImagePath string    `db:"image_path"`
	CreatedAt time.Time `db:"created_at"`
}

type Hashtag struct {
	ID   string `db:"id"`
	Name string `db:"name"`
}

type PostWithHashtags struct {
	Post
	Hashtags []Hashtag `db:"hashtags"`
}