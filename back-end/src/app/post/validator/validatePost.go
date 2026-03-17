package validator

import (
	"errors"
	"social-network/src/app/post/dto"
)

var (
	ErrInvalidPostData = errors.New("Invalid post data")
)

func ValidateCreatePost(req dto.CreatePostRequest) error{ 
	if req.Title == "" || len(req.Title) > 255 {
		return errors.New("Title is required and must be between 1 and 255 characters")
	}
	if req.Content == "" || len(req.Content) > 2000 {
		return errors.New("Content is required and must be between 1 and 2000 characters")
	}
	if req.Privacy != "public" && req.Privacy != "friends" && req.Privacy != "private" {
		return errors.New("Privacy must be one of: public, friends, private")
	}
	if len(req.Hashtags) > 5 || len(req.Hashtags) < 0 {
		return errors.New("A maximum of 5 hashtags is allowed")
	}
for _, tag := range req.Hashtags {
		if len(tag) > 50 || len(tag) < 1 {
			return errors.New("Hashtag must be between 1 and 50 characters")
		}
	}
	return nil
}