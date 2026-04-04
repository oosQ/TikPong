package events

import (
	"net/http"
	"social-network/src/app/group/events/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
		http.HandleFunc("/api/groups/{groupId}/events", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.CreateEventHandler(w, r)
		case http.MethodGet:
			handlers.ListEventsHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/groups/{groupId}/events/{eventId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handlers.CancelEventHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/groups/{groupId}/events/{eventId}/response", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.EventResponseHandler(w, r)
			return
		}else if r.Method == http.MethodGet {
			handlers.GetEventResponseHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
}