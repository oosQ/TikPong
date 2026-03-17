package post

import (
	"net/http"
	"social-network/src/app/post/handlers"
	"social-network/src/middleware"
)

func Init() {
	http.HandleFunc("/api/post", middleware.RequireAuth(middleware.RoleRequire("user", handlers.CreatePostHandler)))
}
