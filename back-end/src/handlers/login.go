package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"social-network/src/dto"
	"social-network/src/utils"
	"social-network/src/services"
	"social-network/src/middleware"
	"social-network/src/validator"
	"time"
)


func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if middleware.GetCurrentUser(r) != nil {
		utils.SendError(w, "Already authenticated", http.StatusForbidden)
		return
	}

	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.NicknameOrEmail = strings.TrimSpace(req.NicknameOrEmail)
	req.Password = strings.TrimSpace(req.Password)

	if err := validator.ValidateLogin(req); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	sessionID, userID, sessionExpiration, err := services.LoginUser(req)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionExpiration.Sub(time.Now()).Seconds()),
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	utils.SendSuccess(w, dto.LoginResponse{
		UserID:    userID,
		ExpiresAt: sessionExpiration.Unix(),
	}, "Login successful")

}