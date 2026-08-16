package repo

import (
	"database/sql"
	"social-network/src/app/group/events/dto"
	"social-network/src/db"
	"time"
)

func CreateEvent(eventID, groupID, creatorID, title, description string, eventTime time.Time) error {
	_, err := database.DB.Exec(`
		INSERT INTO group_events (id, group_id, creator_id, title, description, event_time, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, eventID, groupID, creatorID, title, description, eventTime, time.Now())
	return err
}

func GetEventResponses(eventID, cursor string, limit int) (*dto.ListEventResponsesResponse, error) {
	rows, err := database.DB.Query(`
		SELECT er.user_id, u.nickname, COALESCE(u.avatar_path, ''), er.response
		FROM group_event_responses er
		JOIN users u ON u.id = er.user_id
		WHERE er.event_id = ?
		AND (
			? = ''
			OR er.user_id > ?
		)
		ORDER BY er.user_id ASC
		LIMIT ?
	`, eventID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.EventAnswerResponse, 0, limit+1)
	for rows.Next() {
		var item dto.EventAnswerResponse
		if err := rows.Scan(&item.UserID, &item.Nickname, &item.AvatarPath, &item.Response); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.ListEventResponsesResponse{
		Responses: items,
		Limit:     limit,
	}

	if len(items) > limit {
		result.Responses = items[:limit]
		result.NextCursor = result.Responses[len(result.Responses)-1].UserID
	}

	return result, nil
}

func EventBelongsToGroup(eventID, groupID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_events WHERE id = ? AND group_id = ?
	`, eventID, groupID).Scan(&count)
	return count > 0, err
}

func IsEventCreator(eventID, userID string) (bool, error) {
	var count int
	err := database.DB.QueryRow(`
		SELECT COUNT(*) FROM group_events WHERE id = ? AND creator_id = ?
	`, eventID, userID).Scan(&count)
	return count > 0, err
}

func DeleteEvent(groupID, eventID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM group_events WHERE id = ? AND group_id = ?
	`, eventID, groupID)
	return err
}

func ToggleEventResponse(eventID, userID, response string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var currentResponse string
	err = tx.QueryRow(`
		SELECT response FROM group_event_responses
		WHERE event_id = ? AND user_id = ?
	`, eventID, userID).Scan(&currentResponse)

	switch {
	case err == sql.ErrNoRows:
		_, err = tx.Exec(`
			INSERT INTO group_event_responses (event_id, user_id, response, updated_at)
			VALUES (?, ?, ?, ?)
		`, eventID, userID, response, time.Now())
	case err != nil:
		return err
	case currentResponse == response:
		_, err = tx.Exec(`
			DELETE FROM group_event_responses
			WHERE event_id = ? AND user_id = ?
		`, eventID, userID)
	default:
		_, err = tx.Exec(`
			UPDATE group_event_responses
			SET response = ?, updated_at = ?
			WHERE event_id = ? AND user_id = ?
		`, response, time.Now(), eventID, userID)
	}
	if err != nil {
		return err
	}

	return tx.Commit()
}

func ListEvents(groupID, cursor string, limit int) (*dto.ListEventsResponse, error) {
	rows, err := database.DB.Query(`
		SELECT id, group_id, creator_id, title, description, event_time, created_at
		FROM group_events
		WHERE group_id = ?
		AND (
			? = ''
			OR event_time > (SELECT event_time FROM group_events WHERE group_id = ? AND id = ?)
			OR (event_time = (SELECT event_time FROM group_events WHERE group_id = ? AND id = ?) AND id > ?)
		)
		ORDER BY event_time ASC, id ASC
		LIMIT ?
	`, groupID, cursor, groupID, cursor, groupID, cursor, cursor, limit+1)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]dto.EventResponse, 0, limit+1)
	for rows.Next() {
		var item dto.EventResponse
		if err := rows.Scan(&item.ID, &item.GroupID, &item.CreatorID, &item.Title, &item.Description, &item.EventTime, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	result := &dto.ListEventsResponse{
		Events: items,
		Limit:  limit,
	}

	if len(items) > limit {
		result.Events = items[:limit]
		result.NextCursor = result.Events[len(result.Events)-1].ID
	}

	return result, nil
}
