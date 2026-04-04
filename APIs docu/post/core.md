# Post Core APIs

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
| `POST` | `/api/post` | Required (`session_id`) | `CreatePostRequest` (`multipart/form-data`) |
| `GET` | `/api/posts` | Optional auth | Query params (`cursor`, `limit`) |
| `GET` | `/api/posts/search` | Optional auth | Query params (`q`, `cursor`, `limit`) |
| `GET` | `/api/posts/{postId}` | Optional auth | Path param (`postId`) |
| `PATCH` | `/api/posts/{postId}` | Required (`session_id`) | `EditPostRequest` (`multipart/form-data`) |
| `DELETE` | `/api/posts/{postId}` | Required (`session_id`) | Path param (`postId`) |

## DTOs

### CreatePostRequest (`multipart/form-data`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | 1-255 chars |
| `content` | string | Yes | 1-2000 chars |
| `privacy` | string | Yes | `public`, `almost_private`, `private` |
| `image_path` | file or string | No | If file uploaded, use field `image_path` |
| `hashtags` | array of string | No | Max 5 hashtags, each 1-50 chars |
| `allowed_viewers` | array of string | Conditional | Required when `privacy=private` |

Image upload rules (`image_path` as file):
- Allowed types: `image/jpeg`, `image/png`, `image/gif`
- Max size: `20MB`

### EditPostRequest (`multipart/form-data`)

```json
{
	"title": "Updated title",
	"content": "Updated content",
	"privacy": "public",
	"image_path": "./uploads/posts/image.jpg",
	"hashtags": ["go", "backend"],
	"allowed_viewers": ["uuid-1", "uuid-2"]
}
```

Notes:
- Handler expects form fields, same constraints as create.
- `title`, `content`, and `privacy` must still be valid values.

### PostSummaryResponse

```json
{
	"id": "uuid",
	"user_id": "uuid",
	"title": "Post title",
	"content": "Post content",
	"privacy": "public",
	"image_path": "./uploads/posts/image.jpg",
	"total_likes": 4,
	"total_views": 20,
	"total_comments": 3,
	"is_edited": false,
	"created_at": "2026-04-02T10:00:00Z"
}
```

### GetPostsResponse / SearchPostsResponse

```json
{
	"posts": [
		{
			"id": "uuid",
			"user_id": "uuid",
			"title": "Post title",
			"content": "Post content",
			"privacy": "public",
			"image_path": "./uploads/posts/image.jpg",
			"total_likes": 4,
			"total_views": 20,
			"total_comments": 3,
			"is_edited": false,
			"created_at": "2026-04-02T10:00:00Z"
		}
	],
	"next_cursor": "uuid",
	"limit": 20
}
```

### PostDetailResponse

```json
{
	"id": "uuid",
	"user_id": "uuid",
	"title": "Post title",
	"content": "Post content",
	"privacy": "private",
	"image_path": "./uploads/posts/image.jpg",
	"total_likes": 4,
	"total_views": 20,
	"total_comments": 3,
	"is_edited": true,
	"created_at": "2026-04-02T10:00:00Z",
	"hashtags": ["go", "backend"],
	"allowed_viewers": ["uuid-1", "uuid-2"]
}
```

## Detailed Endpoints + Examples

### 1) Create Post

- Method: `POST`
- Endpoint: `/api/post`
- Auth: Required
- Content-Type: `multipart/form-data`

Example request:

```bash
curl -X POST "http://localhost:8433/api/post" \
	--cookie "session_id=<your_session_id>" \
	-F "title=My First Post" \
	-F "content=Hello from the API" \
	-F "privacy=public" \
	-F "hashtags=go" \
	-F "hashtags=backend" \
	-F "image_path=@C:/images/post.png"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"post_id": "4a251f29-0f93-4cfd-b91d-5eb0d63e3a6a"
	},
	"message": "Post created successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "Title is required and must be between 1 and 255 characters",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "Private posts must have at least one allowed viewer",
	"code": 400
}
```

### 2) Get Posts Feed

- Method: `GET`
- Endpoint: `/api/posts`
- Auth: Optional
- Query params:
  - `cursor` (optional): pagination cursor (post id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/posts?limit=20"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"posts": [
			{
				"id": "p-001",
				"user_id": "u-001",
				"title": "Post title",
				"content": "Post content",
				"privacy": "public",
				"image_path": "",
				"total_likes": 0,
				"total_views": 0,
				"total_comments": 0,
				"is_edited": false,
				"created_at": "2026-04-02T10:00:00Z"
			}
		],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Posts retrieved successfully"
}
```

### 3) Search Posts

- Method: `GET`
- Endpoint: `/api/posts/search`
- Auth: Optional
- Query params:
  - `q` (required): search text
  - `cursor` (optional): pagination cursor (post id)
  - `limit` (optional): integer between `1` and `100`, default `20`

Example request:

```bash
curl "http://localhost:8433/api/posts/search?q=hello&limit=20"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"posts": [],
		"next_cursor": "",
		"limit": 20
	},
	"message": "Posts found successfully"
}
```

Common error response:

```json
{
	"success": false,
	"error": "Missing required query parameter: q",
	"code": 400
}
```

### 4) Get Post By ID

- Method: `GET`
- Endpoint: `/api/posts/{postId}`
- Auth: Optional
- Path param: `postId`

Example request:

```bash
curl "http://localhost:8433/api/posts/p-001"
```

Example success response:

```json
{
	"success": true,
	"data": {
		"id": "p-001",
		"user_id": "u-001",
		"title": "Post title",
		"content": "Post content",
		"privacy": "public",
		"image_path": "",
		"total_likes": 0,
		"total_views": 0,
		"total_comments": 0,
		"is_edited": false,
		"created_at": "2026-04-02T10:00:00Z",
		"hashtags": ["go"],
		"allowed_viewers": []
	},
	"message": "Post retrieved successfully"
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
	"error": "post not found or you do not have permission to view it",
	"code": 400
}
```

### 5) Edit Post

- Method: `PATCH`
- Endpoint: `/api/posts/{postId}`
- Auth: Required
- Content-Type: `multipart/form-data`

Example request:

```bash
curl -X PATCH "http://localhost:8433/api/posts/p-001" \
	--cookie "session_id=<your_session_id>" \
	-F "title=Updated title" \
	-F "content=Updated content" \
	-F "privacy=private" \
	-F "allowed_viewers=u-101" \
	-F "allowed_viewers=u-102" \
	-F "hashtags=go" \
	-F "hashtags=api"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Post updated successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "you can only edit your own posts",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "post not found",
	"code": 400
}
```

### 6) Delete Post

- Method: `DELETE`
- Endpoint: `/api/posts/{postId}`
- Auth: Required
- Path param: `postId`

Example request:

```bash
curl -X DELETE "http://localhost:8433/api/posts/p-001" \
	--cookie "session_id=<your_session_id>"
```

Example success response:

```json
{
	"success": true,
	"data": null,
	"message": "Post deleted successfully"
}
```

Common error responses:

```json
{
	"success": false,
	"error": "you can only delete your own posts",
	"code": 400
}
```

```json
{
	"success": false,
	"error": "post not found",
	"code": 400
}
```

## Notes

- Optional-auth endpoints still enforce visibility rules.
- Visibility rules:
  - `public`: visible to everyone
  - `almost_private`: visible to followers and owner
  - `private`: visible only to owner and users in `post_viewers`
- If two users are blocked either way, their posts are hidden from each other.
- Pagination on listing/search uses `cursor` + `limit` and returns `next_cursor` when more rows exist.