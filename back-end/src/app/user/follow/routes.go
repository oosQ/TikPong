package follow

import (
	"net/http"
	"social-network/src/app/user/follow/handlers"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Init() {

	http.HandleFunc("/api/follows/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.FollowUserHandler(w, r)
		case http.MethodDelete:
			handlers.UnfollowUserHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/followers/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetUserFollowersHandler(w, r)
		case http.MethodDelete:
			handlers.RemoveFollowerHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/following/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetUserFollowingHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/follow-requests", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetFollowRequestsHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/follow-requests/{userId}", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			handlers.CreateFollowRequestHandler(w, r)
		case http.MethodDelete:
			handlers.CancelFollowRequestHandler(w, r)
		default:
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/follow-requests/{userId}/accept", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.AcceptFollowRequestHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/follow-requests/{userId}/reject", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handlers.RejectFollowRequestHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/following", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetFollowingHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/followers", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetFollowersHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

	http.HandleFunc("/api/follow-requests/sent", middleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handlers.GetSentFollowRequestsHandler(w, r)
		} else {
			utils.SendError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
	}))

}
