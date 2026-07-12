package utils

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func SaveUploadedImage(r *http.Request) (string, error) {
	return saveUploadedImage(r, "avatar_path", "./uploads/avatars", "")
}

func SaveUploadedGroupAvatar(r *http.Request) (string, error) {
	return saveUploadedImage(r, "avatar", "./uploads/avatars", "")
}

func SaveUploadedPostImage(r *http.Request) (string, error) {
	return saveUploadedImage(r, "image_path", "./uploads/posts", "")
}

func SaveUploadedCommentImage(r *http.Request) (string, error) {
	return saveUploadedImage(r, "image_path", "./uploads/comments", "")
}

func SaveUploadedPrivateMessageImage(r *http.Request) (string, error) {
	return saveUploadedImage(r, "image_path", "./uploads/messages", "")
}

func saveUploadedImage(r *http.Request, fieldName, uploadDir, defaultImagePath string) (string, error) {
	var imagePath string
	contentType := r.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "multipart/form-data") {
		return defaultImagePath, nil
	}

	file, header, err := r.FormFile(fieldName)
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			return defaultImagePath, nil
		}

		return "", errors.New("failed to read uploaded file")
	}

	defer file.Close()

	if header.Size > 20*1024*1024 {
		return "", errors.New("file size exceeds 20MB limit")
	}

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return "", errors.New("failed to read file")
	}
	if n == 0 {
		return "", errors.New("empty file")
	}

	filetype := http.DetectContentType(buf[:n])

	if filetype != "image/jpeg" && filetype != "image/png" && filetype != "image/gif" {
		return "", errors.New("only JPEG, PNG, GIF allowed")
	}

	file.Seek(0, 0)

	imageID, err := GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate image ID")
	}

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", errors.New("failed to prepare upload directory")
	}

	filename := imageID + "_" + header.Filename
	imagePath = filepath.ToSlash(filepath.Join(uploadDir, filename))

	outFile, err := os.Create(imagePath)
	if err != nil {
		return "", errors.New("failed to create image file")
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, file)
	if err != nil {
		if imagePath != "" {
			os.Remove(imagePath)
		}
		return "", errors.New("failed to copy image file")
	}

	return imagePath, nil
}

func SaveUploadedImageFromURL(imageURL string) (string, error) {
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", errors.New("failed to download image")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("failed to download image: " + resp.Status)
	}

	buf := make([]byte, 512)
	n, err := io.ReadFull(resp.Body, buf)
	if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
		return "", errors.New("failed to read image data")
	}
	if n == 0 {
		return "", errors.New("empty image data")
	}

	filetype := http.DetectContentType(buf[:n])

	if filetype != "image/jpeg" && filetype != "image/png" && filetype != "image/gif" {
		return "", errors.New("only JPEG, PNG, GIF allowed")
	}

	imageID, err := GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate image ID")
	}

	ext := ".jpg"
	if filetype == "image/png" {
		ext = ".png"
	} else if filetype == "image/gif" {
		ext = ".gif"
	}

	filename := imageID + "_avatar" + ext
	imagePath := "./uploads/avatars/" + filename
	outFile, err := os.Create(imagePath)
	if err != nil {
		return "", errors.New("failed to create image file")
	}
	defer outFile.Close()

	_, err = outFile.Write(buf[:n])
	if err != nil {
		if imagePath != "" {
			os.Remove(imagePath)
		}
		return "", errors.New("failed to save image file")
	}

	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		if imagePath != "" {
			os.Remove(imagePath)
		}
		return "", errors.New("failed to save image file")
	}

	return imagePath, nil
}
