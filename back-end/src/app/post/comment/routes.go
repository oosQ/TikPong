package comment

import (
	"net/http"
	"social-network/src/app/post/comment/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/posts/{postId}/comments", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			middleware.RequireAuth(handlers.CreateCommentHandler)(w, r)
		case http.MethodGet:
			middleware.WithOptionalAuth(handlers.GetCommentsHandler)(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	})

	http.HandleFunc("/api/comments/{commentId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPatch:
			handlers.EditCommentHandler(w, r)
		case http.MethodDelete:
			handlers.DeleteCommentHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/comments/{commentId}/like", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.LikeCommentHandler(w, r)
		case http.MethodDelete:
			handlers.UnlikeCommentHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/users/{userId}/comments", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetUserCommentsHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))
}
