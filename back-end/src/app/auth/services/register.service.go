package services

import (
	"social-network/src/app/auth/dto"
	"social-network/src/app/auth/repo"
	"social-network/src/models"
	"social-network/src/utils"
	"time"
)

func RegisterUser(req dto.RegisterRequest) (string, error , int) {

	userID, err := utils.GenerateUUID()
	if err != nil {
		return "", err ,500
	}


	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return "", err ,500
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
		AvatarPath: req.AvatarPath,

		Nickname:   req.Nickname,
		AboutMe:    req.AboutMe,
		VerifiedEmail:  false,

		IsPublic:  req.IsPublic,
		Role:      role,
		Status:    status,
		
		CreatedAt: time.Unix(now, 0),
		UpdatedAt: time.Unix(now, 0),
	}
	err = repo.RegisterUser(user)
	if err != nil {
	return "", err , 409
	}
	return user.ID, nil, 201
}
