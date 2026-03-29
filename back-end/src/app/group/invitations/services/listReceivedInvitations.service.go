package services

import (
	"social-network/src/app/group/invitations/dto"
	"social-network/src/app/group/invitations/repo"
)

func ListSentInvitations(userID string) ([]dto.SentInvitationResponse, error) {
	return repo.ListSentInvitations(userID)
}
