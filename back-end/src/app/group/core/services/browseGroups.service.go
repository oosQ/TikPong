package services

import (
	"social-network/src/app/group/core/dto"
	"social-network/src/app/group/core/repo"
)

func BrowseGroups() ([]dto.GroupResponse, error) {
	return repo.GetGroups()
}
