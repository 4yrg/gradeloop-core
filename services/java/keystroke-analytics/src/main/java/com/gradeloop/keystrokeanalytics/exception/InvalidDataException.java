package com.gradeloop.keystrokeanalytics.exception;

/**
 * Exception thrown when invalid data is provided
 */
public class InvalidDataException extends RuntimeException {
    public InvalidDataException(String message) {
        super(message);
    }

    public InvalidDataException(String field, String reason) {
        super(String.format("Invalid %s: %s", field, reason));
    }
}
