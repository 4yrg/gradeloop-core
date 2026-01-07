package com.gradeloop.authanalytics.exception;

/**
 * Exception thrown when there are issues with message processing
 */
public class MessagingException extends RuntimeException {
    public MessagingException(String message) {
        super(message);
    }

    public MessagingException(String message, Throwable cause) {
        super(message, cause);
    }
}
