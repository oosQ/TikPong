package services

import (
	"social-network/src/app/group/join-requests/dto"
	"social-network/src/app/group/join-requests/repo"
)

func ListSentJoinRequests(userID string) ([]dto.SentJoinRequestResponse, error) {
	return repo.ListSentJoinRequests(userID)
}
