package invitations

import (
	"net/http"
	"social-network/src/app/group/invitations/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {

	http.HandleFunc("/api/groups/{groupId}/invitations/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.InviteUserHandler(w, r)
			return
		} else if r.Method == http.MethodDelete {
			handlers.CancelInvitationHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/sent-invitations", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListSentInvitationsHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/received-invitations", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListReceivedInvitationsHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/invitations/me/accept", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.AcceptInvitationHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/invitations/me/reject", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RejectInvitationHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
}
