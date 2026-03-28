package handlers

import (
	"net/http"
	"social-network/src/app/user/core/services"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetMeHandler(w http.ResponseWriter, r *http.Request) {
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := services.GetUser(userCtx.ID)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusNotFound)
		return
	}

	utils.SendSuccess(w, user, "User retrieved successfully")
}
