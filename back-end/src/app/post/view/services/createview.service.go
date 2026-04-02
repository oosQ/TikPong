package services

import (
	"errors"
	sharedRepo "social-network/src/app/post/shared/repo"
	"social-network/src/app/post/view/repo"
)

func CreateView(currentUserID, postID string) error {
	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("post not found or access denied")
	}

	alreadyViewed, err := repo.CheckPostViewExists(postID, currentUserID)
	if err != nil {
		return err
	}
	if alreadyViewed {
		return errors.New("post already viewed by this user")
	}

	return repo.CreatePostView(postID, currentUserID)
}
