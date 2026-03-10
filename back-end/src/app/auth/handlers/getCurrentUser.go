package handlers

import (
	"net/http"
	"social-network/src/app/auth/dto"
	"social-network/src/models"
	"social-network/src/utils"
)

func GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userDTO := dto.GetUserResponse{
		ID:         userCtx.ID,
		Email:      userCtx.Email,
		AvatarPath: userCtx.AvatarPath,
		Nickname:   userCtx.Nickname,
	}

	utils.SendSuccess(w, userDTO, "Current user retrieved successfully")
}
