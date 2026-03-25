package auth

import (
	"social-network/src/app/user/auth/handlers"
	"net/http"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	
	http.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RegisterHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/me", func(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		middleware.RequireAuth(handlers.GetCurrentUserHandler)(w, r)
	}else {
	utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}})

	http.HandleFunc("/api/auth/account", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			middleware.RequireAuth(handlers.DeleteAccountHandler)(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/change-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.RequireAuth(handlers.ChangePasswordHandler)(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/forgot-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ForgotPasswordHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

    http.HandleFunc("/api/auth/reset-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.ResetPasswordWithTokenHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/revoke-sessions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.RequireAuth(handlers.RevokeSessionsHandler)(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/send-verification-email", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.RequireAuth(handlers.SendVerificationEmailHandler)(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/verify-email", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.VerifyEmailHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/google/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GoogleLoginHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/google/callback", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GoogleCallbackHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/auth/sessions", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.LoginHandler(w, r)
		case http.MethodDelete:
			middleware.RequireAuth(handlers.LogoutHandler)(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
}