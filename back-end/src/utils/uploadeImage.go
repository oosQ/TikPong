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