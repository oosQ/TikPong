package notification

import (
	"net/http"
	"social-network/src/app/notification/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {
	http.HandleFunc("/api/notifications", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetNotificationsHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/notifications/{notificationId}/read", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.MarkNotificationReadHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/notifications/read-all", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.MarkAllNotificationsReadHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))

	http.HandleFunc("/api/notifications/unread-count", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetUnreadCountHandler(w, r)
			return
		}
		utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
	}))
}
