package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/gradeloop/email-service/internal/models"
	"github.com/gradeloop/email-service/internal/queue"
	"github.com/gradeloop/email-service/internal/store"
	amqp "github.com/rabbitmq/amqp091-go"
)

type Worker struct {
	store        *store.Store
	queue        *queue.RabbitMQ
	emailService *EmailService
}

func NewWorker(s *store.Store, q *queue.RabbitMQ, es *EmailService) *Worker {
	return &Worker{
		store:        s,
		queue:        q,
		emailService: es,
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

	// Actual Send (Mocking for now)
	log.Printf("Sending email to %s with subject: %s", emailLog.Recipient, emailLog.Template.Subject)
	log.Printf("Body: %s", renderedBody)

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
