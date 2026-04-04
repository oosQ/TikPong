package services

import (
	"errors"
	"social-network/src/app/group/posts/likes/repo"
	"social-network/src/app/group/shared"
	postShared "social-network/src/app/group/posts/shared"
)

func DeleteGroupPostLike(groupID, postID, userID string) error {
	member, err := shared.IsMember(groupID, userID)
	if err != nil {
		return err
	}
	if !member {
		return errors.New("only group members can like posts")
	}	
	belongs, err := postShared.GroupPostBelongsToGroup(postID, groupID)
	if err != nil {
		return err
	}
	if !belongs {
		return errors.New("post not found in group")
	}
	alreadyLiked, err := repo.CheckGroupPostLikeExists(postID, userID)
	if err != nil {
		return err
	}
	if !alreadyLiked {
		return errors.New("post not liked by user")
	}
	return repo.DeleteGroupPostLike(postID, userID)
}