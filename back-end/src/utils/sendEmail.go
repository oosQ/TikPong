package utils

import (
	"fmt"
	"net/smtp"
)

type EmailTemplateFunc func(senderEmail string, email string, token string, link string) []byte

type EmailData struct {
	ResetLink         EmailTemplateFunc
	EmailVerification EmailTemplateFunc
}

var emailData = EmailData{
	ResetLink:         ResetPasswordEmailTemplate,
	EmailVerification: EmailVerificationEmailTemplate,
}

func SendPasswordResetEmail(email string, token string) error {
	resetLink := fmt.Sprintf("http://localhost:8433/api/auth/reset-password?token=%s", token)
	return SendEmail(email, token, resetLink, "reset")
}

func SendEmailVerificationEmail(email string, token string) error {
	verificationLink := fmt.Sprintf("http://localhost:8433/api/auth/verify-email?token=%s", token)
	return SendEmail(email, token, verificationLink, "verification")
}

func SendEmail(email string, token string, link string, messageType string) error {

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	//demo email and password for testing, I cant use env var because we have to use extra package
	//  to load env var and that will cross the reboot requirment.
	senderEmail := "testzenomora1@gmail.com"
	senderPassword := "eehbuzhewrtpvjuq"

	auth := smtp.PlainAuth("", senderEmail, senderPassword, smtpHost)

	var message []byte
	switch messageType {
	case "reset":
		message = emailData.ResetLink(senderEmail, email, token, link)
	case "verification":
		message = emailData.EmailVerification(senderEmail, email, token, link)
	default:
		return fmt.Errorf("unsupported message type: %s", messageType)
	}

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

func ResetPasswordEmailTemplate(senderEmail string, email string, token string, resetLink string) []byte {
	return []byte(
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
}

func EmailVerificationEmailTemplate(senderEmail string, email string, token string, verificationLink string) []byte {
	return []byte(
		"From: " + senderEmail + "\r\n" +
			"To: " + email + "\r\n" +
			"Subject: Verify Your Email\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n" +
			"<h2>Email Verification</h2>" +
			"<p>Please verify your email address to activate your account.</p>" +
			"<p>Click the link below to verify it:</p>" +
			"<a href=\"" + verificationLink + "\">Verify Email</a>" +
			"<p>If you did not create this account, ignore this email.</p>",
	)
}
