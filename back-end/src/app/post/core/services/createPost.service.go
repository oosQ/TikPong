package services

import (
	"errors"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
	"social-network/src/models"
	"social-network/src/utils"
)

func CreatePost(userID string, req dto.CreatePostRequest) error {

	postID, err := utils.GenerateUUID()
	if err != nil {
		return errors.New("Failed to generate post ID")
	}

	post := models.Post{
		ID:        postID,
		UserID:    userID,
		Title:     req.Title,
		Content:   req.Content,
		Privacy:   req.Privacy,
		ImagePath: req.ImagePath,
	}
	err = repo.CreatePost(post, req.Hashtags)
	if err != nil {
		return err
	}

	return nil
}
