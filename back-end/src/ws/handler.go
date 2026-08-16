package ws

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	chatrepo "social-network/src/app/chat/repo"
	groupshared "social-network/src/app/group/shared"
	database "social-network/src/db"
	"social-network/src/middleware"
	"time"

	"github.com/gorilla/websocket"
)

type inboundEnvelope struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type privateTypingEvent struct {
	RecipientID string `json:"recipient_id"`
	IsTyping    bool   `json:"is_typing"`
}

type groupTypingEvent struct {
	GroupID  string `json:"group_id"`
	IsTyping bool   `json:"is_typing"`
}

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
	setUserStatus(user.ID, "online")
	hub.Broadcast("user:status", map[string]any{
		"user_id": user.ID,
		"status":  "online",
	})
	defer func() {
		hub.Unregister(user.ID, client)
		if !hub.IsOnline(user.ID) {
			setUserStatus(user.ID, "offline")
			hub.Broadcast("user:status", map[string]any{
				"user_id": user.ID,
				"status":  "offline",
			})
		}
	}()

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	go readLoop(ctx, cancel, conn, user.ID)
	writeLoop(ctx, conn, client)
}

func setUserStatus(userID, status string) {
	_, _ = database.DB.Exec(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`, status, time.Now(), userID)
}

func readLoop(ctx context.Context, cancel context.CancelFunc, conn *websocket.Conn, userID string) {
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
			_, payload, err := conn.ReadMessage()
			if err != nil {
				return
			}

			_ = handleInboundMessage(userID, payload)
		}
	}
}

func handleInboundMessage(userID string, payload []byte) error {
	var message inboundEnvelope
	if err := json.Unmarshal(payload, &message); err != nil {
		return err
	}

	switch message.Type {
	case "chat:private:typing":
		return handlePrivateTypingEvent(userID, message.Data)
	case "chat:group:typing":
		return handleGroupTypingEvent(userID, message.Data)
	default:
		return errors.New("unsupported event type")
	}
}

func handlePrivateTypingEvent(senderID string, payload json.RawMessage) error {
	var event privateTypingEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return err
	}

	if event.RecipientID == "" || event.RecipientID == senderID {
		return errors.New("invalid recipient")
	}

	blocked, err := chatrepo.CheckBlockedEitherWay(senderID, event.RecipientID)
	if err != nil {
		return err
	}
	if blocked {
		return errors.New("cannot message a blocked user")
	}

	followsA, err := chatrepo.IsFollowing(senderID, event.RecipientID)
	if err != nil {
		return err
	}
	followsB, err := chatrepo.IsFollowing(event.RecipientID, senderID)
	if err != nil {
		return err
	}

	if !followsA && !followsB {
		return errors.New("you can only message users you follow or who follow you")
	}

	GlobalHub().SendToUser(event.RecipientID, "chat:private:typing", map[string]any{
		"sender_id":    senderID,
		"recipient_id": event.RecipientID,
		"is_typing":    event.IsTyping,
	})

	return nil
}

func handleGroupTypingEvent(senderID string, payload json.RawMessage) error {
	var event groupTypingEvent
	if err := json.Unmarshal(payload, &event); err != nil {
		return err
	}
	if event.GroupID == "" {
		return errors.New("invalid group")
	}

	isMember, err := groupshared.IsMember(event.GroupID, senderID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("only group members can send typing events")
	}

	memberIDs, err := groupshared.GetGroupMemberIDs(event.GroupID)
	if err != nil {
		return err
	}
	GlobalHub().SendToUsers(memberIDs, "chat:group:typing", map[string]any{
		"group_id":  event.GroupID,
		"sender_id": senderID,
		"is_typing": event.IsTyping,
	})
	return nil
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
