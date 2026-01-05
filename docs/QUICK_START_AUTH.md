# Quick Start Guide - Email Authentication & Password Reset

## What's Been Implemented

✅ **Email-based authentication** (replaced username)
✅ **Password reset via email** (forgot password flow)
✅ **Role-based redirects** (automatic routing after login)
✅ **Complete UI pages** (login, register, forgot-password, reset-password)

## How to Use

### 1. Start the Services

```bash
# Build and start all services
docker compose -f infra/docker/docker-compose.yml up -d --build

# Check that auth-service is running
docker compose -f infra/docker/docker-compose.yml ps
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:5000/auth
- **API Gateway**: http://localhost:80

### 3. Test the Flow

#### Register a New User
1. Go to http://localhost:3000/auth/register
2. Enter email, name, password, and role
3. Click "Register"
4. You'll be redirected to login

#### Login
1. Go to http://localhost:3000/auth/login  
2. Enter email and password
3. Click "Sign in"
4. You'll be redirected based on your role:
   - Student → `/student/courses`
   - Instructor → `/instructor/courses`
   - Institute Admin → `/admin/institute`
   - System Admin → `/admin/system`

#### Forgot Password
1. On login page, click "Forgot password?"
2. Enter your email
3. Check the **console logs** of the auth-service container for the reset link:
   ```bash
   docker compose -f infra/docker/docker-compose.yml logs auth-service | grep "PASSWORD RESET"
   ```
4. Copy the reset link and open it in your browser
5. Enter new password and confirm
6. You'll be redirected to login

## Views Console Logs for Reset Links

```bash
# Watch auth-service logs in real-time
docker compose -f infra/docker/docker-compose.yml logs -f auth-service
```

When someone requests a password reset, you'll see:
```
==============================================
PASSWORD RESET EMAIL
==============================================
To: user@example.com
Subject: Password Reset Request

Click the following link to reset your password:
http://localhost:3000/auth/reset-password?token=abc123...

This link will expire in 1 hour.
==============================================
```

## Database Changes

The `users` table now has:
- `email` (instead of `username`)
- `name` 
- `password_reset_token`
- `password_reset_expires`

## Session Information

After login, these cookies are set:
- `session` - JWT token
- `user_role` - User role
- `user_email` - User email  
- `user_name` - User name

## API Endpoints

```
POST /auth/register          - Register new user
POST /auth/login             - Login with email/password
POST /auth/forgot-password   - Request password reset
POST /auth/reset-password    - Reset password with token
GET  /auth/me                - Get current user info
```

## Testing with curl

### Register
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Forgot Password
```bash
curl -X POST http://localhost:5000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:5000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_FROM_EMAIL",
    "password": "newpassword123"
  }'
```

## Troubleshooting

### Service won't start
```bash
# Rebuild the service
docker compose -f infra/docker/docker-compose.yml build auth-service

# Restart it
docker compose -f infra/docker/docker-compose.yml up -d auth-service
```

### Database issues
```bash
# Check if database is running
docker compose -f infra/docker/docker-compose.yml ps db

# View database logs
docker compose -f infra/docker/docker-compose.yml logs db
```

### Can't see reset links
```bash
# Make sure auth-service is running
docker compose -f infra/docker/docker-compose.yml logs auth-service -f
```

## Next Steps

1. **Email Integration**: Replace console logging with real email service (SendGrid, AWS SES)
2. **Production Config**: Update environment variables for production
3. **Rate Limiting**: Add rate limiting on auth endpoints
4. **Monitoring**: Set up logging and monitoring

## Everything is Ready! 🚀

All features are implemented and working. You can now:
- Register users with email
- Login with email  
- Reset forgotten passwords
- Auto-redirect based on roles

Enjoy your new authentication system!
