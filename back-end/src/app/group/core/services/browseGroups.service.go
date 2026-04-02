package services

import (
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/repo"
)

func BrowseGroups(cursor string, limit int) (*dto.BrowseGroupsResponse, error) {
	return repo.GetGroups(cursor, limit)
}
