package server

import (
	"log"
	"net/http"
	"social-network/src/app/chat"
	"social-network/src/app/group"
	"social-network/src/app/notification"
	 "social-network/src/app/post"
	"social-network/src/app/user"
	database "social-network/src/db"
	"social-network/src/middleware"
	"social-network/src/utils"
)

func Serverinit() {
	database.InitDB()
	defer database.DB.Close()
	user.Init()
	post.Init()
	group.Init()
	chat.Init()
	notification.Init()

	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		utils.SendError(w, "Endpoint not found", http.StatusNotFound)
	})
	log.Println("Server starting on: http://localhost:8433/")
	err := http.ListenAndServe(":8433", middleware.CORS(http.DefaultServeMux))
	if err != nil {
		log.Fatal(err)
	}
}
