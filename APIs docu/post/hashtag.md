# Post Hashtag APIs

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
| `GET` | `/api/hashtags` | Public | Query params (`cursor`, `limit`) |
| `GET` | `/api/hashtags/{hashtagId}/posts` | Optional auth | Path param (`hashtagId`) + query params (`cursor`, `limit`) |

## DTOs

### HashtagResponse

```json
{
	"id": "uuid",
	"name": "golang"
}
```

### GetAllHashtagsResponse

```json
{
	"hashtags": [
		{
			"id": "uuid",
			"name": "golang"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### PostSummaryResponse

```json
{
	"id": "uuid",
	"title": "Post title",
	"content": "Post content",
	"user_id": "uuid",
	"privacy": "public",
	"image_path": "./uploads/posts/image.jpg",
	"created_at": "2026-04-02T10:00:00Z"
}
```

### GetPostsByHashtagResponse

```json
{
	"posts": [
		{
			"id": "uuid",
			"title": "Post title",
			"content": "Post content",
			"user_id": "uuid",
			"privacy": "public",
			"image_path": "./uploads/posts/image.jpg",
			"created_at": "2026-04-02T10:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

## Detailed Endpoints + Examples

### 1) Get All Hashtags

- Method: `GET`
- Endpoint: `/api/hashtags`
- Auth: Public
- Query params:
  - `cursor` (optional): pagination cursor (hashtag id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/hashtags?limit=20"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"hashtags": [
			{
				"id": "h-001",
				"name": "golang"
			},
			{
				"id": "h-002",
				"name": "webdev"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Hashtags retrieved successfully"
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

### 2) Get Posts By Hashtag

- Method: `GET`
- Endpoint: `/api/hashtags/{hashtagId}/posts`
- Auth: Optional
- Path param: `hashtagId`
- Query params:
  - `cursor` (optional): pagination cursor (post id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/hashtags/h-001/posts?limit=20"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"posts": [
			{
				"id": "p-001",
				"title": "Learning Go",
				"content": "Some content",
				"user_id": "u-001",
				"privacy": "public",
				"image_path": "",
				"created_at": "2026-04-02T10:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Posts retrieved successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Missing hashtagId parameter",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "hashtag not found",
	"code": 400
}
```

## Notes

- `GET /api/hashtags` is public.
- `GET /api/hashtags/{hashtagId}/posts` supports optional auth and applies post visibility rules.
- Post visibility for hashtag feed uses:
  - `public` for everyone
  - `almost_private` for followers and owner
  - `private` for owner and users in `post_viewers`
- Posts are filtered out when users block each other (either direction).
- Pagination for both endpoints uses `cursor` and `limit`.