package ws

import (
	"context"
	"net/http"
	"social-network/src/middleware"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1024
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Handler(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetCurrentUser(r)
	if user == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	if err := conn.WriteJSON(map[string]any{
		"type": "connected",
		"data": map[string]any{
			"status":  "connected",
			"user_id": user.ID,
		},
	}); err != nil {
		return
	}

	hub := GlobalHub()
	client := make(chan []byte, 32)
	hub.Register(user.ID, client)
	defer hub.Unregister(user.ID, client)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	go readLoop(ctx, cancel, conn)
	writeLoop(ctx, conn, client)
}

func readLoop(ctx context.Context, cancel context.CancelFunc, conn *websocket.Conn) {
	defer cancel()

	conn.SetReadLimit(maxMessageSize)
	_ = conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		return conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		select {
		case <-ctx.Done():
			return
		default:
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}
}

func writeLoop(ctx context.Context, conn *websocket.Conn, client <-chan []byte) {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			_ = writeControl(conn, websocket.CloseMessage, []byte{})
			return
		case msg := <-client:
			if err := writeMessage(conn, websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			if err := writeControl(conn, websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func writeMessage(conn *websocket.Conn, messageType int, payload []byte) error {
	if err := conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
		return err
	}
	return conn.WriteMessage(messageType, payload)
}

func writeControl(conn *websocket.Conn, messageType int, payload []byte) error {
	deadline := time.Now().Add(writeWait)
	return conn.WriteControl(messageType, payload, deadline)
}
