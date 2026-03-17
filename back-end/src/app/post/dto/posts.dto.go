package dto

type CreatePostRequest struct {
	Title   string `json:"title" validate:"required,min=1,max=255"`
	Content string `json:"content" validate:"required,min=1"`
	Privacy string `json:"privacy" validate:"required,oneof=public friends private"`
	ImagePath string `json:"image_path,omitempty"`
	Hashtags []string `json:"hashtags,omitempty"`
}