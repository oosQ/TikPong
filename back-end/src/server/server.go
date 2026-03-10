package server
import (
	"log"
	"net/http"
	"social-network/src/db/sqlite"
	"social-network/src/app/auth"
)

func Serverinit() {
	database.InitDB()
	defer database.DB.Close()

	auth.Init();
	
	log.Println("Server starting on: http://localhost:8433/")
	err := http.ListenAndServe(":8433", nil)
	if err != nil {
		log.Fatal(err)
	}
}