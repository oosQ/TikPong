package auth

import (
	"social-network/src/app/auth/handlers"
	"net/http"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/auth/users", handlers.RegisterHandler)
	http.HandleFunc("/api/auth/me", middleware.RequireAuth(handlers.GetCurrentUserHandler))
	http.HandleFunc("/api/auth/account", middleware.RequireAuth(handlers.DeleteAccountHandler))
	http.HandleFunc("/api/auth/change-password",middleware.RequireAuth(handlers.ChangePasswordHandler))
	http.HandleFunc("/api/auth/forgot-password", handlers.ForgotPasswordHandler)
    http.HandleFunc("/api/auth/reset-password", handlers.ResetPasswordWithTokenHandler)
	http.HandleFunc("/api/auth/send-verification-email", handlers.SendVerificationEmailHandler)
	http.HandleFunc("/api/auth/verify-email", handlers.VerifyEmailHandler)
	http.HandleFunc("/api/auth/sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.LoginHandler(w, r)
		} else if r.Method == http.MethodDelete {
			middleware.RequireAuth(handlers.LogoutHandler)(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}