package block

import (
	"net/http"
	"social-network/src/app/user/block/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/blocks/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.BlockUserHandler(w, r)
		case http.MethodDelete:
			handlers.UnblockUserHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/blocks", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetBlockedUsersHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
}
