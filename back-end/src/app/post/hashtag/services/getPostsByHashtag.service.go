package services

import (
	"errors"
	"social-network/src/app/post/hashtag/dto"
	"social-network/src/app/post/hashtag/repo"
)

func GetPostsByHashtag(hashtagID, currentUserID, cursor string, limit int) (*dto.GetPostsByHashtagResponse, error) {
	exists, err := repo.HashtagExists(hashtagID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("hashtag not found")
	}

	return repo.GetPostsByHashtagID(hashtagID, currentUserID, cursor, limit)
}
