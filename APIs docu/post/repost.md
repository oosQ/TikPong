# Post Repost API

## Repost a post

- **Method:** `POST`
- **Endpoint:** `/api/posts/{postId}/repost`
- **Auth required:** Yes

### Success response

```json
{
  "success": true,
  "message": "Post reposted successfully",
  "data": {
    "post_id": "post-uuid",
    "action": "reposted"
  }
}
```

### Error cases

- `401 Unauthorized` if the user is not logged in
- `400 Bad Request` if `postId` is missing
- `400 Bad Request` if the post does not exist or cannot be accessed
- `400 Bad Request` if the post is already reposted by the current user

## Cancel repost

- **Method:** `DELETE`
- **Endpoint:** `/api/posts/{postId}/repost`
- **Auth required:** Yes

### Success response

```json
{
  "success": true,
  "message": "Post repost canceled successfully",
  "data": {
    "post_id": "post-uuid",
    "action": "repost_canceled"
  }
}
```

### Error cases

- `401 Unauthorized` if the user is not logged in
- `400 Bad Request` if `postId` is missing
- `400 Bad Request` if the post does not exist or cannot be accessed
- `400 Bad Request` if the post has not been reposted by the current user

## Get a user's reposted posts

- **Method:** `GET`
- **Endpoint:** `/api/users/{userId}/reposts?limit=50&cursor={postId}`
- **Auth required:** No

This endpoint is used by the profile Reposts tab. It returns the posts a user has reposted, ordered by repost time descending.

### Success response

```json
{
  "success": true,
  "message": "User reposted posts retrieved successfully",
  "data": {
    "posts": [
      {
        "id": "post-uuid",
        "user_id": "author-uuid",
        "nickname": "Hussain",
        "is_liked": 0,
        "is_reposted": 1,
        "total_likes": 12,
        "total_comments": 4,
        "total_views": 87,
        "total_reposts": 3
      }
    ],
    "next_cursor": "next-post-uuid",
    "limit": 50
  }
}
```

### Error cases

- `400 Bad Request` if `userId` is missing
- `500 Internal Server Error` if the reposted posts cannot be loaded