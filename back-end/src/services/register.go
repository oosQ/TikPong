package services

import (
	"social-network/src/dto"
	"social-network/src/models"
	"social-network/src/repo"
	"social-network/src/utils"
	"time"

)

func RegisterUser(req dto.RegisterRequest) (string, error) {

	userID, err := utils.GenerateUUID()
	if err != nil {
		return "", err
	}


	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return "", err
	}

	
	role := models.RoleUser
	status := models.StatusOffline
	now := time.Now().Unix()
	
	user := models.User{
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hashedPassword,

		FirstName:   req.FirstName,
		LastName:    req.LastName,
		DateOfBirth: req.DateOfBirth,

		AvatarPath: req.AvatarPath,
		Nickname:   req.Nickname,
		AboutMe:    req.AboutMe,

		IsPublic:  req.IsPublic,
		Role:      role,
		Status:    status,
		CreatedAt: time.Unix(now, 0),
		UpdatedAt: time.Unix(now, 0),
	}
	err = repo.RegisterUser(user)
	if err != nil {
		return "", err
	}
	return user.ID, nil
}
