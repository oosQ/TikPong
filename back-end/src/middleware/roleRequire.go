package middleware

import (
	"net/http"
	"social-network/src/models"
	"social-network/src/utils"
)

func RoleRequire(requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
	 	userCtx, ok := r.Context().Value("user_data").(*models.UserContext)
	if !ok || userCtx == nil {
		utils.SendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	} 

		if  userCtx.Role != models.UserRole(requiredRole) {
			utils.SendError(w, "Forbidden: insufficient permissions", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}