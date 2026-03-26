package services

import (
	"social-network/src/app/post/hashtag/dto"
	"social-network/src/app/post/hashtag/repo"
)

func GetAllHashtags() ([]dto.HashtagResponse, error) {
	return repo.GetAllHashtags()
}
