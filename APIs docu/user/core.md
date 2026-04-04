# User Core APIs

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
| `GET` | `/api/users/me` | Required (`session_id`) | None |
| `GET` | `/api/users/search` | Required (`session_id`) | Query params (`q`, `cursor`, `limit`) |
| `GET` | `/api/users/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `PATCH` | `/api/users/me` | Required (`session_id`) | `EditUserRequest` (JSON) |
| `PATCH` | `/api/users/me/avatar` | Required (`session_id`) | `multipart/form-data` (`avatar_path`) |

## DTOs

### UserProfileResponse

```json
{
	"id": "uuid",
	"nickname": "john_doe",
	"first_name": "John",
	"last_name": "Doe",
	"about_me": "Hello there",
	"avatar_path": "./uploads/avatars/avatar.jpg",
	"is_public": true,
	"total_posts": 12,
	"total_followers": 8,
	"total_following": 20,
	"created_at": "2026-03-20T11:22:33Z"
}
```

### EditUserRequest

```json
{
	"nickname": "john_doe",
	"first_name": "John",
	"last_name": "Doe",
	"about_me": "Updated bio",
	"is_public": true
}
```

Notes:
- All fields are optional (partial update behavior).
- `is_public` is a boolean field.

### UserSearchResult

```json
{
	"id": "uuid",
	"nickname": "john_doe",
	"first_name": "John",
	"last_name": "Doe",
	"avatar_path": "./uploads/avatars/avatar.jpg",
	"is_public": true
}
```

### SearchUsersResponse

```json
{
	"users": [
		{
			"id": "uuid",
			"nickname": "john_doe",
			"first_name": "John",
			"last_name": "Doe",
			"avatar_path": "./uploads/avatars/avatar.jpg",
			"is_public": true
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Get Current User Profile

- Method: `GET`
- Endpoint: `/api/users/me`
- Auth: Required

Example request:

```bash
curl "http://localhost:8433/api/users/me" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
		"nickname": "john_doe",
		"first_name": "John",
		"last_name": "Doe",
		"about_me": "Hello there",
		"avatar_path": "./uploads/avatars/avatar.jpg",
		"is_public": true,
		"total_posts": 12,
		"total_followers": 8,
		"total_following": 20,
		"created_at": "2026-03-20T11:22:33Z"
	},
	"message": "User retrieved successfully"
}
```

### 2) Search Users

- Method: `GET`
- Endpoint: `/api/users/search`
- Auth: Required
- Query params:
  - `q` (required): search text
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/users/search?q=john&limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"users": [
			{
				"id": "7b351f19-5fa2-4f9d-90c2-11f126f1f321",
				"nickname": "johnny",
				"first_name": "John",
				"last_name": "Carter",
				"avatar_path": "./uploads/avatars/johnny.jpg",
				"is_public": true
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Users found successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Missing required query parameter: q",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "Invalid limit. It must be an integer between 1 and 100",
	"code": 400
}
```

### 3) Get User By ID

- Method: `GET`
- Endpoint: `/api/users/{userId}`
- Auth: Required
- Path param: `userId`

Example request:

```bash
curl "http://localhost:8433/api/users/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"id": "7b351f19-5fa2-4f9d-90c2-11f126f1f321",
		"nickname": "johnny",
		"first_name": "John",
		"last_name": "Carter",
		"about_me": "Building stuff",
		"avatar_path": "./uploads/avatars/johnny.jpg",
		"is_public": true,
		"total_posts": 5,
		"total_followers": 10,
		"total_following": 3,
		"created_at": "2026-03-18T08:11:00Z"
	},
	"message": "User retrieved successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Missing userId parameter",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "Cannot retrieve your own user data with this endpoint",
	"code": 403
}
```

```json
{
	"success": false,
	"error": "user not found",
	"code": 404
}
```

### 4) Edit Current User

- Method: `PATCH`
- Endpoint: `/api/users/me`
- Auth: Required
- Content-Type: `application/json`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/users/me" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"nickname": "new_nickname",
		"first_name": "John",
		"last_name": "Doe",
		"about_me": "Updated bio",
		"is_public": false
	}'
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "User updated successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "Invalid request body",
	"code": 400
}
```

### 5) Change Avatar

- Method: `PATCH`
- Endpoint: `/api/users/me/avatar`
- Auth: Required
- Content-Type: `multipart/form-data`
- Form field: `avatar_path` (optional)

Image rules:
- Allowed types: `image/jpeg`, `image/png`, `image/gif`
- Max size: `20MB`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/users/me/avatar" \
	--cookie "session_id=<your_session_id>" \
	-F "avatar_path=@C:/images/avatar.png"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Avatar updated successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "file size exceeds 20MB limit",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "only JPEG, PNG, GIF allowed",
	"code": 400
}
```
