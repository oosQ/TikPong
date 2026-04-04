# Notification APIs

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
| `GET` | `/api/notifications` | Required (`session_id`) | Query params (`unread`, `cursor`, `limit`) |
| `POST` | `/api/notifications/{notificationId}/read` | Required (`session_id`) | Path param (`notificationId`) |
| `POST` | `/api/notifications/read-all` | Required (`session_id`) | None |

## DTOs

### NotificationResponse

```json
{
	"id": "uuid",
	"type": "follow_request",
	"title": "New follow request",
	"message": "You received a follow request",
	"payload": "{\"from_user_id\":\"uuid\"}",
	"is_read": false,
	"created_at": "2026-04-02T12:00:00Z"
}
```

### GetNotificationsResponse

```json
{
	"notifications": [
		{
			"id": "uuid",
			"type": "follow_request",
			"title": "New follow request",
			"message": "You received a follow request",
			"payload": "{\"from_user_id\":\"uuid\"}",
			"is_read": false,
			"created_at": "2026-04-02T12:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Get Notifications

- Method: `GET`
- Endpoint: `/api/notifications`
- Auth: Required
- Query params:
  - `unread` (optional): `true` to return unread notifications only
  - `cursor` (optional): pagination cursor (notification id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request (all):

```bash
curl "http://localhost:8433/api/notifications?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example request (unread only):

```bash
curl "http://localhost:8433/api/notifications?unread=true&limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"notifications": [
			{
				"id": "n-001",
				"type": "follow_request",
				"title": "New follow request",
				"message": "You received a follow request",
				"payload": "{\"from_user_id\":\"u-001\"}",
				"is_read": false,
				"created_at": "2026-04-02T12:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Notifications retrieved successfully"
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

### 2) Mark One Notification As Read

- Method: `POST`
- Endpoint: `/api/notifications/{notificationId}/read`
- Auth: Required
- Path param: `notificationId`

Example request:

```bash
curl -X POST "http://localhost:8433/api/notifications/n-001/read" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Notification marked as read"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Missing notificationId parameter",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "notification not found",
	"code": 400
}
```

### 3) Mark All Notifications As Read

- Method: `POST`
- Endpoint: `/api/notifications/read-all`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/notifications/read-all" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "All notifications marked as read"
}
```

## Notes

- All notification endpoints require authentication.
- Notifications are user-scoped; users can read/update only their own notifications.
- `payload` in API responses is stored as a JSON string.
- Cursor pagination is ordered by `created_at DESC, id DESC`.
- The backend also dispatches real-time notification events over WebSocket (`notification:new`) when notifications are created by other features.