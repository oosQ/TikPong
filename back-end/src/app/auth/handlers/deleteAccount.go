package handlers

import (
	"net/http"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
	"social-network/src/models"
)

func DeleteAccountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err := services.DeleteAccount(userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, nil, "Account deleted successfully")
}