package core

import (
	"net/http"
	"social-network/src/app/group/core/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
		http.HandleFunc("/api/groups", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.BrowseGroupsHandler(w, r)
		case http.MethodPost:
			handlers.CreateGroupHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/groups/{groupId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet: 
			handlers.GetGroupDetailsHandler(w, r)
		case http.MethodPut:
			handlers.UpdateGroupHandler(w, r)
		case http.MethodDelete:
			handlers.DeleteGroupHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
}