package comments

import (
	"net/http"
	"social-network/src/app/group/posts/comments/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {

		http.HandleFunc("/api/groups/{groupId}/posts/{postId}/comments", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.CreateGroupCommentHandler(w, r)
		case http.MethodGet:
			handlers.ListGroupCommentsHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
}