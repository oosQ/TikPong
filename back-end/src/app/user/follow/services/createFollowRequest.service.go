package services

import (
	"errors"
	"social-network/src/app/user/follow/repo"
)

func CreateFollowRequest(currentUserID, targetID string) error {
	if targetID == "" {
		return errors.New("user_id is required")
	}

	if currentUserID == targetID {
		return errors.New("cannot send a follow request to yourself")
	}

	isPublic, err := repo.IsUserPublic(targetID)
	if err != nil {
		return err
	}
	if isPublic {
		return errors.New("target user is public, follow directly")
	}

	exists, err := repo.CheckFollowExists(currentUserID, targetID)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("already following this user")
	}

	requestExists, err := repo.CheckPendingAcceptedFollowRequestExists(currentUserID, targetID)
	if err != nil {
		return err
	}
	if requestExists {
		return errors.New("follow request already exists")
	}
    
	rejectRequestExists, err := repo.CheckRejectFollowRequestExists(targetID, currentUserID)
	if err != nil {
		return err
	}
	if rejectRequestExists {
		return repo.DeleteAndCreateFollowRequest(targetID, currentUserID, currentUserID, targetID)
	}
	return repo.CreateFollowRequest(currentUserID, targetID)
}