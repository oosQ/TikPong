package handlers

import (
	"net/http"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
	"social-network/src/middleware"
)

func VerifyEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if middleware.GetCurrentUser(r) != nil {
		utils.SendError(w, "Already authenticated", http.StatusForbidden)
		return
	}
	var token = r.URL.Query().Get("token")
	if token == "" {
		utils.SendError(w, "Missing token", http.StatusBadRequest)
		return
	}
	err := services.VerifyEmail(token)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	utils.SendSuccess(w, nil, "Email verified successfully")
}