# Post Comment APIs

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
| `POST` | `/api/posts/{postId}/comments` | Required (`session_id`) | `CreateCommentRequest` (JSON or `multipart/form-data`) |
| `GET` | `/api/posts/{postId}/comments` | Optional auth | Query params (`cursor`, `limit`) |
| `PATCH` | `/api/comments/{commentId}` | Required (`session_id`) | `EditCommentRequest` (JSON) |
| `DELETE` | `/api/comments/{commentId}` | Required (`session_id`) | Path param (`commentId`) |
| `POST` | `/api/comments/{commentId}/like` | Required (`session_id`) | Path param (`commentId`) |
| `DELETE` | `/api/comments/{commentId}/like` | Required (`session_id`) | Path param (`commentId`) |
| `GET` | `/api/users/{userId}/comments` | Required (`session_id`) | Query params (`cursor`, `limit`) |

## DTOs

### CreateCommentRequest

```json
{
	"content": "Nice post!",
	"image_path": "./uploads/comments/image.jpg"
}
```

Notes:
- `content` is required.
- You can send JSON body or `multipart/form-data`.
- For `multipart/form-data`, use `image_path` as uploaded file.

Image upload rules (`image_path` as file):
- Allowed types: `image/jpeg`, `image/png`, `image/gif`
- Max size: `20MB`

### EditCommentRequest

```json
{
	"content": "Updated comment text"
}
```

### CommentResponse

```json
{
	"id": "uuid",
	"post_id": "uuid",
	"user_id": "uuid",
	"content": "Nice post!",
	"image_path": "",
	"total_likes": 2,
	"is_edited": false,
	"created_at": "2026-04-02T10:00:00Z",
	"nickname": "john_doe",
	"avatar_path": "./uploads/avatars/john.jpg"
}
```

### GetCommentsResponse

```json
{
	"comments": [
		{
			"id": "uuid",
			"post_id": "uuid",
			"user_id": "uuid",
			"content": "Nice post!",
			"image_path": "",
			"total_likes": 2,
			"is_edited": false,
			"created_at": "2026-04-02T10:00:00Z",
			"nickname": "john_doe",
			"avatar_path": "./uploads/avatars/john.jpg"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### CommentActionResponse

```json
{
	"comment_id": "uuid",
	"action": "created"
}
```

Possible `action` values by endpoint:
- `created`
- `edited`
- `deleted`
- `liked`
- `unliked`

## Detailed Endpoints + Examples

### 1) Create Comment

- Method: `POST`
- Endpoint: `/api/posts/{postId}/comments`
- Auth: Required
- Content-Type: `application/json` or `multipart/form-data`

Example JSON request:

```bash
curl -X POST "http://localhost:8433/api/posts/p-001/comments" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"content": "Nice post!"
	}'
```

Example multipart request:

```bash
curl -X POST "http://localhost:8433/api/posts/p-001/comments" \
	--cookie "session_id=<your_session_id>" \
	-F "content=Nice post!" \
	-F "image_path=@C:/images/comment.png"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comment_id": "c-001",
		"action": "created"
	},
	"message": "Comment created successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Missing postId parameter",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "content is required",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "post not found or access denied",
	"code": 400
}
```

### 2) Get Comments For Post

- Method: `GET`
- Endpoint: `/api/posts/{postId}/comments`
- Auth: Optional
- Query params: `cursor`, `limit`

Example request:

```bash
curl "http://localhost:8433/api/posts/p-001/comments?limit=20"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comments": [
			{
				"id": "c-001",
				"post_id": "p-001",
				"user_id": "u-001",
				"content": "Nice post!",
				"image_path": "",
				"total_likes": 2,
				"is_edited": false,
				"created_at": "2026-04-02T10:00:00Z",
				"nickname": "john_doe",
				"avatar_path": "./uploads/avatars/john.jpg"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Comments retrieved successfully"
}
```

### 3) Edit Comment

- Method: `PATCH`
- Endpoint: `/api/comments/{commentId}`
- Auth: Required
- Content-Type: `application/json`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/comments/c-001" \
	-H "Content-Type: application/json" \
	--cookie "session_id=<your_session_id>" \
	-d '{
		"content": "Updated comment text"
	}'
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comment_id": "c-001",
		"action": "edited"
	},
	"message": "Comment updated successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "you can only edit your own comments",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "comment not found",
	"code": 400
}
```

### 4) Delete Comment

- Method: `DELETE`
- Endpoint: `/api/comments/{commentId}`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/comments/c-001" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comment_id": "c-001",
		"action": "deleted"
	},
	"message": "Comment deleted successfully"
}
```

### 5) Like Comment

- Method: `POST`
- Endpoint: `/api/comments/{commentId}/like`
- Auth: Required

Example request:

```bash
curl -X POST "http://localhost:8433/api/comments/c-001/like" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comment_id": "c-001",
		"action": "liked"
	},
	"message": "Comment liked successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "comment already liked",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "comment not found or access denied",
	"code": 400
}
```

### 6) Unlike Comment

- Method: `DELETE`
- Endpoint: `/api/comments/{commentId}/like`
- Auth: Required

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/comments/c-001/like" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comment_id": "c-001",
		"action": "unliked"
	},
	"message": "Comment unliked successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "comment is not liked",
	"code": 400
}
```

### 7) Get User Comments

- Method: `GET`
- Endpoint: `/api/users/{userId}/comments`
- Auth: Required
- Query params: `cursor`, `limit`

Example request:

```bash
curl "http://localhost:8433/api/users/u-001/comments?limit=20" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"comments": [],
		"next_cursor": "",
		"limit": 20
	},
	"message": "User comments retrieved successfully"
}
```

## Notes

- Comment content rules: required and max 1000 characters.
- Listing endpoints use cursor pagination with `cursor` and `limit`.
- `limit` must be between `1` and `100`.
- Visibility/access checks for comments and likes follow the same post-access rules used by post privacy (`public`, `almost_private`, `private`) and block constraints.