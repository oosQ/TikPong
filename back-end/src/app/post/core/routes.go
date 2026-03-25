package post

import (
	"net/http"
	"social-network/src/app/post/core/handlers"
	"social-network/src/middleware"
)

func Init() {
	http.HandleFunc("/api/post", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.RequireAuth(handlers.CreatePostHandler)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}
