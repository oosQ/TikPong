package server
import (
	"log"
	"net/http"
)

func Serverinit() {

	log.Println("Server starting on: http://localhost:8433/")
    err := http.ListenAndServe(":8080", nil); if err != nil {
		log.Fatal(err)
	}
}