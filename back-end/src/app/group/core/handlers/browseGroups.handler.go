package handlers

import (
	"net/http"
	"social-network/src/app/group/core/services"
	"social-network/src/utils"
)

func BrowseGroupsHandler(w http.ResponseWriter, r *http.Request) {
	cursor, limit, ok := utils.ParseCursorLimit(w, r)
	if !ok {
		return
	}

	groups, err := services.BrowseGroups(cursor, limit)
	if err != nil {
		utils.SendError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	utils.SendSuccess(w, groups, "Groups retrieved successfully")
}
