package server

import (
	"log"
	"net/http"
	"social-network/src/app/user/follow"
	post "social-network/src/app/post/core"
	"social-network/src/app/user/auth"
	database "social-network/src/db"
)

func Serverinit() {
	database.InitDB()
	defer database.DB.Close()

	auth.Init()
	post.Init()
	follow.Init()

	log.Println("Server starting on: http://localhost:8433/")
	err := http.ListenAndServe(":8433", nil)
	if err != nil {
		log.Fatal(err)
	}
}
