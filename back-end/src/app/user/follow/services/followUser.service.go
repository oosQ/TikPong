package services

import (
	"errors"
	notificationservices "social-network/src/app/notification/services"
	userrepo "social-network/src/app/user/core/repo"
	"social-network/src/app/user/follow/repo"
)

func FollowUser(currentUserID, followingID string) error {
	if currentUserID == followingID {
		return errors.New("cannot follow yourself")
	}

	blocked, err := repo.CheckBlockedEitherWay(currentUserID, followingID)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New("cannot follow a blocked user")
	}

	isPublic, err := repo.IsUserPublic(followingID)
	if err != nil {
		return err
	}
	if !isPublic {
		return errors.New("cannot follow a private user without sending a follow request")
	}
	exists, err := repo.CheckFollowExists(currentUserID, followingID)
	if err != nil {
		return err
	}

	if exists {
		return errors.New("already following this user")
	}

	if err := repo.CreateFollow(currentUserID, followingID); err != nil {
		return err
	}

	followerName := userrepo.GetUserDisplayName(currentUserID)
	_ = notificationservices.CreateAndDispatch(followingID, "follow", "New follower", followerName+" started following you", map[string]any{
		"from_user_id":   currentUserID,
		"from_user_name": followerName,
	})

	return nil
}
