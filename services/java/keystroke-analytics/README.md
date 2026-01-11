# Keystroke Analytics Service

## Overview

The **Keystroke Analytics Service** is a Spring Boot microservice that collects, stores, and provides analytics on keystroke authentication events from the keystroke dynamics system. It enables instructors to monitor student authentication confidence levels during assignments in real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Instructor Dashboard)                            │
└────────────────┬────────────────────────────────────────────┘
                 │ REST API Calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Keystroke Analytics Service (Spring Boot:8085)            │
│  - REST API endpoints for instructors                       │
│  - Aggregate keystroke data & statistics                    │
│  - PostgreSQL database for persistence                      │
└───────────┬──────────────────────────────┬──────────────────┘
            │                              │
            │ RabbitMQ Listen              │ Query
            ▼                              ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│  Python Keystroke       │    │  PostgreSQL                  │
│  Service (8003)         │    │  (keystroke_analytics_db:5434)│
│  - Publishes keystroke  │    │  - keystroke_events table    │
│    events to RabbitMQ   │    └──────────────────────────────┘
└─────────────────────────┘
```

## Features

### 1. Real-time Event Collection
- Listens to RabbitMQ queue: `keystroke.auth.events`
- Automatically stores keystroke events from keystroke service
- Handles verification and continuous monitoring events

### 2. Comprehensive Analytics API

**Student-specific analytics:**
- `/api/analytics/student/{studentId}/assignment/{assignmentId}/events` - Get all keystroke events for a student
- `/api/analytics/student/{studentId}/assignment/{assignmentId}/summary` - Get summary statistics

**Assignment-level analytics:**
- `/api/analytics/assignment/{assignmentId}/events` - All keystroke events for an assignment
- `/api/analytics/assignment/{assignmentId}/suspicious` - Suspicious events (risk > 50%)

**Course-level analytics:**
- `/api/analytics/course/{courseId}/events` - All keystroke events for a course

## Database Schema

```sql
CREATE TABLE keystroke_events (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    assignment_id VARCHAR(255),
    course_id VARCHAR(255),
    session_id VARCHAR(255),
    confidence_level DECIMAL(5,2),     -- 0-100%
    risk_score DECIMAL(5,2),           -- 0-100%
    keystroke_sample_size INT,
    event_timestamp TIMESTAMP NOT NULL,
    authenticated BOOLEAN,
    similarity_score DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_student_assignment ON keystroke_events(student_id, assignment_id);
CREATE INDEX idx_timestamp ON keystroke_events(event_timestamp DESC);
CREATE INDEX idx_risk_score ON keystroke_events(risk_score DESC);
```

## API Endpoints

### GET `/api/analytics/student/{studentId}/assignment/{assignmentId}/events`

Get all authentication events for a specific student on an assignment.

**Response:**
```json
[
  {
    "id": 1,
    "studentId": "student123",
    "assignmentId": "assignment456",
    "courseId": "course789",
    "sessionId": "session_abc",
    "confidenceLevel": 85.5,
    "riskScore": 14.5,
    "keystrokeSampleSize": 150,
    "eventTimestamp": "2026-01-06T10:30:00",
    "authenticated": true,
    "similarityScore": 85.5,
    "createdAt": "2026-01-06T10:30:01"
  }
]
```

### GET `/api/analytics/student/{studentId}/assignment/{assignmentId}/summary`

Get summary statistics for a student's authentication on an assignment.

**Response:**
```json
{
  "studentId": "student123",
  "assignmentId": "assignment456",
  "totalEvents": 25,
  "averageConfidence": 82.35,
  "averageRiskScore": 17.65,
  "minConfidence": 65.0,
  "maxConfidence": 95.0,
  "suspiciousEvents": 2,
  "firstEventTime": "2026-01-06T10:00:00",
  "lastEventTime": "2026-01-06T12:00:00",
  "riskLevel": "LOW"
}
```

**Risk Levels:**
- `LOW`: Average risk < 30%
- `MEDIUM`: Average risk 30-70%
- `HIGH`: Average risk > 70%

### GET `/api/analytics/assignment/{assignmentId}/suspicious`

Get all suspicious authentication events (risk > 50%) for an assignment.

### GET `/api/analytics/assignment/{assignmentId}/events`

Get all authentication events for an assignment.

### GET `/api/analytics/course/{courseId}/events`

Get all authentication events for a course.

## Integration with Keystroke Service

The Python keystroke service now publishes keystroke events automatically when:

1. **User Verification** (`/api/keystroke/verify`)
   - After verifying a student's typing pattern
   - Includes: confidenceLevel, riskScore, authenticated status

2. **Continuous Monitoring** (`/api/keystroke/monitor`)
   - During active typing sessions
   - Includes: sessionId, multiple sequence analysis

### Updated API Request Format

When calling the keystroke service, include assignment and course IDs:

```javascript
// Verify endpoint
POST /api/keystroke/verify
{
  "userId": "student123",
  "keystrokeEvents": [...],
  "threshold": 0.7,
  "assignmentId": "assignment456",  // NEW
  "courseId": "course789"            // NEW
}

// Monitor endpoint
POST /api/keystroke/monitor
{
  "userId": "student123",
  "sessionId": "session_abc",
  "assignmentId": "assignment456",  // NEW
  "courseId": "course789"            // NEW
}
```

## Running the Service

### With Docker Compose (Recommended)

```bash
cd infra/docker
docker compose up -d keystroke-analytics-service
```

This will:
- Start PostgreSQL database (`keystroke-analytics-db` on port 5434)
- Start the keystroke-analytics service (port 8085)
- Connect to RabbitMQ for event listening

### Standalone (Development)

```bash
cd services/java/keystroke-analytics
./mvnw spring-boot:run
```

**Environment Variables:**
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/keystroke_analytics_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_RABBITMQ_HOST=localhost
```

## Testing

### 1. Health Check
```bash
curl http://localhost:8085/api/analytics/health
```

### 2. Check RabbitMQ Connection
```bash
# View RabbitMQ management UI
open http://localhost:15672
# Login: guest/guest
# Check queue: keystroke.auth.events
```

### 3. Trigger Auth Event
```bash
# Call keystroke verification with assignment/course IDs
curl -X POST http://localhost:8003/api/keystroke/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_student",
    "assignmentId": "test_assignment",
    "courseId": "test_course",
    "keystrokeEvents": [...],
    "threshold": 0.7
  }'
```

### 4. Query Analytics
```bash
# Get student summary
curl http://localhost:8085/api/analytics/student/test_student/assignment/test_assignment/summary

# Get all events
curl http://localhost:8085/api/analytics/assignment/test_assignment/events
```

## Next Steps

Once the assignment submission service is created by other developers:

1. **Update Frontend Integration**
   - Add analytics dashboard to instructor view
   - Display confidence graphs and risk indicators
   - Show suspicious sessions alerts

2. **Add Real-time Notifications**
   - WebSocket support for live updates
   - Alert instructors when risk exceeds threshold

3. **Enhanced Analytics**
   - Temporal patterns (time of day analysis)
   - Comparative analytics (student vs class average)
   - Anomaly detection algorithms

4. **Report Generation**
   - PDF reports for instructors
   - CSV export for research purposes

## Configuration

### application.properties

```properties
# Server
server.port=8085

# Database
spring.datasource.url=jdbc:postgresql://localhost:5434/keystroke_analytics_db
spring.datasource.username=postgres
spring.datasource.password=password

# JPA
spring.jpa.hibernate.ddl-auto=update

# RabbitMQ
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
```

## Troubleshooting

### Events not being stored

**Check RabbitMQ connection:**
```bash
docker compose logs keystroke-analytics-service | grep -i rabbit
```

**Check keystroke service logs:**
```bash
docker compose logs keystroke-service | grep -i published
```

### Database connection issues

**Verify database is running:**
```bash
docker compose ps keystroke-analytics-db
```

**Check database logs:**
```bash
docker compose logs keystroke-analytics-db
```

### No data in responses

**Verify events are being published:**
- Check RabbitMQ UI: http://localhost:15672
- Look for messages in `keystroke.auth.events` queue

**Check service logs:**
```bash
docker compose logs -f keystroke-analytics-service
```

## Development Notes

- Service automatically creates database schema on startup
- RabbitMQ queue is created on first publish
- Failed message processing triggers retry (3 attempts by default)
- Events are stored asynchronously to not block keystroke verification

## Technologies Used

- **Spring Boot 3.2.0** - Application framework
- **Spring Data JPA** - Database ORM
- **Spring AMQP** - RabbitMQ integration
- **PostgreSQL 15** - Database
- **Lombok** - Reduce boilerplate code
- **Maven** - Dependency management
