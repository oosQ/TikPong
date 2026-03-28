package like

import (
	"net/http"
	"social-network/src/app/post/like/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/posts/{postId}/like", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.LikePostHandler(w, r)
		case http.MethodDelete:
			handlers.UnlikePostHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))
}
