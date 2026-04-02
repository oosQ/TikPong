package utils

import (
	"net/http"
	"strconv"
)

func ParseCursorLimit(w http.ResponseWriter, r *http.Request) (string, int, bool) {
	const (
		defaultLimit = 20
		maxLimit     = 100
	)

	limit := defaultLimit
	limitRaw := r.URL.Query().Get("limit")
	if limitRaw != "" {
		parsedLimit, err := strconv.Atoi(limitRaw)
		if err != nil || parsedLimit < 1 || parsedLimit > maxLimit {
			SendError(w, "Invalid limit. It must be an integer between 1 and 100", http.StatusBadRequest)
			return "", 0, false
		}
		limit = parsedLimit
	}

	return r.URL.Query().Get("cursor"), limit, true
}