package services

import (
	"social-network/src/app/group/join-requests/dto"
	"social-network/src/app/group/join-requests/repo"
)

func ListSentJoinRequests(userID, cursor string, limit int) (*dto.ListSentJoinRequestsResponse, error) {
	return repo.ListSentJoinRequests(userID, cursor, limit)
}
