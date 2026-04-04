package core

import (
	"net/http"
	"social-network/src/app/group/posts/core/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/groups/{groupId}/posts", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.CreateGroupPostHandler(w, r)
		case http.MethodGet:
			handlers.ListGroupPostsHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
}
