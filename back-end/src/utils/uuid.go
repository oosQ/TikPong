package utils

import (
	"github.com/gofrs/uuid/v5"
)

func GenerateUUID() (string, error) {
	u, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	return u.String(), nil
}