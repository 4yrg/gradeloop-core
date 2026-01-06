package com.gradeloop.authanalytics.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String KEYSTROKE_AUTH_QUEUE = "keystroke.auth.events";
    public static final String KEYSTROKE_AUTH_EXCHANGE = "keystroke.exchange";
    public static final String KEYSTROKE_AUTH_ROUTING_KEY = "keystroke.auth.result";

    @Bean
    public Queue keystrokeAuthQueue() {
        return QueueBuilder.durable(KEYSTROKE_AUTH_QUEUE)
                .build();
    }

    @Bean
    public TopicExchange keystrokeExchange() {
        return new TopicExchange(KEYSTROKE_AUTH_EXCHANGE);
    }

    @Bean
    public Binding keystrokeAuthBinding() {
        return BindingBuilder
                .bind(keystrokeAuthQueue())
                .to(keystrokeExchange())
                .with(KEYSTROKE_AUTH_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
