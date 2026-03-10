package handlers

import (
	"net/http"
	"social-network/src/app/auth/services"
	"social-network/src/utils"
	"social-network/src/middleware"
	"social-network/src/app/auth/validator"
	"encoding/json"
	"social-network/src/app/auth/dto"
)

func SendVerificationEmailHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	  if middleware.GetCurrentUser(r) != nil {
		utils.SendError(w, "Already authenticated", http.StatusForbidden)
		return
	}
	
	var email dto.SendVerificationEmailRequest 
	if err := json.NewDecoder(r.Body).Decode(&email); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
    if err := validator.ValidateEmail(email.Email); err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := services.SendVerificationEmail(email.Email)
	if(err!= nil){
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendSuccess(w, nil, "Verification email sent")
}