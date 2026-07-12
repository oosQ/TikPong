package services

import (
	"errors"
	notificationservices "social-network/src/app/notification/services"
	userrepo "social-network/src/app/user/core/repo"
	"social-network/src/app/user/follow/repo"
)

func CreateFollowRequest(currentUserID, targetID string) error {
	if targetID == "" {
		return errors.New("user_id is required")
	}

	if currentUserID == targetID {
		return errors.New("cannot send a follow request to yourself")
	}

	blocked, err := repo.CheckBlockedEitherWay(currentUserID, targetID)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New("cannot send follow request to a blocked user")
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
		err = repo.DeleteAndCreateFollowRequest(targetID, currentUserID, currentUserID, targetID)
		if err != nil {
			return err
		}
		requesterName := userrepo.GetUserDisplayName(currentUserID)
		_ = notificationservices.CreateAndDispatch(targetID, "follow_request", "New follow request", requesterName+" wants to follow you", map[string]any{
			"from_user_id":   currentUserID,
			"from_user_name": requesterName,
		})
		return nil
	}
	err = repo.CreateFollowRequest(currentUserID, targetID)
	if err != nil {
		return err
	}

	requesterName := userrepo.GetUserDisplayName(currentUserID)
	_ = notificationservices.CreateAndDispatch(targetID, "follow_request", "New follow request", requesterName+" wants to follow you", map[string]any{
		"from_user_id":   currentUserID,
		"from_user_name": requesterName,
	})
	return nil
}
