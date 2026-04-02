package services

import (
	"social-network/src/app/group/invitations/dto"
	"social-network/src/app/group/invitations/repo"
)

func ListReceivedInvitations(userID, cursor string, limit int) (*dto.ListReceivedInvitationsResponse, error) {
	return repo.ListReceivedInvitations(userID, cursor, limit)
}