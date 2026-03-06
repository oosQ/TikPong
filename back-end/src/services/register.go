package services

import (
	"social-network/src/dto"
	"social-network/src/models"
	"social-network/src/repo"
	"social-network/src/utils"
	"social-network/src/validator"
	"strconv"

)

func RegisterUser(req dto.RegisterRequest) (string, error) {


	if err := validator.ValidateRegister(req); err != nil {
		return "", err
	}

	
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
	now := utils.CurrentTimestamp()
	
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
		CreatedAt: strconv.FormatInt(now, 10),
		UpdatedAt: strconv.FormatInt(now, 10),
	}
	err = repo.RegisterUser(user)
	if err != nil {
		return "", err
	}
	return user.ID, nil
}
