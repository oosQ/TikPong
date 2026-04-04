package services

import (
	"errors"
	"social-network/src/app/group/posts/comments/dto"
	"social-network/src/app/group/posts/comments/repo"
	"social-network/src/app/group/shared"
	postShared "social-network/src/app/group/posts/shared"
)

func ListGroupComments(groupID, postID, userID, cursor string, limit int) (*dto.ListGroupCommentsResponse, error) {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return nil, err
	}
	if !member {
		return nil, errors.New("only group members can view comments")
	}

	belongs, err := postShared.GroupPostBelongsToGroup(postID, groupID)
	if err != nil {
		return nil, err
	}
	if !belongs {
		return nil, errors.New("post not found in group")
	}

	return repo.ListGroupComments(postID, cursor, limit)
}
