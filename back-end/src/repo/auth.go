package repo

import (
	"errors"
	database "social-network/src/db/sqlite"
	"social-network/src/models"
)

func RegisterUser(user models.User) error {

	exists, err := CheckEmailExists(user.Email)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("email already exists")
	}

	_, err = database.DB.Exec(RegisterUserQuery, user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.DateOfBirth, user.AvatarPath, user.Nickname, user.AboutMe, user.IsPublic, user.Role, user.Status, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return err
	}

	return nil
}

func CheckEmailExists(email string) (bool, error) {

	var count int

	err := database.DB.QueryRow(CheckEmailExistsQuery, email).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CheckUserCredentials(nicknameOrEmail string) (*models.User, error) {
	var user models.User

	err := database.DB.QueryRow(CheckCredentialsQuery, nicknameOrEmail, nicknameOrEmail).Scan(&user.ID, &user.PasswordHash)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func CreateSession(session models.Session) error {
	_, err := database.DB.Exec(CreateSessionQuery, session.ID, session.UserID, session.ExpiresAt)
	return err
}
