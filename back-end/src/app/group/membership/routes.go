package membership

import (
	"net/http"
	"social-network/src/app/group/membership/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
   http.HandleFunc("/api/groups/{groupId}/leave", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handlers.LeaveGroupHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	 	http.HandleFunc("/api/groups/{groupId}/members", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.ListMembersHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
   
	 http.HandleFunc("/api/groups/{groupId}/members/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handlers.RemoveMemberHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

}