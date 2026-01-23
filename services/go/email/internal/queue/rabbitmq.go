package queue

import (
	"context"
	"fmt"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/email/internal/config"
	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQ struct {
	Conn    *amqp.Connection
	Channel *amqp.Channel
	Config  config.RabbitMQConfig
}

func New(cfg config.RabbitMQConfig) (*RabbitMQ, error) {
	conn, err := amqp.Dial(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open a channel: %w", err)
	}

	// Declare exchange
	err = ch.ExchangeDeclare(
		cfg.Exchange,
		"direct",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare exchange: %w", err)
	}

	// Declare queue
	_, err = ch.QueueDeclare(
		cfg.Queue,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to declare queue: %w", err)
	}

	// Bind queue
	err = ch.QueueBind(
		cfg.Queue,
		"",
		cfg.Exchange,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("failed to bind queue: %w", err)
	}

	return &RabbitMQ{
		Conn:    conn,
		Channel: ch,
		Config:  cfg,
	}, nil
}

func (r *RabbitMQ) Publish(ctx context.Context, body []byte) error {
	return r.Channel.PublishWithContext(ctx,
		r.Config.Exchange,
		"",
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		})
}

func (r *RabbitMQ) Consume() (<-chan amqp.Delivery, error) {
	return r.Channel.Consume(
		r.Config.Queue,
		"",
		false, // manual ack
		false,
		false,
		false,
		nil,
	)
}

func (r *RabbitMQ) Close() {
	if r.Channel != nil {
		r.Channel.Close()
	}
	if r.Conn != nil {
		r.Conn.Close()
	}
}

func (r *RabbitMQ) Retry(ctx context.Context, body []byte, delay time.Duration) error {
	// Simple retry logic could involve publishing back to the queue or a specialized delay queue
	// For simplicity, we'll just publish back to the main queue for now
	// In a real scenario, use dead-letter exchanges or delay queues
	return r.Publish(ctx, body)
}
