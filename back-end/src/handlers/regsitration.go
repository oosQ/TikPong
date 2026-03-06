package handlers

import (
	"net/http"
	"social-network/src/dto"
	"social-network/src/utils"
	"social-network/src/services"
	"os"
)


func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}


	var regReq dto.RegisterRequest

	regReq.Email = r.FormValue("email")
	regReq.Password = r.FormValue("password")
	regReq.FirstName = r.FormValue("first_name")
	regReq.LastName = r.FormValue("last_name")
	regReq.DateOfBirth = r.FormValue("date_of_birth")
	regReq.Nickname = r.FormValue("nickname")
	regReq.AboutMe = r.FormValue("about_me")
	regReq.IsPublic = r.FormValue("is_public") == "true"

 imagePath, err := utils.SaveUploadedImage(r);
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}

regReq.AvatarPath = imagePath

    userID, err := services.RegisterUser(regReq)
	if err != nil {
		if imagePath != "" {
		os.Remove(imagePath)
	}
		utils.SendError(w, err.Error(), http.StatusBadRequest)
		return
	}




	utils.SendSuccess(w, dto.RegisterResponse{
		UserID:  userID,
	} , "User registered successfully")
}
