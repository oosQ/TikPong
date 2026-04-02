package handlers

import (
	"net/http"
	"social-network/src/app/user/block/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func UnblockUserHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	targetUserID := r.PathValue("userId")
	if targetUserID == "" {
		utils.SendError(w, "Missing userId parameter", http.StatusBadRequest)
		return
	}

	if err := services.UnblockUser(userCtx.ID, targetUserID); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	utils.SendSuccess(w, nil, "User unblocked successfully")
}
