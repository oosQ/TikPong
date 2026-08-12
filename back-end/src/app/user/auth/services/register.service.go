package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"social-network/src/app/user/auth/dto"
	"social-network/src/app/user/auth/repo"
	"social-network/src/models"
	"social-network/src/utils"
	"strings"
	"time"
)

func generateNickname() (string, error) {
	for attempts := 0; attempts < 20; attempts++ {
		bytes := make([]byte, 4)
		if _, err := rand.Read(bytes); err != nil {
			return "", err
		}

		number := uint32(bytes[0])<<24 | uint32(bytes[1])<<16 | uint32(bytes[2])<<8 | uint32(bytes[3])
		nickname := fmt.Sprintf("user%09d", number%1000000000)

		exists, err := repo.CheckNicknameExists(nickname)
		if err != nil {
			return "", err
		}
		if !exists {
			return nickname, nil
		}
	}

	return "", errors.New("failed to generate unique nickname")
}

func RegisterUser(req dto.RegisterRequest) (string, error, int) {

	userID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate user ID"), 500
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return "", errors.New("failed to hash password"), 500
	}

	nickname := strings.TrimSpace(req.Nickname)
	if nickname == "" {
		nickname, err = generateNickname()
		if err != nil {
			return "", errors.New("failed to generate nickname"), 500
		}
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
		AvatarPath:  req.AvatarPath,
		DateOfBirth: dateOfBirth,

		Nickname:      nickname,
		AboutMe:       req.AboutMe,
		VerifiedEmail: false,

		IsPublic: req.IsPublic,
		Role:     role,
		Status:   status,

		CreatedAt: time.Unix(now, 0),
		UpdatedAt: time.Unix(now, 0),
	}
	err = repo.RegisterUser(user)
	if err != nil {
		return "", err, 409
	}
	return user.ID, nil, 201
}
