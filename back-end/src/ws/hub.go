package ws

import (
	"encoding/json"
	"sync"
)

type envelope struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[chan []byte]struct{}
}

var globalHub = &Hub{clients: make(map[string]map[chan []byte]struct{})}

func GlobalHub() *Hub {
	return globalHub
}

func (h *Hub) Register(userID string, client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.clients[userID] == nil {
		h.clients[userID] = make(map[chan []byte]struct{})
	}
	h.clients[userID][client] = struct{}{}
}

func (h *Hub) Unregister(userID string, client chan []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()

	conns := h.clients[userID]
	if conns == nil {
		return
	}
	delete(conns, client)
	if len(conns) == 0 {
		delete(h.clients, userID)
	}
}

func (h *Hub) SendToUser(userID, eventType string, payload any) {
	h.mu.RLock()
	conns := h.clients[userID]
	if len(conns) == 0 {
		h.mu.RUnlock()
		return
	}

	clients := make([]chan []byte, 0, len(conns))
	for client := range conns {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	msg, err := json.Marshal(envelope{Type: eventType, Data: payload})
	if err != nil {
		return
	}

	for _, client := range clients {
		select {
		case client <- msg:
		default:
		}
	}
}

func (h *Hub) SendToUsers(userIDs []string, eventType string, payload any) {
	for _, userID := range userIDs {
		h.SendToUser(userID, eventType, payload)
	}
}
