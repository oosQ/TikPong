package services

import (
	"errors"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/repo"
	"social-network/src/app/group/shared"
	notificationservices "social-network/src/app/notification/services"
	"social-network/src/utils"
	"strings"
	"time"
)

func CreateEvent(groupID, creatorID string, req dto.CreateEventRequest) (string, error) {
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Description) == "" || strings.TrimSpace(req.EventTime) == "" {
		return "", errors.New("title, description and event_time are required")
	}

	member, err := shared.IsMember(groupID, creatorID)
	if err != nil {
		return "", err
	}
	if !member {
		return "", errors.New("only group members can create events")
	}

	eventTime, err := parseEventTime(req.EventTime)
	if err != nil {
		return "", errors.New("event_time must include a valid date and time")
	}
	if !eventTime.After(time.Now()) {
		return "", errors.New("event_time must be in the future")
	}

	eventID, err := utils.GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate event id")
	}

	if err := repo.CreateEvent(eventID, groupID, creatorID, strings.TrimSpace(req.Title), strings.TrimSpace(req.Description), eventTime); err != nil {
		return "", err
	}

	memberIDs, err := shared.GetGroupMemberIDs(groupID)
	if err == nil {
		groupTitle := shared.GetGroupTitle(groupID)
		for _, memberID := range memberIDs {
			if memberID == creatorID {
				continue
			}
			_ = notificationservices.CreateAndDispatch(memberID, "group_event", "New group event", "New event in "+groupTitle+": "+strings.TrimSpace(req.Title), map[string]any{
				"group_id":    groupID,
				"group_title": groupTitle,
				"event_id":    eventID,
				"event_title": strings.TrimSpace(req.Title),
			})
		}
	}

	return eventID, nil
}

func parseEventTime(value string) (time.Time, error) {
	trimmed := strings.TrimSpace(value)

	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return parsed, nil
	}

	localFormats := []string{
		"2006-01-02T15:04",
		"2006-01-02 15:04",
		"2006-01-02",
	}

	var lastErr error
	for _, format := range localFormats {
		parsed, err := time.ParseInLocation(format, trimmed, time.Local)
		if err == nil {
			return parsed, nil
		}
		lastErr = err
	}

	return time.Time{}, lastErr
}
