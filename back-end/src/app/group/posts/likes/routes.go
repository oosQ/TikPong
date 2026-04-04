package likes

import (
	"net/http"
	"social-network/src/app/group/posts/likes/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {

		http.HandleFunc("/api/groups/{groupId}/posts/{postId}/like", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.CreateGroupPostLikeHandler(w, r)
		case http.MethodDelete:
			handlers.DeleteGroupPostLikeHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
}