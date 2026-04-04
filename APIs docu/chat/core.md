# Chat APIs

Base URL: http://localhost:8433

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

Session auth uses cookie: session_id.

## Endpoint Summary

| Method | Endpoint | Auth | Request DTO |
|---|---|---|---|
| GET | /api/chat/private/inbox | Required (session_id) | Query params (cursor, limit) |
| GET | /api/chat/groups/inbox | Required (session_id) | Query params (cursor, limit) |
| POST | /api/chat/private/{userId} | Required (session_id) | SendMessageRequest (JSON) |
| GET | /api/chat/private/{userId} | Required (session_id) | Query params (cursor, limit) |
| POST | /api/groups/{groupId}/chat | Required (session_id) | SendMessageRequest (JSON) |
| GET | /api/groups/{groupId}/chat | Required (session_id) | Query params (cursor, limit) |
| GET | /ws | Auth required (session-based current user) | WebSocket upgrade |

## DTOs

### SendMessageRequest

```json
{
	"content": "Hello there"
}
```

Validation:
- content is required (trimmed content cannot be empty)

### PrivateMessageResponse

```json
{
	"id": "uuid",
	"sender_id": "uuid",
	"recipient_id": "uuid",
	"content": "Hello",
	"created_at": "2026-04-02T12:00:00Z"
}
```

### GetPrivateMessagesResponse

```json
{
	"messages": [
		{
			"id": "uuid",
			"sender_id": "uuid",
			"recipient_id": "uuid",
			"content": "Hello",
			"created_at": "2026-04-02T12:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### GroupMessageResponse

```json
{
	"id": "uuid",
	"group_id": "uuid",
	"sender_id": "uuid",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/john.jpg",
	"content": "Hello group",
	"created_at": "2026-04-02T12:00:00Z"
}
```

### GetGroupMessagesResponse

```json
{
	"messages": [
		{
			"id": "uuid",
			"group_id": "uuid",
			"sender_id": "uuid",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/john.jpg",
			"content": "Hello group",
			"created_at": "2026-04-02T12:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### PrivateConversationResponse

```json
{
	"user_id": "uuid",
	"nickname": "jane_doe",
	"first_name": "Jane",
	"last_name": "Doe",
	"avatar_path": "./uploads/avatars/jane.jpg",
	"last_message": "Last text",
	"last_message_at": "2026-04-02T12:00:00Z",
	"last_sender_id": "uuid"
}
```

### GetPrivateConversationsResponse

```json
{
	"conversations": [
		{
			"user_id": "uuid",
			"nickname": "jane_doe",
			"first_name": "Jane",
			"last_name": "Doe",
			"avatar_path": "./uploads/avatars/jane.jpg",
			"last_message": "Last text",
			"last_message_at": "2026-04-02T12:00:00Z",
			"last_sender_id": "uuid"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### GroupConversationResponse

```json
{
	"group_id": "uuid",
	"group_title": "Team Alpha",
	"group_avatar": "./uploads/groups/alpha.jpg",
	"last_message": "Last group message",
	"last_message_at": "2026-04-02T12:00:00Z",
	"last_sender_id": "uuid",
	"last_sender": "john_doe",
	"last_sender_avatar_path": "./uploads/avatars/john.jpg"
}
```

### GetGroupConversationsResponse

```json
{
	"conversations": [
		{
			"group_id": "uuid",
			"group_title": "Team Alpha",
			"group_avatar": "./uploads/groups/alpha.jpg",
			"last_message": "Last group message",
			"last_message_at": "2026-04-02T12:00:00Z",
			"last_sender_id": "uuid",
			"last_sender": "john_doe",
			"last_sender_avatar_path": "./uploads/avatars/john.jpg"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Get Private Inbox

- Method: GET
- Endpoint: /api/chat/private/inbox
- Auth: Required
- Query params: cursor, limit

Example request:

```bash
curl "http://localhost:8433/api/chat/private/inbox?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"conversations": [],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Private conversations retrieved successfully"
}
```

### 2) Get Group Inbox

- Method: GET
- Endpoint: /api/chat/groups/inbox
- Auth: Required
- Query params: cursor, limit

Example request:

```bash
curl "http://localhost:8433/api/chat/groups/inbox?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"conversations": [],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Group conversations retrieved successfully"
}
```

### 3) Send Private Message

- Method: POST
- Endpoint: /api/chat/private/{userId}
- Auth: Required
- Content-Type: application/json

Example request:

```bash
curl -X POST "http://localhost:8433/api/chat/private/u-002" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"content": "Hey, how are you?"
	}'
```

Example success response:

```json
{
	"success": true,
	"data": {
		"message_id": "m-001"
	},
	"message": "Message sent"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "cannot message yourself",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "cannot message a blocked user",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "you can only message users you follow or who follow you",
	"code": 400
}
```

### 4) Get Private Messages

- Method: GET
- Endpoint: /api/chat/private/{userId}
- Auth: Required
- Query params: cursor, limit

Example request:

```bash
curl "http://localhost:8433/api/chat/private/u-002?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"messages": [
			{
				"id": "m-001",
				"sender_id": "u-001",
				"recipient_id": "u-002",
				"content": "Hey",
				"created_at": "2026-04-02T12:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Messages retrieved successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "cannot access chats with a blocked user",
	"code": 400
}
```

### 5) Send Group Message

- Method: POST
- Endpoint: /api/groups/{groupId}/chat
- Auth: Required
- Content-Type: application/json

Example request:

```bash
curl -X POST "http://localhost:8433/api/groups/g-001/chat" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"content": "Hello team"
	}'
```

Example success response:

```json
{
	"success": true,
	"data": {
		"message_id": "gm-001"
	},
	"message": "Group message sent"
}
```

Common error response:

```json
{
	"success": false,
	"error": "only group members can send group chat messages",
	"code": 400
}
```

### 6) Get Group Messages

- Method: GET
- Endpoint: /api/groups/{groupId}/chat
- Auth: Required
- Query params: cursor, limit

Example request:

```bash
curl "http://localhost:8433/api/groups/g-001/chat?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"messages": [
			{
				"id": "gm-001",
				"group_id": "g-001",
				"sender_id": "u-001",
				"nickname": "john_doe",
				"avatar_path": "./uploads/avatars/john.jpg",
				"content": "Hello team",
				"created_at": "2026-04-02T12:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Group messages retrieved successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "only group members can view group chat",
	"code": 400
}
```

## WebSocket

### Endpoint

- URL: /ws
- Auth: required (current user must be authenticated)

Example connection:

```javascript
const ws = new WebSocket("ws://localhost:8433/ws");

ws.onmessage = (event) => {
	const message = JSON.parse(event.data);
	console.log(message.type, message.data);
};
```

Initial server event after successful connection:

```json
{
	"type": "connected",
	"data": {
		"status": "connected",
		"user_id": "uuid"
	}
}
```

Chat-related pushed events used by backend:
- chat:private:new
- chat:private:conversation-updated
- chat:group:new
- chat:group:conversation-updated

Related event from notification subsystem (triggered by private message send):
- notification:new

## Notes

- All REST chat endpoints require authentication.
- Private chat is allowed only when users are not blocked and at least one follows the other.
- Group chat access is restricted to group members.
- Message list endpoints use cursor pagination with limit between 1 and 100.
- Private and group message fetch endpoints return messages in ascending order by created_at.
