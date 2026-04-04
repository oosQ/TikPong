# User Follow APIs

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
| `POST` | `/api/follows/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `DELETE` | `/api/follows/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `DELETE` | `/api/followers/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `GET` | `/api/follow-requests` | Required (`session_id`) | Query params (`cursor`, `limit`) |
| `POST` | `/api/follow-requests/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `DELETE` | `/api/follow-requests/{userId}` | Required (`session_id`) | Path param (`userId`) |
| `POST` | `/api/follow-requests/{userId}/accept` | Required (`session_id`) | Path param (`userId`) |
| `POST` | `/api/follow-requests/{userId}/reject` | Required (`session_id`) | Path param (`userId`) |
| `GET` | `/api/following` | Required (`session_id`) | Query params (`cursor`, `limit`) |
| `GET` | `/api/followers` | Required (`session_id`) | Query params (`cursor`, `limit`) |
| `GET` | `/api/follow-requests/sent` | Required (`session_id`) | Query params (`cursor`, `limit`) |

## DTOs

### FollowRequestReceivedResponse

```json
{
	"from_user_id": "uuid",
	"target_id": "uuid",
	"status": "pending",
	"created_at": "2026-04-02T09:00:00Z",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/john.jpg"
}
```

### GetFollowRequestsResponse

```json
{
	"requests": [
		{
			"from_user_id": "uuid",
			"target_id": "uuid",
			"status": "pending",
			"created_at": "2026-04-02T09:00:00Z",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/john.jpg"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### FollowRequestResponse

```json
{
	"requester_id": "uuid",
	"target_id": "uuid",
	"status": "pending",
	"created_at": "2026-04-02T09:00:00Z",
	"nickname": "jane_doe",
	"avatar_path": "./uploads/avatars/jane.jpg"
}
```

### GetSentFollowRequestsResponse

```json
{
	"requests": [
		{
			"requester_id": "uuid",
			"target_id": "uuid",
			"status": "pending",
			"created_at": "2026-04-02T09:00:00Z",
			"nickname": "jane_doe",
			"avatar_path": "./uploads/avatars/jane.jpg"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### FollowInfoResponse

```json
{
	"user_id": "uuid",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/john.jpg"
}
```

### GetFollowInfoResponse

```json
{
	"users": [
		{
			"user_id": "uuid",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/john.jpg"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Follow User (Public Accounts)

- Method: `POST`
- Endpoint: `/api/follows/{userId}`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follows/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "User followed successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "cannot follow yourself",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "cannot follow a private user without sending a follow request",
	"code": 400
}
```

### 2) Unfollow User

- Method: `DELETE`
- Endpoint: `/api/follows/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/follows/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "User unfollowed successfully"
}
```

### 3) Remove Follower

- Method: `DELETE`
- Endpoint: `/api/followers/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/followers/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Follower removed successfully"
}
```

### 4) Create Follow Request (Private Accounts)

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Follow request created successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "cannot send a follow request to yourself",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "target user is public, follow directly",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "follow request already exists",
	"code": 400
}
```

### 5) Cancel Sent Follow Request

- Method: `DELETE`
- Endpoint: `/api/follow-requests/{userId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/follow-requests/7b351f19-5fa2-4f9d-90c2-11f126f1f321" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Follow request canceled successfully"
}
```

### 6) Accept Follow Request

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}/accept`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/7b351f19-5fa2-4f9d-90c2-11f126f1f321/accept" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Follow request accepted"
}
```

### 7) Reject Follow Request

- Method: `POST`
- Endpoint: `/api/follow-requests/{userId}/reject`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/follow-requests/7b351f19-5fa2-4f9d-90c2-11f126f1f321/reject" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Follow request rejected"
}
```

### 8) Get Incoming Follow Requests

- Method: `GET`
- Endpoint: `/api/follow-requests`
- Auth: Required
- Query params:
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/follow-requests?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"requests": [
			{
				"from_user_id": "7b351f19-5fa2-4f9d-90c2-11f126f1f321",
				"target_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
				"status": "pending",
				"created_at": "2026-04-02T09:00:00Z",
				"nickname": "johnny",
				"avatar_path": "./uploads/avatars/johnny.jpg"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Follow requests retrieved successfully"
}
```

### 9) Get Sent Follow Requests

- Method: `GET`
- Endpoint: `/api/follow-requests/sent`
- Auth: Required
- Query params:
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/follow-requests/sent?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"requests": [
			{
				"requester_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a",
				"target_id": "7b351f19-5fa2-4f9d-90c2-11f126f1f321",
				"status": "pending",
				"created_at": "2026-04-02T09:00:00Z",
				"nickname": "johnny",
				"avatar_path": "./uploads/avatars/johnny.jpg"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Sent follow requests retrieved successfully"
}
```

### 10) Get My Following List

- Method: `GET`
- Endpoint: `/api/following`
- Auth: Required
- Query params:
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/following?limit=20" \
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
				"avatar_path": "./uploads/avatars/johnny.jpg"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Following retrieved successfully"
}
```

### 11) Get My Followers List

- Method: `GET`
- Endpoint: `/api/followers`
- Auth: Required
- Query params:
  - `cursor` (optional): pagination cursor (user id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/followers?limit=20" \
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
				"avatar_path": "./uploads/avatars/johnny.jpg"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Followers retrieved successfully"
}
```

### Notes

- All follow endpoints require authentication.
- Listing endpoints use cursor pagination (`cursor`, `limit`).
- `limit` validation is shared across endpoints: it must be between `1` and `100`.