# Admin-Assisted Password Reset System

This system provides password reset functionality without requiring email services. It's designed for applications where email is unavailable or impractical.

## Overview

The password reset system has two main approaches:
1. **Admin-Generated Reset Token** - Admin generates a secure token/link to share with users
2. **Temporary Password** - Admin sets a temporary password that users must change on first login

## User Flow

### 1. Forgot Password
When a user forgets their password:
- User clicks "Forgot Password" on the login page
- System displays: "To reset your password, please contact the administrator with your registered email address."
- User contacts admin via phone, WhatsApp, or in-person
- Admin verifies user identity before providing reset method

### 2. Admin Provides Reset Method

**Option A: Reset Token/Link**
- Admin generates a reset token for the user
- Admin shares the reset URL or token with the verified user
- User clicks the link or enters the token on the reset password page
- User creates a new password
- Token expires after 24 hours

**Option B: Temporary Password**
- Admin sets a temporary password for the user
- Admin shares the temporary password with the verified user
- User logs in with temporary password
- System detects `password_reset_required` flag and prompts password change
- User must change password before continuing

## API Endpoints

### Public Endpoints

#### Forgot Password
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "message": "To reset your password, please contact the administrator..." }
```

#### Reset Password (with token)
```
POST /api/auth/reset-password
Body: {
  "email": "user@example.com",
  "token": "generated_token_from_admin",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
Response: { "message": "Your password has been reset successfully..." }
```

#### Login (returns password_reset_required flag)
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: {
  "user": {...},
  "token": "...",
  "password_reset_required": true/false
}
```

#### Change Password (authenticated users)
```
POST /api/auth/change-password
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "current_password": "temporary_or_current_password",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
Response: { "message": "Password changed successfully..." }
```

### Admin Endpoints (require admin authentication)

#### Generate Reset Token for User
```
POST /api/admin/users/{user_id}/generate-reset-token
Response: {
  "data": {
    "user": { "name": "...", "email": "..." },
    "token": "64_character_random_token",
    "reset_url": "https://yourapp.com/reset-password?token=...&email=...",
    "expires_at": "2024-01-02 12:00:00",
    "note": "Share this reset link or token with the user. Valid for 24 hours."
  }
}
```

#### Set Temporary Password
```
POST /api/admin/users/{user_id}/set-temporary-password
Body: { "temporary_password": "Temp123456" }
Response: {
  "data": {
    "user": { "name": "...", "email": "..." },
    "temporary_password": "Temp123456",
    "note": "Share this temporary password with the user..."
  }
}
```

#### Get Users with Pending Password Resets
```
GET /api/admin/users/password-resets/pending
Response: {
  "data": {
    "users_with_temporary_password": [...],
    "users_with_reset_token": [...]
  }
}
```

## Database Changes

### Migration
A new migration adds the `password_reset_required` column to the users table:
- **File**: `database/migrations/2024_01_01_000012_add_password_reset_required_to_users_table.php`
- **Column**: `password_reset_required` (boolean, default: false)

### Running the Migration
```bash
php artisan migrate
```

## Implementation Details

### Files Modified/Created

1. **AuthBaseController** (`app/Http/Controllers/Api/Auth/AuthBaseController.php`)
   - Updated `forgotPassword()` - Shows contact instructions instead of sending email
   - Updated `resetPassword()` - Clears `password_reset_required` flag after reset
   - Updated `login()` - Returns `password_reset_required` flag
   - Added `changePassword()` - Allows users to change password

2. **UserBaseController** (`app/Http/Controllers/Api/Admin/UserBaseController.php`)
   - Added `generateResetToken()` - Creates reset token for admin to share
   - Added `setTemporaryPassword()` - Sets temp password with reset required
   - Added `getPendingResets()` - Lists users needing password reset

3. **User Model** (`app/Models/User.php`)
   - Added `password_reset_required` to fillable fields
   - Added boolean cast for `password_reset_required`

4. **UserResource** (`app/Http/Resources/UserResource.php`)
   - Added `password_reset_required` field to API responses

5. **Routes** (`routes/api.php`)
   - Added admin password reset routes
   - Added change password route for authenticated users

## Frontend Integration Guide

### 1. Forgot Password Page
```javascript
// When user submits forgot password form
const response = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email: userEmail })
});

// Show contact admin message to user
// response.message: "To reset your password, please contact the administrator..."
```

### 2. Login Flow
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

const { user, token, password_reset_required } = await response.json();

if (password_reset_required) {
  // Redirect to change password page
  // User must change password before accessing app
  navigate('/change-password');
} else {
  // Normal login - proceed to dashboard
  navigate('/dashboard');
}
```

### 3. Change Password Page
```javascript
// For users with temporary password
const response = await fetch('/api/auth/change-password', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    current_password: tempPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirm
  })
});

// After successful change, redirect to login
navigate('/login');
```

### 4. Admin Panel - Password Reset Management

#### Generate Reset Token
```javascript
const response = await fetch(`/api/admin/users/${userId}/generate-reset-token`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const { reset_url, token, expires_at } = await response.json();

// Display reset_url and token to admin
// Admin can copy and share via WhatsApp, phone, etc.
```

#### Set Temporary Password
```javascript
const response = await fetch(`/api/admin/users/${userId}/set-temporary-password`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: JSON.stringify({ temporary_password: 'Temp123456' })
});

// Display temporary password to admin
// Admin shares with user via phone/WhatsApp
```

#### View Pending Resets
```javascript
const response = await fetch('/api/admin/users/password-resets/pending', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const { users_with_temporary_password, users_with_reset_token } = await response.json();

// Display lists of users needing password reset
```

## Security Considerations

1. **Token Expiry**: Reset tokens expire after 24 hours
2. **Token Revocation**: All user tokens are revoked after password change
3. **Secure Sharing**: Admins should verify user identity before providing reset methods
4. **Communication**: Use secure channels (phone, encrypted messaging) to share credentials
5. **Rate Limiting**: Forgot password and reset endpoints have rate limiting
6. **Password Requirements**: Enforce minimum 8 characters (can be customized)

## Testing the Implementation

### 1. Test Forgot Password
```bash
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### 2. Admin Generates Reset Token
```bash
curl -X POST http://localhost:8000/api/admin/users/1/generate-reset-token \
  -H "Authorization: Bearer {admin_token}"
```

### 3. User Resets Password
```bash
curl -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "token":"generated_token_here",
    "password":"newpassword123",
    "password_confirmation":"newpassword123"
  }'
```

### 4. Admin Sets Temporary Password
```bash
curl -X POST http://localhost:8000/api/admin/users/1/set-temporary-password \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"temporary_password":"Temp123456"}'
```

### 5. User Changes Password
```bash
curl -X POST http://localhost:8000/api/auth/change-password \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password":"Temp123456",
    "new_password":"newpassword123",
    "new_password_confirmation":"newpassword123"
  }'
```

## Workflow Diagram

```
User Forgets Password
         |
         v
   Contact Admin
         |
         v
   Admin Verifies Identity
         |
         v
    Admin Chooses Method
         |
    +----+----+
    |         |
    v         v
Reset Token  Temp Password
    |         |
    |         v
    |    User Logs In
    |         |
    |         v
    |    Forced Password Change
    |         |
    +----+----+
         |
         v
   Password Reset Complete
```

## Support and Maintenance

- Monitor pending resets via admin endpoint
- Regularly clear expired tokens from `password_reset_tokens` table
- Train admin staff on verification procedures
- Document approved communication channels for sharing credentials
