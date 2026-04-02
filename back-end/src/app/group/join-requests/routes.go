package joinrequests

import (
	"net/http"
	"social-network/src/app/group/join-requests/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/sent-join-requests", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListSentJoinRequestsHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/join-requests", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RequestJoinGroupHandler(w, r)
			return
		} else if r.Method == http.MethodGet {
			handlers.ListJoinRequestsHandler(w, r)
			return
		} else if r.Method == http.MethodDelete {
			handlers.CancelJoinRequestHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/join-requests/{userId}/accept", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.AcceptJoinRequestHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/join-requests/{userId}/reject", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RejectJoinRequestHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
}
