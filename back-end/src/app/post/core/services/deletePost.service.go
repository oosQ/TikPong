package services

import (
	"errors"
	"os"
	"social-network/src/app/post/core/repo"
)

func DeletePost(currentUserID, postID string) error {
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
		return errors.New("you can only delete your own posts")
	}

	imagePath, err := repo.DeletePost(postID)
	if err != nil {
		return err
	}

	if imagePath != "" {
		os.Remove(imagePath)
	}

	return nil
}
