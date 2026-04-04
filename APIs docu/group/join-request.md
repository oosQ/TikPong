# Group Join Request API

Endpoints for creating, canceling, listing, and responding to group join requests.

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
| GET | /api/sent-join-requests | Required | List join requests created by current user |
| POST | /api/groups/{groupId}/join-requests | Required | Request to join a group |
| GET | /api/groups/{groupId}/join-requests | Required | List pending join requests for a group (creator only) |
| DELETE | /api/groups/{groupId}/join-requests | Required | Cancel own pending join request |
| POST | /api/groups/{groupId}/join-requests/{userId}/accept | Required | Accept a requester (creator only) |
| POST | /api/groups/{groupId}/join-requests/{userId}/reject | Required | Reject a requester (creator only) |

---

## DTOs

### JoinRequestResponse
```json
{
  "id": "groupId:requesterId",
  "group_id": "uuid",
  "group_title": "Hiking Club",
  "group_avatar": "/uploads/avatars/group.jpg",
  "requester_id": "uuid",
  "requester_nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "created_at": "2026-04-02T09:00:00Z"
}
```

### ListJoinRequestsResponse
```json
{
  "requests": [
    {
      "id": "groupId:requesterId",
      "group_id": "uuid",
      "group_title": "Hiking Club",
      "group_avatar": "/uploads/avatars/group.jpg",
      "requester_id": "uuid",
      "requester_nickname": "alex",
      "avatar_path": "/uploads/avatars/alex.jpg",
      "created_at": "2026-04-02T09:00:00Z"
    }
  ],
  "next_cursor": "groupId:requesterId",
  "limit": 20
}
```

### SentJoinRequestResponse
```json
{
  "id": "groupId:requesterId",
  "group_id": "uuid",
  "group_title": "Hiking Club",
  "group_avatar": "/uploads/avatars/group.jpg",
  "group_creator_id": "uuid",
  "group_creator_name": "sara",
  "group_creator_avatar": "/uploads/avatars/sara.jpg",
  "status": "pending",
  "created_at": "2026-04-02T09:00:00Z",
  "updated_at": "2026-04-02T09:00:00Z"
}
```

### ListSentJoinRequestsResponse
```json
{
  "requests": [
    {
      "id": "groupId:requesterId",
      "group_id": "uuid",
      "group_title": "Hiking Club",
      "group_avatar": "/uploads/avatars/group.jpg",
      "group_creator_id": "uuid",
      "group_creator_name": "sara",
      "group_creator_avatar": "/uploads/avatars/sara.jpg",
      "status": "pending",
      "created_at": "2026-04-02T09:00:00Z",
      "updated_at": "2026-04-02T09:00:00Z"
    }
  ],
  "next_cursor": "groupId:requesterId",
  "limit": 20
}
```

next_cursor is omitted when no more rows are available.

---

## Endpoints

### GET /api/sent-join-requests
Returns join requests made by the authenticated user.

Auth: Required

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Cursor in format groupId:requesterId |
| limit | int | No | 20 | Items per page, range 1 to 100 |

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/sent-join-requests?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "group-1:user-2",
        "group_id": "group-1",
        "group_title": "Hiking Club",
        "group_avatar": "/uploads/avatars/group.jpg",
        "group_creator_id": "user-9",
        "group_creator_name": "sara",
        "group_creator_avatar": "/uploads/avatars/sara.jpg",
        "status": "pending",
        "created_at": "2026-04-02T09:00:00Z",
        "updated_at": "2026-04-02T09:00:00Z"
      }
    ],
    "next_cursor": "group-1:user-2",
    "limit": 20
  },
  "message": "Sent join requests retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Invalid limit parameter |
| 500 | Internal server error message |

---

### POST /api/groups/{groupId}/join-requests
Creates or refreshes a join request for the authenticated user.

Auth: Required

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Rules
- Group must exist.
- User must not already be a group member.
- If pending request already exists, request is rejected.
- Existing non-pending row is upserted back to pending.

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/join-requests"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Join request sent"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | group not found |
| 400 | already a group member |
| 400 | join request already pending |

Side effect
- If creator ID is available, a notification is dispatched with type group_join_request.

---

### GET /api/groups/{groupId}/join-requests
Lists pending requests for a group.

Auth: Required
Access: Only group creator can view this list.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Cursor in format groupId:requesterId |
| limit | int | No | 20 | Items per page, range 1 to 100 |

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/join-requests?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "group-1:user-2",
        "group_id": "group-1",
        "group_title": "Hiking Club",
        "group_avatar": "/uploads/avatars/group.jpg",
        "requester_id": "user-2",
        "requester_nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "created_at": "2026-04-02T09:00:00Z"
      }
    ],
    "next_cursor": "group-1:user-2",
    "limit": 20
  },
  "message": "Join requests retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | Invalid limit parameter |
| 500 | only group creator can list join requests |
| 500 | Internal server error message |

Implementation note
- The service returns permission errors, but current handler maps them to status 500.

---

### DELETE /api/groups/{groupId}/join-requests
Cancels the authenticated user's own pending join request.

Auth: Required

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/join-requests"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Join request cancelled"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | pending join request not found |

---

### POST /api/groups/{groupId}/join-requests/{userId}/accept
Accepts a user's pending join request.

Auth: Required
Access: Only group creator can respond.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| userId | string | Requester user UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/join-requests/<userId>/accept"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Join request response recorded"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | only group creator can respond to join requests |
| 400 | pending join request not found |

Side effect
- On accept, requester is inserted into group_members with role member using INSERT OR IGNORE.

---

### POST /api/groups/{groupId}/join-requests/{userId}/reject
Rejects a user's pending join request.

Auth: Required
Access: Only group creator can respond.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| userId | string | Requester user UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/join-requests/<userId>/reject"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Join request response recorded"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | only group creator can respond to join requests |
| 400 | pending join request not found |

---

## Notes

- Join request status values used by this module are pending, accepted, rejected.
- List for group creators returns only pending requests.
- List for requester users returns all statuses tied to that requester.
- Pagination is cursor-based with created_at descending order and composite cursor ID format group_id:requester_id.
