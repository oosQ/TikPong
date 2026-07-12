package services

import (
	"errors"
	"social-network/src/app/post/hashtag/dto"
	"social-network/src/app/post/hashtag/repo"
)

func GetPostsByHashtag(hashtagName, currentUserID, cursor string, limit int) (*dto.GetPostsByHashtagResponse, error) {
	exists, err := repo.HashtagExistsByName(hashtagName)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, errors.New("hashtag not found")
	}

	return repo.GetPostsByHashtagName(hashtagName, currentUserID, cursor, limit)
}
