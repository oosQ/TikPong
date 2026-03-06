package utils

import (
	"errors"
	"io"
	"net/http"
	"os"
)

func SaveUploadedImage(r *http.Request) (string, error) {
	var imagePath string

	file, header, err := r.FormFile("avatar_path")
	if err != nil {
			imagePath = "./uploads/avatars/f98e9819-7dc8-4445-b4fb-c9eaf9238416_download.jpg"
   return imagePath, nil
	}
	

	defer file.Close()

	if header.Size > 20*1024*1024 {
		return "", errors.New("file size exceeds 20MB limit")
	}

	buf := make([]byte, 512)
	_, err = file.Read(buf)
	if err != nil {
		return "", errors.New("failed to read file")
	}

	filetype := http.DetectContentType(buf)

	if filetype != "image/jpeg" && filetype != "image/png" && filetype != "image/gif" {
		return "", errors.New("only JPEG, PNG, GIF allowed")
	}

	file.Seek(0, 0)

	imageID, err := GenerateUUID()
	if err != nil {
		return "", errors.New("failed to generate image ID")
	}

	filename := imageID + "_" + header.Filename
	imagePath = "./uploads/avatars/" + filename

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
