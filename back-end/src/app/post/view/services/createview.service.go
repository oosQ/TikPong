package services

import (
	"errors"
	"social-network/src/app/post/view/repo"
)

func CreateView(currentUserID, postID string) error {
	postExists, err := repo.PostExists(postID)
	if err != nil {
		return err
	}
	if !postExists {
		return errors.New("post not found")
	}

	alreadyViewed, err := repo.CheckPostViewExists(postID, currentUserID)
	if err != nil {
		return err
	}
	if alreadyViewed {
		return  errors.New("post already viewed by this user")
	}

	return repo.CreatePostView(postID, currentUserID)
}