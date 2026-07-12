package services

import (
	"errors"
	"social-network/src/app/group/join-requests/repo"
	"social-network/src/app/group/shared"
	notificationservices "social-network/src/app/notification/services"
	userrepo "social-network/src/app/user/core/repo"
)

func RequestToJoin(groupID, userID string) error {
	exists, err := shared.GroupExists(groupID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("group not found")
	}

	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return err
	}
	if member {
		return errors.New("already a group member")
	}

	status, err := repo.GetJoinRequestStatus(groupID, userID)
	if err != nil {
		return err
	}
	if status == "pending" {
		return errors.New("join request already pending")
	}

	if err := repo.CreateJoinRequest(groupID, userID); err != nil {
		return err
	}

	creatorID, err := shared.GetCreatorID(groupID)
	if err == nil && creatorID != "" {
		requesterName := userrepo.GetUserDisplayName(userID)
		groupTitle := shared.GetGroupTitle(groupID)
		_ = notificationservices.CreateAndDispatch(creatorID, "group_join_request", "Group join request", requesterName+" wants to join "+groupTitle, map[string]any{
			"group_id":       groupID,
			"group_title":    groupTitle,
			"requester_id":   userID,
			"requester_name": requesterName,
		})
	}
	return nil
}

func CancelJoinRequest(groupID, userID string) error {
	status, err := repo.GetJoinRequestStatus(groupID, userID)
	if err != nil {
		return err
	}
	if status != "pending" {
		return errors.New("pending join request not found")
	}

	return repo.CancelJoinRequest(groupID, userID)
}
