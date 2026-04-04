# Post Like APIs

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
| `POST` | `/api/posts/{postId}/like` | Required (`session_id`) | Path param (`postId`) |
| `DELETE` | `/api/posts/{postId}/like` | Required (`session_id`) | Path param (`postId`) |

## DTOs

### PostLikeActionResponse

```json
{
	"post_id": "uuid",
	"action": "liked"
}
```

Possible `action` values:
- `liked`
- `unliked`

## Detailed Endpoints + Examples

### 1) Like Post

- Method: `POST`
- Endpoint: `/api/posts/{postId}/like`
- Auth: Required
- Path param: `postId`

Example request:

```bash
curl -X POST "http://localhost:8433/api/posts/p-001/like" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"post_id": "p-001",
		"action": "liked"
	},
	"message": "Post liked successfully"
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
	"error": "post not found or access denied",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "post already liked",
	"code": 400
}
```

### 2) Unlike Post

- Method: `DELETE`
- Endpoint: `/api/posts/{postId}/like`
- Auth: Required
- Path param: `postId`

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/posts/p-001/like" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"post_id": "p-001",
		"action": "unliked"
	},
	"message": "Post unliked successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "post not found or access denied",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "post is not liked",
	"code": 400
}
```

## Notes

- Both endpoints require authentication.
- A user can like a given post only once.
- Like/unlike operations update `posts_summary.total_likes` for the post.
- Access checks for these endpoints follow post visibility rules (`public`, `almost_private`, `private`) and block constraints.