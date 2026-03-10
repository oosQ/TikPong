package auth

import (
	"social-network/src/app/auth/handlers"
	"net/http"
	"social-network/src/middleware"
)

func Init() {
	http.HandleFunc("/api/auth/users", handlers.RegisterHandler)
	http.HandleFunc("/api/auth/me", middleware.RequireAuth(handlers.GetCurrentUserHandler))
	http.HandleFunc("/api/auth/reset-password",middleware.RequireAuth(handlers.ResetPasswordHandler))
	http.HandleFunc("/api/auth/sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.LoginHandler(w, r)
		} else if r.Method == http.MethodDelete {
			middleware.RequireAuth(handlers.LogoutHandler)(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}