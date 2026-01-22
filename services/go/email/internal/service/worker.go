package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"time"

	"github.com/gradeloop/email-service/internal/config"
	"github.com/gradeloop/email-service/internal/models"
	"github.com/gradeloop/email-service/internal/queue"
	"github.com/gradeloop/email-service/internal/store"
	amqp "github.com/rabbitmq/amqp091-go"
)

type Worker struct {
	store        *store.Store
	queue        *queue.RabbitMQ
	emailService *EmailService
	smtpCfg      config.SMTPConfig
}

func NewWorker(s *store.Store, q *queue.RabbitMQ, es *EmailService, smtpCfg config.SMTPConfig) *Worker {
	return &Worker{
		store:        s,
		queue:        q,
		emailService: es,
		smtpCfg:      smtpCfg,
	}
}

func (w *Worker) Start(ctx context.Context) {
	msgs, err := w.queue.Consume()
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	log.Println("Worker started. Waiting for messages...")

	for {
		select {
		case <-ctx.Done():
			log.Println("Worker stopping...")
			return
		case d, ok := <-msgs:
			if !ok {
				log.Println("Consumer channel closed")
				return
			}
			w.handleMessage(d)
		}
	}
}

func (w *Worker) handleMessage(d amqp.Delivery) {
	var payload struct {
		LogID string `json:"log_id"`
	}

	if err := json.Unmarshal(d.Body, &payload); err != nil {
		log.Printf("Failed to unmarshal payload: %v", err)
		d.Ack(false)
		return
	}

	emailLog, err := w.store.GetLog(payload.LogID)
	if err != nil {
		log.Printf("Failed to get email log: %v", err)
		d.Ack(false)
		return
	}

	// Render template
	var data map[string]interface{}
	json.Unmarshal([]byte(emailLog.Data), &data)

	renderedBody, err := w.emailService.RenderTemplate(emailLog.Template.HTMLBody, data)
	if err != nil {
		w.handleFailure(emailLog, err)
		d.Ack(false)
		return
	}

	// Render Subject
	renderedSubject, err := w.emailService.RenderTemplate(emailLog.Template.Subject, data)
	if err != nil {
		w.handleFailure(emailLog, err)
		d.Ack(false)
		return
	}

	// Actual Send
	if err := w.sendSMTP(emailLog.Recipient, renderedSubject, renderedBody); err != nil {
		log.Printf("Failed to send SMTP email: %v", err)
		w.handleFailure(emailLog, err)
		d.Ack(false)
		return
	}

	log.Printf("Sent email successfully to %s", emailLog.Recipient)

	// Simulate success
	now := time.Now()
	emailLog.Status = models.StatusSent
	emailLog.SentAt = &now
	w.store.UpdateLog(emailLog)

	d.Ack(false)
}

func (w *Worker) handleFailure(emailLog *models.EmailLog, err error) {
	emailLog.Status = models.StatusFailed
	emailLog.LastError = err.Error()
	emailLog.RetryCount++
	w.store.UpdateLog(emailLog)
}

func (w *Worker) sendSMTP(recipient, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", w.smtpCfg.Host, w.smtpCfg.Port)
	from := w.smtpCfg.From

	// Build the message with proper headers
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"From: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-version: 1.0;\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\";\r\n"+
		"\r\n"+
		"%s\r\n", recipient, from, subject, body))

	// If username is provided, use auth
	var auth smtp.Auth
	if w.smtpCfg.Username != "" {
		auth = smtp.PlainAuth("", w.smtpCfg.Username, w.smtpCfg.Password, w.smtpCfg.Host)
	}

	err := smtp.SendMail(addr, auth, from, []string{recipient}, msg)
	if err != nil {
		return fmt.Errorf("smtp error (host=%s port=%d user=%s): %w", w.smtpCfg.Host, w.smtpCfg.Port, w.smtpCfg.Username, err)
	}

	return nil
}
