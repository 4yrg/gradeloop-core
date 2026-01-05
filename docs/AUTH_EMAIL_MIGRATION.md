# Auth Service Email Migration & Password Reset Implementation

## Summary
This implementation replaces username authentication with email-based authentication and adds complete forgot password functionality with email reset links.

## Backend Changes

### 1. Database Schema (`services/go/auth-service/schema.sql`)
- **Changed**: `username` → `email` field with unique constraint
- **Added**: `name` field for user's full name
- **Added**: `password_reset_token` field for reset tokens
- **Added**: `password_reset_expires` field for token expiration
- **Added**: Indexes on `email` and `password_reset_token`

### 2. User Model (`services/go/auth-service/models/user.go`)
- **Changed**: `Username` → `Email` field
- **Added**: `Name` field
- **Added**: `PasswordResetToken` and `PasswordResetExpires` fields
- **Added**: `ForgotPasswordRequest` and `ResetPasswordRequest` structs
- **Updated**: All request validation to use email instead of username

### 3. Email Service (`services/go/auth-service/services/email.go`)
- **Created**: New email service package
- **Implemented**: `GenerateResetToken()` - Creates secure random tokens
- **Implemented**: `SendResetEmail()` - Sends password reset emails (console logging for dev)
- **Implemented**: `CreatePasswordResetToken()` - Creates and stores reset tokens
- **Implemented**: `ValidateResetToken()` - Validates tokens and checks expiration
- **Implemented**: `ResetPassword()` - Resets password using valid token

### 4. Auth Handlers (`services/go/auth-service/handlers/auth.go`)
- **Updated**: Register and Login to use email instead of username
- **Added**: `ForgotPassword` handler
- **Added**: `ResetPassword` handler
- **Updated**: All database queries to use email field

### 5. gRPC Handlers (`services/go/auth-service/handlers/grpc.go`)
- **Updated**: All responses to include user details (email, name, role)
- **Added**: `ForgotPassword` gRPC method
- **Added**: `ResetPassword` gRPC method
- **Updated**: Login and Register responses with complete user information

### 6. Proto Definitions (`services/go/shared/proto/auth/auth.proto`)
- **Updated**: Message definitions to include `name` field
- **Added**: `ForgotPassword` RPC with request/response messages
- **Added**: `ResetPassword` RPC with request/response messages
- **Updated**: All responses to include user details (email, name, role)

### 7. Main Service (`services/go/auth-service/main.go`)
- **Added**: `/forgot-password` endpoint
- **Added**: `/reset-password` endpoint

## Frontend Changes

### 8. Auth Actions (`web/actions/auth.ts`)
- **Updated**: Login schema to use email validation
- **Updated**: Login action to use email instead of username
- **Added**: `forgotPassword` server action
- **Added**: `resetPassword` server action
- **Added**: `getRedirectPath()` helper for role-based redirects
- **Updated**: Login action to return redirect path based on user role

### 9. Session Management (`web/lib/session.ts`)
- **Updated**: `createSession` to store email and name in cookies
- **Updated**: `deleteSession` to clear email and name cookies
- **Added**: `getUserFromSession()` helper to retrieve user info

### 10. Login Page (`web/app/auth/login/page.tsx`)
- **Updated**: Schema to use email validation
- **Updated**: Form field from username to email
- **Added**: "Forgot password?" link
- **Updated**: Success handler to use role-based redirect

### 11. Register Page (`web/app/auth/register/page.tsx`)
- **Updated**: Schema to include email and name fields
- **Updated**: Form to use email instead of username
- **Added**: Name input field

### 12. Forgot Password Page (`web/app/auth/forgot-password/page.tsx`)
- **Created**: New page for requesting password reset
- **Implemented**: Email input and submission
- **Implemented**: Success message display
- **Implemented**: Link back to login

### 13. Reset Password Page (`web/app/auth/reset-password/page.tsx`)
- **Created**: New page for resetting password with token
- **Implemented**: Token extraction from URL query params
- **Implemented**: Password and confirm password fields
- **Implemented**: Password validation and matching
- **Implemented**: Success message and auto-redirect to login

## Role-Based Redirect Logic

Users are now redirected based on their role after login:
- **system-admin** → `/admin/system`
- **institute-admin** → `/admin/institute`
- **instructor** → `/instructor/courses`
- **student** → `/student/courses`
- **default** → `/dashboard`

## Password Reset Flow

1. User clicks "Forgot password?" on login page
2. User enters email address
3. System generates secure token and stores it with 1-hour expiration
4. Email sent with reset link (console logged in development)
5. User clicks link with token in URL
6. User enters new password (with confirmation)
7. System validates token and expiration
8. Password updated and user redirected to login

## Security Considerations

- Email enumeration prevention: Always return success message for forgot password
- Secure token generation using crypto/rand
- Token expiration (1 hour)
- Password confirmation on reset
- HTTPS-only secure cookies
- HttpOnly flag on session token
- Tokens cleared after successful reset

## Environment Variables

New environment variable supported:
- `FRONTEND_URL`: Base URL for frontend application (default: `http://localhost:3000`)

## Next Steps for Production

1. **Email Integration**: Replace console logging with actual email service (SendGrid, AWS SES, etc.)
2. **Database Migration**: Run migration to update existing users table
3. **Proto Regeneration**: Run `protoc` to regenerate Go code from updated .proto files
4. **Environment Configuration**: Set proper `FRONTEND_URL` in production
5. **Email Templates**: Create HTML email templates for password reset
6. **Rate Limiting**: Add rate limiting on forgot password endpoint
7. **Audit Logging**: Log password reset attempts

## Testing Checklist

- [ ] Register with email and name
- [ ] Login with email
- [ ] Test forgot password flow
- [ ] Test reset password with valid token
- [ ] Test reset password with expired token
- [ ] Test role-based redirects for all roles
- [ ] Verify session cookies contain email and name
- [ ] Test logout clears all cookies
- [ ] Verify password confirmation validation
- [ ] Test email validation on all forms
