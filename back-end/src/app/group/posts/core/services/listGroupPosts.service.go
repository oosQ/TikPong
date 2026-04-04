package services

import (
	"errors"
	"social-network/src/app/group/posts/core/dto"
	"social-network/src/app/group/posts/core/repo"
    "social-network/src/app/group/shared"
)
func ListGroupPosts(groupID, userID, cursor string, limit int) (*dto.ListGroupPostsResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can view posts")
	}
	return repo.ListGroupPosts(groupID, cursor, limit)
}
