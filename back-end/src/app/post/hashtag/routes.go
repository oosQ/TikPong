package hashtag

import (
	"net/http"
	"social-network/src/app/post/hashtag/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/hashtags", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetAllHashtagsHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	})

	http.HandleFunc("/api/hashtags/{hashtagId}/posts", middleware.WithOptionalAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetPostsByHashtagHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))
}
