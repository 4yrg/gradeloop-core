const amqp = require('amqplib');
const logger = require('../config/logger');
const emailTransport = require('./emailTransport');

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_URL = `amqp://${RABBITMQ_HOST}`;
const EXCHANGE_NAME = 'gradeloop.exchange';
const EXCHANGE_TYPE = 'topic';
const QUEUE_NAME = 'email.queue';
const ROUTING_KEY = 'email.#'; // Catch all email events

let channel = null;

const connect = async () => {
    try {
        logger.info(`Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
        const q = await channel.assertQueue(QUEUE_NAME, { durable: true });

        // Bind queue to exchange
        await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);

        logger.info(`Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    logger.info('Received MQ message:', content);

                    const { to, subject, text, html } = content;

                    if (!to || !subject || !text) {
                        logger.warn('Invalid message format, missing required fields');
                        // Depending on policy, might want to ack to remove bad message, or dead-letter it
                        channel.ack(msg);
                        return;
                    }

                    await emailTransport.sendEmail(to, subject, text, html);
                    channel.ack(msg);
                    logger.info('Message processed and acknowledged');
                } catch (err) {
                    logger.error('Error processing MQ message', { error: err.message });
                    // If transient error, maybe nack. For now, we ack to avoid endless loops on bad data
                    // In production, use Dead Letter Exchange
                    channel.ack(msg);
                }
            }
        });

        connection.on('close', () => {
            logger.error('RabbitMQ connection closed. Reconnecting...');
            setTimeout(connect, 5000);
        });

        connection.on('error', (err) => {
            logger.error('RabbitMQ connection error', err);
            setTimeout(connect, 5000);
        });

    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', { error: error.message });
        logger.info('Retrying in 5 seconds...');
        setTimeout(connect, 5000);
    }
};

module.exports = {
    connect,
};
