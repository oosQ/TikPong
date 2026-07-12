package services

import (
	"errors"
	repo "social-network/src/app/post/repost/repo"
	sharedRepo "social-network/src/app/post/shared/repo"
)

func RepostPost(currentUserID, postID string) error {
	canAccess, err := sharedRepo.CanUserAccessPost(postID, currentUserID)
	if err != nil {
		return err
	}
	if !canAccess {
		return errors.New("post not found or access denied")
	}

	alreadyReposted, err := repo.CheckPostRepostExists(postID, currentUserID)
	if err != nil {
		return err
	}
	if alreadyReposted {
		return errors.New("post already reposted")
	}

	return repo.CreatePostRepost(postID, currentUserID)
}
