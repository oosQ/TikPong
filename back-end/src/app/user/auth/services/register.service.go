package services

import (
	"errors"
	"social-network/src/app/user/auth/dto"
	"social-network/src/app/user/auth/repo"
	"social-network/src/models"
	"social-network/src/utils"
	"time"
)

func RegisterUser(req dto.RegisterRequest) (string, error , int) {

	userID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate user ID"), 500
	}


	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return "", errors.New("failed to hash password"), 500
	}

	
	role := models.RoleUser
	status := models.StatusOffline
	now := time.Now().Unix()
	 dateOfBirth, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		return "", errors.New("invalid date of birth"), 400
	}
	user := models.User{
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hashedPassword,

		FirstName:   req.FirstName,
		LastName:    req.LastName,
		AvatarPath: req.AvatarPath,
		DateOfBirth: dateOfBirth,

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
