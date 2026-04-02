package services

import (
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/repo"
)

func GetUserComments(userID, currentUserID, cursor string, limit int) (*dto.GetCommentsResponse, error) {
	return repo.GetCommentsByUserID(userID, currentUserID, cursor, limit)
}
