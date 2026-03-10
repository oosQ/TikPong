package auth

import (
	"social-network/src/app/auth/handlers"
	"net/http"
)

func Init() {
	http.HandleFunc("/api/auth/users", handlers.RegisterHandler)
	http.HandleFunc("/api/auth/sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.LoginHandler(w, r)
		} else if r.Method == http.MethodDelete {
			handlers.LogoutHandler(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}