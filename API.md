# Auth APIs

Base URL: `http://localhost:8433`

All JSON responses use this envelope:

```json
{
	"success": true,
	"data": {},
	"message": "..."
}
```

Error format:

```json
{
	"success": false,
	"error": "...",
	"code": 400
}
```

Session auth uses cookie: `session_id`.

## Endpoint Summary

| Method | Endpoint | Auth | Request DTO |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public (must be unauthenticated) | `RegisterRequest` (`multipart/form-data`) |
| `POST` | `/api/auth/sessions` | Public (must be unauthenticated) | `LoginRequest` (JSON) |
| `DELETE` | `/api/auth/sessions` | Required (`session_id`) | None |
| `GET` | `/api/auth/me` | Required (`session_id`) | None |
| `DELETE` | `/api/auth/account` | Required (`session_id`) | None |
| `PATCH` | `/api/auth/change-password` | Required (`session_id`) | `ChangePasswordRequest` (JSON) |
| `POST` | `/api/auth/forgot-password` | Public (must be unauthenticated) | `ForgotPasswordRequest` (JSON) |
| `PATCH` | `/api/auth/reset-password?token=...` | Public (must be unauthenticated) | `ResetPasswordRequest` (JSON) |
| `DELETE` | `/api/auth/revoke-sessions` | Required (`session_id`) | None |
| `POST` | `/api/auth/send-verification-email` | Required (`session_id`) | None |
| `POST` | `/api/auth/verify-email?token=...` | Public (must be unauthenticated) | None |
| `GET` | `/api/auth/google/login` | Public (must be unauthenticated) | None |
| `GET` | `/api/auth/google/callback?code=...` | Public (must be unauthenticated) | Query params |

## DTOs

### RegisterRequest (`multipart/form-data`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Must be valid email |
| `password` | string | Yes | Min 8 chars, uppercase, lowercase, digit |
| `first_name` | string | Yes | Non-empty |
| `last_name` | string | Yes | Non-empty |
| `date_of_birth` | string | Yes | Format: `YYYY-MM-DD` |
| `nickname` | string | No | Max 30 chars |
| `about_me` | string | No | Max 500 chars |
| `is_public` | string/bool-like | No | `"true"` -> true, otherwise false |
| `avatar_path` | file | No | Image (`jpeg/png/gif`), max 20MB |

### RegisterResponse

```json
{
	"user_id": "uuid"
}
```

### LoginRequest

```json
{
	"nickname_or_email": "john@example.com",
	"password": "StrongPass1"
}
```

`nickname_or_email` accepts either:
- valid email
- nickname matching regex `^[a-zA-Z0-9_-]{3,30}$`

### LoginResponse

```json
{
	"user_id": "uuid",
	"expires_at": 1741800000
}
```

### GetUserResponse

```json
{
	"id": "uuid",
	"email": "john@example.com",
	"avatar_path": "./uploads/avatars/avatar.png",
	"nickname": "john_doe"
}
```

### ChangePasswordRequest

```json
{
	"confirm_password": "NewStrongPass1",
	"new_password": "NewStrongPass1"
}
```

### ForgotPasswordRequest

```json
{
	"email": "john@example.com"
}
```

### ResetPasswordRequest

```json
{
	"confirm_password": "NewStrongPass1",
	"new_password": "NewStrongPass1"
}
```

## Detailed Endpoints + Examples

### 1) Register

- Method: `POST`
- Endpoint: `/api/auth/register`
- Auth: Must be logged out
- Content-Type: `multipart/form-data`

Example request:

```bash
curl -X POST "http://localhost:8433/api/auth/register" \
	-F "email=john@example.com" \
	-F "password=StrongPass1" \
	-F "first_name=John" \
	-F "last_name=Doe" \
	-F "date_of_birth=1999-05-20" \
	-F "nickname=john_doe" \
	-F "about_me=Hi there" \
	-F "is_public=true" \
	-F "avatar_path=@C:/images/avatar.png"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a"
	},
	"message": "User registered successfully"
}
```

### 2) Login (Create Session)

- Method: `POST`
- Endpoint: `/api/auth/sessions`
- Auth: Must be logged out
- Content-Type: `application/json`
- Sets cookie: `session_id`

Example request:

```bash
curl -i -X POST "http://localhost:8433/api/auth/sessions" \
	-H "Content-Type: application/json" \
	-d '{
		"nickname_or_email": "john@example.com",
		"password": "StrongPass1"
	}'
```

Example success response:

```json
{
	"success": true,
	"data": {
		"user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
		"expires_at": 1741800000
	},
	"message": "Login successful"
}
```

### 3) Logout (Delete Current Session)

- Method: `DELETE`
- Endpoint: `/api/auth/sessions`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/auth/sessions" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Logged out successfully"
}
```

### 4) Get Current User

- Method: `GET`
- Endpoint: `/api/auth/me`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/auth/me" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
		"email": "john@example.com",
		"avatar_path": "./uploads/avatars/avatar.png",
		"nickname": "john_doe"
	},
	"message": "Current user retrieved successfully"
}
```

### 5) Delete Account

- Method: `DELETE`
- Endpoint: `/api/auth/account`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/auth/account" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Account deleted successfully"
}
```

### 6) Change Password

- Method: `PATCH`
- Endpoint: `/api/auth/change-password`
- Auth: Required
- Content-Type: `application/json`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/auth/change-password" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"confirm_password": "NewStrongPass1",
		"new_password": "NewStrongPass1"
	}'
```

Example success response:

```json
{
	"success": true,
	"message": "Password reset successfully"
}
```

### 7) Forgot Password

- Method: `POST`
- Endpoint: `/api/auth/forgot-password`
- Auth: Must be logged out
- Content-Type: `application/json`

Example request:

```bash
curl -X POST "http://localhost:8433/api/auth/forgot-password" \
	-H "Content-Type: application/json" \
	-d '{
		"email": "john@example.com"
	}'
```

Example success response:

```json
{
	"success": true,
	"message": "Password reset email sent successfully"
}
```

### 8) Reset Password With Token

- Method: `PATCH`
- Endpoint: `/api/auth/reset-password?token=<token>`
- Auth: Must be logged out
- Content-Type: `application/json`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/auth/reset-password?token=<reset_token>" \
	-H "Content-Type: application/json" \
	-d '{
		"confirm_password": "NewStrongPass1",
		"new_password": "NewStrongPass1"
	}'
```

Example success response:

```json
{
	"success": true,
	"message": "Password reset successfully"
}
```

### 9) Revoke All Sessions

- Method: `DELETE`
- Endpoint: `/api/auth/revoke-sessions`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/auth/revoke-sessions" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "All sessions revoked successfully"
}
```

### 10) Send Verification Email

- Method: `POST`
- Endpoint: `/api/auth/send-verification-email`
- Auth: Required
- Request body: none (email is taken from logged-in user)

Example request:

```bash
curl -X POST "http://localhost:8433/api/auth/send-verification-email" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Verification email sent"
}
```

### 11) Verify Email

- Method: `POST`
- Endpoint: `/api/auth/verify-email?token=<token>`
- Auth: Must be logged out

Example request:

```bash
curl -X POST "http://localhost:8433/api/auth/verify-email?token=<verification_token>"
```

Example success response:

```json
{
	"success": true,
	"message": "Email verified successfully"
}
```

### 12) Google Login

- Method: `GET`
- Endpoint: `/api/auth/google/login`
- Auth: Must be logged out
- Behavior: Redirects (`302`) to Google OAuth consent page

Example request:

```bash
curl -I "http://localhost:8433/api/auth/google/login"
```

### 13) Google Callback

- Method: `GET`
- Endpoint: `/api/auth/google/callback?code=<google_code>`
- Auth: Must be logged out
- Behavior: Creates/gets user, creates session, sets `session_id` cookie

Example request:

```bash
curl -X GET "http://localhost:8433/api/auth/google/callback?code=<google_code>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
		"expires_at": 1741800000
	},
	"message": "Authenticated with Google successfully"
}
```

## Common Error Cases

- `405 Method not allowed` if wrong HTTP method is used.
- `401 Unauthorized` if protected endpoint is called without valid `session_id` cookie.
- `403 Already authenticated` if a public-only endpoint is called by logged-in user.
- `400 Missing token` for token-required endpoints without `?token=`.
- `400 Invalid request body` when JSON body is malformed.

# Follow APIs

Base URL: `http://localhost:8433`

All JSON responses use this envelope:

```json
{
	"success": true,
	"data": {},
	"message": "..."
}
```

Error format:

```json
{
	"success": false,
	"error": "...",
	"code": 400
}
```

Session auth uses cookie: `session_id`.

## Endpoint Summary

| Method | Endpoint | Auth | Request DTO |
|---|---|---|---|
| `POST` | `/api/follows/{userId}` | Required (`session_id`) | Path param: `userId` |
| `DELETE` | `/api/follows/{userId}` | Required (`session_id`) | Path param: `userId` |
| `DELETE` | `/api/followers/{userId}` | Required (`session_id`) | Path param: `userId` |
| `POST` | `/api/follow-requests/{userId}` | Required (`session_id`) | Path param: `userId` |
| `DELETE` | `/api/follow-requests/{userId}` | Required (`session_id`) | Path param: `userId` |
| `POST` | `/api/follow-requests/{userId}/accept` | Required (`session_id`) | Path param: `userId` |
| `POST` | `/api/follow-requests/{userId}/reject` | Required (`session_id`) | Path param: `userId` |
| `GET` | `/api/follow-requests` | Required (`session_id`) | None |
| `GET` | `/api/follow-requests/sent` | Required (`session_id`) | None |
| `GET` | `/api/following` | Required (`session_id`) | None |
| `GET` | `/api/followers` | Required (`session_id`) | None |

## DTOs

### FollowInfoResponse

```json
{
	"user_id": "uuid",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/avatar.png"
}
```

### FollowRequestReceivedResponse

```json
{
	"from_user_id": "uuid",
	"target_id": "uuid",
	"status": "pending",
	"created_at": "2026-03-20T10:20:30Z",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/avatar.png"
}
```

### FollowRequestResponse (Sent Requests)

```json
{
	"requester_id": "uuid",
	"target_id": "uuid",
	"status": "pending",
	"created_at": "2026-03-20T10:20:30Z",
	"nickname": "target_user",
	"avatar_path": "./uploads/avatars/avatar.png"
}
```

## Detailed Endpoints + Examples

### 1) Follow User

- Method: `POST`
- Endpoint: `/api/follows/{userId}`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follows/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "User followed successfully"
}
```

### 2) Unfollow User

- Method: `DELETE`
- Endpoint: `/api/follows/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/follows/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "User unfollowed successfully"
}
```

### 3) Remove Follower

- Method: `DELETE`
- Endpoint: `/api/followers/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/followers/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Follower removed successfully"
}
```

### 4) Create Follow Request

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Follow request created successfully"
}
```

### 5) Cancel Follow Request

- Method: `DELETE`
- Endpoint: `/api/follow-requests/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/follow-requests/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Follow request canceled successfully"
}
```

### 6) Accept Follow Request

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}/accept`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a/accept" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Follow request accepted"
}
```

### 7) Reject Follow Request

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}/reject`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a/reject" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"message": "Follow request rejected"
}
```

### 8) Get Received Follow Requests

- Method: `GET`
- Endpoint: `/api/follow-requests`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/follow-requests" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": [
		{
			"from_user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
			"target_id": "f6c0f9d2-bf95-4ae9-95e0-67f5c6522f8f",
			"status": "pending",
			"created_at": "2026-03-20T10:20:30Z",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/avatar.png"
		}
	],
	"message": "Follow requests retrieved successfully"
}
```

### 9) Get Sent Follow Requests

- Method: `GET`
- Endpoint: `/api/follow-requests/sent`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/follow-requests/sent" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": [
		{
			"requester_id": "f6c0f9d2-bf95-4ae9-95e0-67f5c6522f8f",
			"target_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
			"status": "pending",
			"created_at": "2026-03-20T10:20:30Z",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/avatar.png"
		}
	],
	"message": "Sent follow requests retrieved successfully"
}
```

### 10) Get Following

- Method: `GET`
- Endpoint: `/api/following`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/following" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": [
		{
			"user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/avatar.png"
		}
	],
	"message": "Following retrieved successfully"
}
```

### 11) Get Followers

- Method: `GET`
- Endpoint: `/api/followers`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/followers" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": [
		{
			"user_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/avatar.png"
		}
	],
	"message": "Followers retrieved successfully"
}
```

## Common Error Cases

- `405 Method not allowed` if wrong HTTP method is used.
- `401 Unauthorized` if endpoint is called without a valid `session_id` cookie.
- `400 Missing userId parameter` for endpoints requiring `{userId}` when it is missing/invalid.
- `400 cannot follow yourself` when trying to follow your own account.
- `400 target user is public, follow directly` when sending a request to a public account.
- `400 follow request not found` when canceling/accepting/rejecting a non-existent pending request.
