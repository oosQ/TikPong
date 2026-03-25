package handlers

import (
	"net/http"
	"social-network/src/app/user/auth/services"
	"social-network/src/app/user/auth/validator"
	"social-network/src/models"
	"social-network/src/utils"
)

func SendVerificationEmailHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var email  = userCtx.Email;

	if err := validator.ValidateEmail(email); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := services.SendVerificationEmail(email)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, nil, "Verification email sent")
}
