package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"social-network/src/db/sqlite"
	"net/http"
	"time"
	"social-network/src/models"
	"social-network/src/app/auth/repo"
)

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := GetCurrentUser(r)
		if user == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Not authenticated",
				"code":    401,
			})
			return
		}

		user_data := context.WithValue(r.Context(), "user_id", user.ID)
		user_data = context.WithValue(user_data, "username", user.Nickname)
		next(w, r.WithContext(user_data))
	}
}

func GetCurrentUser(r *http.Request) *models.User {
	cookie, err := r.Cookie("session_id")
	if err != nil || cookie == nil {
		return nil
	}

	var user models.User
	err = database.DB.QueryRow(repo.CheckSessionQuery, cookie.Value, time.Now()).Scan(&user.ID, &user.Nickname)
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

	if userID == nil || username == nil {
		return nil
	}

	return &models.UserContext{
		ID:       userID.(int),
		Username: username.(string),
	}
}
