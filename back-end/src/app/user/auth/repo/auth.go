package repo

import (
	"errors"
	database "social-network/src/db"
	"social-network/src/models"
	"time"
)

func RegisterUser(user models.User) error {

	exists, err := CheckEmailExists(user.Email)
	if err != nil {
		return err
	}
	if exists {
		return errors.New("email already exists")
	}

	_, err = database.DB.Exec(RegisterUserQuery, 
		 user.ID, user.Email, user.PasswordHash, 
		user.VerifiedEmail, user.FirstName, user.LastName,
		 user.AvatarPath, user.Nickname ,user.AboutMe,
		  user.IsPublic, user.Role,user.Status, user.DateOfBirth,
		  user.CreatedAt,user.UpdatedAt ) 
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

	err := database.DB.QueryRow(CheckCredentialsQuery, nicknameOrEmail, nicknameOrEmail).Scan(&user.ID, &user.PasswordHash, &user.Email, &user.Role, &user.AvatarPath)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func CreateSession(session models.Session) error {
	_, err := database.DB.Exec(CreateSessionQuery, session.ID, session.UserID, session.Role, session.Email, session.AvatarPath, session.ExpiresAt)
	return err
}


func DeleteSession(sessionID string) error {
	_, err := database.DB.Exec(DeleteSessionQuery, sessionID)
	return err
}

func UpdateUserPassword(userID string, newPasswordHash string) error {
	_, err := database.DB.Exec(UpdatePasswordQuery, newPasswordHash, userID)
	return err
}

func GetUserPasswordHash(userID string) (string, error) {
	var passwordHash string
	err := database.DB.QueryRow(`SELECT password_hash FROM users WHERE id = ?`, userID).Scan(&passwordHash)
	if err != nil {
		return "", err
	}
	return passwordHash, nil
}

func GetUserIDByEmail(email string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`SELECT id FROM users WHERE email = ?`, email).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func StorePasswordResetToken(userID string, token string, expiresAt time.Time) error {
	_, err := database.DB.Exec(`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`, userID, token, expiresAt)
	return err
}

func GetUserIDByResetToken(token string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > ?`, token, time.Now()).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func RemoveUsertoken(userID string) error {
	_, err := database.DB.Exec(`DELETE FROM password_reset_tokens WHERE user_id = ?`, userID)
	return err
}
func DeleteUserByID(userID string) error {
	_, err := database.DB.Exec(`DELETE FROM users WHERE id = ?`, userID)
	return err
}
func DeleteSessionsByUserID(userID string) error {
	_, err := database.DB.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)
	return err
}

func StoreEmailVerificationToken(userID string, token string, expiresAt time.Time) error {
	_, err := database.DB.Exec(`INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`, userID, token, expiresAt)
	return err
}

func GetUserIDByEmailVerificationToken(token string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`SELECT user_id FROM email_verification_tokens WHERE token = ? AND expires_at > ?`, token, time.Now()).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func GetUserIDByVerificationToken(token string) (string, error) {
	var userID string
	err := database.DB.QueryRow(`SELECT user_id FROM email_verification_tokens WHERE token = ? AND expires_at > ?`, token, time.Now()).Scan(&userID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

func MarkEmailAsVerified(userID string) error {
	_, err := database.DB.Exec(`UPDATE users SET verified_email = 1 WHERE id = ?`, userID)
	return err
}

func RemoveVerificationToken(userID string) error {
	_, err := database.DB.Exec(`DELETE FROM email_verification_tokens WHERE user_id = ?`, userID)
	return err
}
func IsEmailVerified(userID string) (bool, error) {
	var verified int
	err := database.DB.QueryRow(`SELECT COALESCE(MAX(verified_email), 0) FROM users WHERE id = ?`, userID).Scan(&verified)
	if err != nil {
		return false, err
	}
	return verified == 1, nil
}
