package services

import (
	"social-network/src/app/post/comment/dto"
	"social-network/src/app/post/comment/repo"
)

func GetUserComments(userID, currentUserID string) ([]dto.CommentResponse, error) {
	return repo.GetCommentsByUserID(userID, currentUserID)
}
