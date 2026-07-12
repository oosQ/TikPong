package repost

import (
	"net/http"
	"social-network/src/app/post/repost/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/posts/{postId}/repost", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.RepostPostHandler(w, r)
		case http.MethodDelete:
			handlers.CancelRepostPostHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))
}
