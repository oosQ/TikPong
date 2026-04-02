package services

import (
	"social-network/src/app/post/hashtag/dto"
	"social-network/src/app/post/hashtag/repo"
)

func GetAllHashtags(cursor string, limit int) (*dto.GetAllHashtagsResponse, error) {
	return repo.GetAllHashtags(cursor, limit)
}
