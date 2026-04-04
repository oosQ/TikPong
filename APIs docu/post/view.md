# Post View APIs

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
| `POST` | `/api/posts/{postId}/view` | Required (`session_id`) | Path param (`postId`) |

## DTOs

### PostViewActionResponse

```json
{
	"post_id": "uuid",
	"action": "viewed"
}
```

## Detailed Endpoints + Examples

### 1) Create Post View

- Method: `POST`
- Endpoint: `/api/posts/{postId}/view`
- Auth: Required
- Path param: `postId`

Example request:

```bash
curl -X POST "http://localhost:8433/api/posts/p-001/view" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"post_id": "p-001",
		"action": "viewed"
	},
	"message": "Post viewed successfully"
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
	"error": "post already viewed by this user",
	"code": 400
}
```

## Notes

- View creation is per-user per-post (duplicate views by the same user are rejected).
- Creating a view increments `posts_summary.total_views` for that post.
- A view can only be created if the user can access the post.
- Access rules used by this endpoint:
  - `public`: anyone authenticated can view
  - `almost_private`: follower of post owner or owner
  - `private`: owner or user in `post_viewers`
  - blocked relationships in either direction deny access