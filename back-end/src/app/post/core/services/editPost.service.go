package services

import (
	"errors"
	"social-network/src/app/post/core/dto"
	"social-network/src/app/post/core/repo"
)

func EditPost(currentUserID, postID string, req dto.EditPostRequest) error {
	exists, err := repo.PostExists(postID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("post not found")
	}

	ownerID, err := repo.GetPostOwnerID(postID)
	if err != nil {
		return err
	}
	if ownerID != currentUserID {
		return errors.New("you can only edit your own posts")
	}

	return repo.EditPostTx(postID, req.Title, req.Content, req.Privacy, req.ImagePath, req.Hashtags, req.AllowedViewers)
}
