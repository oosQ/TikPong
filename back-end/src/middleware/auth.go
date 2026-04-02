package middleware

import (
	"context"
	"database/sql"
	"social-network/src/utils"
	"social-network/src/db"
	"net/http"
	"time"
	"social-network/src/models"
	"social-network/src/app/user/auth/repo"
)

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetCurrentUser(r)
		if user == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

			userCtx := &models.UserContext{
			ID:         user.ID,
			Nickname:   user.Nickname,
			Email: user.Email,
			AvatarPath: user.AvatarPath,
			Role: 	user.Role,
		}
		next(w, r.WithContext(context.WithValue(r.Context(), "user_data", userCtx)))
	}
}

func WithOptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetCurrentUser(r)
		if user == nil {
			next(w, r)
			return
		}

		userCtx := &models.UserContext{
			ID:         user.ID,
			Nickname:   user.Nickname,
			Email:      user.Email,
			AvatarPath: user.AvatarPath,
			Role:       user.Role,
		}

		next(w, r.WithContext(context.WithValue(r.Context(), "user_data", userCtx)))
	}
}


func GetCurrentUser(r *http.Request) *models.User {
	cookie, err := r.Cookie("session_id")
	if err != nil || cookie == nil {
		return nil
	}

	var user models.User
	err = database.DB.QueryRow(repo.CheckSessionQuery, cookie.Value, time.Now()).Scan(&user.ID, &user.Nickname, &user.Email, &user.AvatarPath , &user.Role)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		return nil
	}

	return &user
}

func GetUserFromContext(r *http.Request) *models.UserContext {

	userID := r.Context().Value("user_id")
	username := r.Context().Value("username")
	email := r.Context().Value("email")
	avatarPath := r.Context().Value("avatar_path")
	role := r.Context().Value("role")

	if userID == nil || username == nil || email == nil || avatarPath == nil  || role == nil {
		return nil
	}

	return &models.UserContext{
		ID: userID.(string),
		Nickname: username.(string),
		Email: email.(string),
		AvatarPath: avatarPath.(string),
		Role: role.(models.UserRole),
	}
}
