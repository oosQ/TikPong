package core

import (
	"net/http"
	"social-network/src/app/user/core/handlers"
	"social-network/src/middleware"
)

func Init() {
	http.HandleFunc("GET /api/users/me", middleware.RequireAuth(handlers.GetMeHandler))
	http.HandleFunc("GET /api/users", middleware.RequireAuth(handlers.GetUsersHandler))
	http.HandleFunc("GET /api/users/search", middleware.RequireAuth(handlers.SearchUsersHandler))
	http.HandleFunc("GET /api/users/{userId}", middleware.RequireAuth(handlers.GetUserHandler))
	http.HandleFunc("PATCH /api/users/me", middleware.RequireAuth(handlers.EditUserHandler))
	http.HandleFunc("PATCH /api/users/me/avatar", middleware.RequireAuth(handlers.ChangeAvatarHandler))
}
