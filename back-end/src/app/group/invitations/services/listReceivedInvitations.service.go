package services

import (
	"social-network/src/app/group/invitations/dto"
	"social-network/src/app/group/invitations/repo"
)

func ListSentInvitations(userID, cursor string, limit int) (*dto.ListSentInvitationsResponse, error) {
	return repo.ListSentInvitations(userID, cursor, limit)
}
