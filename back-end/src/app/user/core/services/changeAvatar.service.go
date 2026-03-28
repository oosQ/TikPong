package services

import (
	"net/http"
	"social-network/src/app/user/core/repo"
	"social-network/src/utils"
)

func ChangeAvatar(userID string, r *http.Request) error {
	avatarPath, err := utils.SaveUploadedImage(r)
	if err != nil {
		return err
	}
	return repo.UpdateUserAvatar(userID, avatarPath)
}
