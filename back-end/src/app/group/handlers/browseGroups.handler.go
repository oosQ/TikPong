package handlers

import (
	"net/http"
	"social-network/src/app/group/services"
	"social-network/src/utils"
)

func BrowseGroupsHandler(w http.ResponseWriter, r *http.Request) {
	groups, err := services.BrowseGroups()
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, groups, "Groups retrieved successfully")
}
