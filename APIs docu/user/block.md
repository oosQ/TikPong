# User Block APIs

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
| `POST` | `/api/blocks/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `DELETE` | `/api/blocks/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `GET` | `/api/blocks` | Required (`session_id`) | Query params (`cursor`, `limit`) |

## DTOs

### BlockedUserResponse

```json
{
	"user_id": "uuid",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/john.jpg",
	"blocked_at": "2026-04-02T12:00:00Z"
}
```

### GetBlockedUsersResponse

```json
{
	"users": [
		{
			"user_id": "uuid",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/john.jpg",
			"blocked_at": "2026-04-02T12:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Block User

- Method: `POST`
- Endpoint: `/api/blocks/{userId}`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/blocks/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "User blocked successfully"
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
	"error": "cannot block yourself",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "user not found",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "user is already blocked",
	"code": 400
}
```

### 2) Unblock User

- Method: `DELETE`
- Endpoint: `/api/blocks/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/blocks/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "User unblocked successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "cannot unblock yourself",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "user is not blocked",
	"code": 400
}
```

### 3) Get Blocked Users

- Method: `GET`
- Endpoint: `/api/blocks`
- Auth: Required
- Query params:
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/blocks?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"users": [
			{
				"user_id": "7b351f19-5fa2-4f9d-90c2-11f126f1f321",
				"nickname": "johnny",
				"avatar_path": "./uploads/avatars/johnny.jpg",
				"blocked_at": "2026-04-02T12:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Blocked users retrieved successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "Invalid limit. It must be an integer between 1 and 100",
	"code": 400
}
```

## Notes

- All block endpoints require authentication.
- Blocking is one-way (`blocker_id -> blocked_id`).
- When a block is created, both directions of follow relationships are removed (if they exist).
- When a block is created, pending/old follow requests between the two users are deleted in both directions.