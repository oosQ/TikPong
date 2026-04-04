package services

import (
	"errors"
	"strings"
	"social-network/src/app/group/events/dto"
	"social-network/src/app/group/events/repo"
	notificationservices "social-network/src/app/notification/services"
	"social-network/src/utils"
	"time"
	"social-network/src/app/group/shared"
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

	eventTime, err := time.Parse("2006-01-02", req.EventTime)
	if err != nil {
		return "", errors.New("event_time must be in YYYY-MM-DD format")
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
		for _, memberID := range memberIDs {
			if memberID == creatorID {
				continue
			}
			_ = notificationservices.CreateAndDispatch(memberID, "group_event", "New group event", "A new group event was created", map[string]any{
				"group_id": groupID,
				"event_id": eventID,
			})
		}
	}

	return eventID, nil
}

