# Group Post API

Endpoints for group posts, post comments, and post likes.

Base URL: http://localhost:8433

Authentication: All endpoints require a valid session_id cookie.

---

## Response Envelope

Success
```json
{
  "success": true,
  "data": { "...": "..." },
  "message": "..."
}
```

Error
```json
{
  "success": false,
  "error": "...",
  "code": 400
}
```

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/groups/{groupId}/posts | Required | Create a group post |
| GET | /api/groups/{groupId}/posts | Required | List group posts |
| POST | /api/groups/{groupId}/posts/{postId}/comments | Required | Create a comment on group post |
| GET | /api/groups/{groupId}/posts/{postId}/comments | Required | List comments for group post |
| POST | /api/groups/{groupId}/posts/{postId}/like | Required | Like a group post |
| DELETE | /api/groups/{groupId}/posts/{postId}/like | Required | Remove like from group post |

---

## DTOs

### CreateGroupPostRequest
Supports JSON or multipart form.

JSON:
```json
{
  "title": "Welcome Post",
  "content": "Hello group members!",
  "image_path": "/uploads/posts/photo.jpg"
}
```

Multipart fields:
- title (required)
- content (required)
- image file upload is handled by server helper

### GroupPostResponse
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "user_id": "uuid",
  "title": "Welcome Post",
  "content": "Hello group members!",
  "image_path": "/uploads/posts/photo.jpg",
  "nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "created_at": "2026-04-02T10:00:00Z"
}
```

### ListGroupPostsResponse
```json
{
  "posts": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "user_id": "uuid",
      "title": "Welcome Post",
      "content": "Hello group members!",
      "image_path": "/uploads/posts/photo.jpg",
      "nickname": "alex",
      "avatar_path": "/uploads/avatars/alex.jpg",
      "created_at": "2026-04-02T10:00:00Z"
    }
  ],
  "next_cursor": "post_id",
  "limit": 20
}
```

### CreateGroupCommentRequest
Supports JSON or multipart form.

JSON:
```json
{
  "content": "Nice post!",
  "image_path": "/uploads/comments/comment.jpg"
}
```

Multipart fields:
- content (required)
- image file upload is handled by server helper

### GroupCommentResponse
```json
{
  "id": "uuid",
  "group_post_id": "uuid",
  "user_id": "uuid",
  "content": "Nice post!",
  "image_path": "/uploads/comments/comment.jpg",
  "nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "created_at": "2026-04-02T10:05:00Z"
}
```

### ListGroupCommentsResponse
```json
{
  "comments": [
    {
      "id": "uuid",
      "group_post_id": "uuid",
      "user_id": "uuid",
      "content": "Nice post!",
      "image_path": "/uploads/comments/comment.jpg",
      "nickname": "alex",
      "avatar_path": "/uploads/avatars/alex.jpg",
      "created_at": "2026-04-02T10:05:00Z"
    }
  ],
  "next_cursor": "comment_id",
  "limit": 20
}
```

next_cursor is omitted on the final page.

---

## Endpoints

### POST /api/groups/{groupId}/posts
Create a new post inside a group.

Auth: Required
Access: Only group members can post.
Content-Type:
- application/json
- multipart/form-data

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Validation Rules
- title and content are required.
- User must be a member of the group.

curl (JSON)
```bash
curl -b "session_id=<token>" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"Welcome Post","content":"Hello group members!"}' \
  "http://localhost:8433/api/groups/<groupId>/posts"
```

curl (multipart)
```bash
curl -b "session_id=<token>" \
  -X POST \
  -F "title=Welcome Post" \
  -F "content=Hello group members!" \
  -F "image=@/path/to/photo.jpg" \
  "http://localhost:8433/api/groups/<groupId>/posts"
```

Success 200
```json
{
  "success": true,
  "data": {
    "post_id": "a1b2c3d4-..."
  },
  "message": "Group post created successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | Invalid request body |
| 400 | title and content are required |
| 400 | only group members can post |
| 400 | failed to generate post id |
| 400 | image upload validation error |

Implementation Note
- If image upload succeeds but create fails, uploaded file is removed.

---

### GET /api/groups/{groupId}/posts
List posts in a group.

Auth: Required
Access: Only group members can view posts.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Post ID cursor |
| limit | int | No | 20 | Results per page, range 1 to 100 |

Ordering
- created_at DESC, id DESC

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/posts?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post-1",
        "group_id": "group-1",
        "user_id": "user-2",
        "title": "Welcome Post",
        "content": "Hello group members!",
        "image_path": "/uploads/posts/photo.jpg",
        "nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "created_at": "2026-04-02T10:00:00Z"
      }
    ],
    "next_cursor": "post-1",
    "limit": 20
  },
  "message": "Group posts retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | only group members can view posts |
| 400 | Invalid limit parameter |

---

### POST /api/groups/{groupId}/posts/{postId}/comments
Create a comment on a group post.

Auth: Required
Access: Only group members can comment.
Content-Type:
- application/json
- multipart/form-data

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| postId | string | Group post UUID |

Validation Rules
- content is required.
- postId must belong to groupId.

curl (JSON)
```bash
curl -b "session_id=<token>" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"content":"Nice post!"}' \
  "http://localhost:8433/api/groups/<groupId>/posts/<postId>/comments"
```

curl (multipart)
```bash
curl -b "session_id=<token>" \
  -X POST \
  -F "content=Nice post!" \
  -F "image=@/path/to/comment.jpg" \
  "http://localhost:8433/api/groups/<groupId>/posts/<postId>/comments"
```

Success 200
```json
{
  "success": true,
  "data": {
    "comment_id": "b1c2d3e4-..."
  },
  "message": "Group comment created successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | Invalid request body |
| 400 | content is required |
| 400 | only group members can comment |
| 400 | post not found in group |
| 400 | failed to generate comment id |
| 400 | image upload validation error |

Implementation Note
- If image upload succeeds but create fails, uploaded comment image is removed.

---

### GET /api/groups/{groupId}/posts/{postId}/comments
List comments for a group post.

Auth: Required
Access: Only group members can view comments.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| postId | string | Group post UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Comment ID cursor |
| limit | int | No | 20 | Results per page, range 1 to 100 |

Ordering
- created_at ASC, id ASC

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/posts/<postId>/comments?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-1",
        "group_post_id": "post-1",
        "user_id": "user-2",
        "content": "Nice post!",
        "image_path": "",
        "nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "created_at": "2026-04-02T10:05:00Z"
      }
    ],
    "next_cursor": "comment-1",
    "limit": 20
  },
  "message": "Group comments retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | only group members can view comments |
| 400 | post not found in group |
| 400 | Invalid limit parameter |

---

### POST /api/groups/{groupId}/posts/{postId}/like
Like a group post.

Auth: Required
Access: Only group members can like posts.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| postId | string | Group post UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/posts/<postId>/like"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Post liked successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | only group members can like posts |
| 400 | post not found in group |
| 400 | post already liked by user |

---

### DELETE /api/groups/{groupId}/posts/{postId}/like
Remove current user's like from a group post.

Auth: Required
Access: Only group members can unlike posts.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| postId | string | Group post UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/posts/<postId>/like"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Post like removed successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | only group members can like posts |
| 400 | post not found in group |
| 400 | post not liked by user |

---

## Notes

- All group post endpoints require group membership.
- Post and comment creation support both JSON and multipart/form-data.
- Post ownership verification for comments and likes is done by checking post-group association.
- List endpoints use cursor-based pagination with module-specific ordering:
  - Posts: newest first.
  - Comments: oldest first.
- Likes are unique per user and post.
