package utils

import (
	"fmt"
	"net/smtp"
)

func SendPasswordResetEmail(email string, token string) error {

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
     
	//demo email and password for testing, I cant use env var because we have to use extra package
	//  to load env var and that will cross the reboot requirment.
	senderEmail := "testzenomora1@gmail.com"
	senderPassword :=  "eehbuzhewrtpvjuq"

	auth := smtp.PlainAuth("", senderEmail, senderPassword, smtpHost)

	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)

	message := []byte(
		"From: " + senderEmail + "\r\n" +
			"To: " + email + "\r\n" +
			"Subject: Password Reset Request\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n" +
			"<h2>Password Reset</h2>" +
			"<p>You requested to reset your password.</p>" +
			"<p>Click the link below to reset it:</p>" +
			"<a href=\"" + resetLink + "\">Reset Password</a>" +
			"<p>If you did not request this, ignore this email.</p>",
	)

	err := smtp.SendMail(
		smtpHost+":"+smtpPort,
		auth,
		senderEmail,
		[]string{email},
		message,
	)

	if err != nil {
		return err
	}

	return nil
}