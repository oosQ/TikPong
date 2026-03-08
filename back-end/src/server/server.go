package server
import (
	"log"
	"net/http"
	"social-network/src/db/sqlite"
	"social-network/src/handlers"
)

func Serverinit() {
	database.InitDB()
	defer database.DB.Close()

	http.HandleFunc("/api/auth/users", handlers.RegisterHandler)
	http.HandleFunc("/api/auth/sessions", handlers.LoginHandler)

	log.Println("Server starting on: http://localhost:8433/")
    err := http.ListenAndServe(":8433", nil); if err != nil {
		log.Fatal(err)
	}
}