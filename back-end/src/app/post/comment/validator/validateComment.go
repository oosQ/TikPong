package validator

import (
	"errors"
	"strings"
)

func ValidateCommentContent(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return errors.New("content is required")
	}

	if len(content) > 1000 {
		return errors.New("content must be less than or equal to 1000 characters")
	}

	return nil
}
