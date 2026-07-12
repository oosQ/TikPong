package chat

import (
	"net/http"
	"social-network/src/app/chat/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
	"social-network/src/ws"
)

func Init() {
	http.HandleFunc("/ws", ws.Handler)

	http.HandleFunc("/api/chat/private/inbox", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetPrivateConversationsHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/chat/private/{userId}/read", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.MarkPrivateMessagesReadHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/chat/groups/inbox", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetGroupConversationsHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/chat/private/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.SendPrivateMessageHandler(w, r)
		case http.MethodGet:
			handlers.GetPrivateMessagesHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/groups/{groupId}/chat", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.SendGroupMessageHandler(w, r)
		case http.MethodGet:
			handlers.GetGroupMessagesHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
}
