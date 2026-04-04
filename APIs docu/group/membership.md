# Group Membership API

Endpoints for listing group members, leaving a group, and removing a member.

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
| GET | /api/groups/{groupId}/members | Required | List group members (members only) |
| DELETE | /api/groups/{groupId}/leave | Required | Leave a group |
| DELETE | /api/groups/{groupId}/members/{userId} | Required | Remove a member (owner only) |

---

## DTOs

### GroupMemberResponse
```json
{
  "user_id": "uuid",
  "nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "role": "member"
}
```

### ListMembersResponse
```json
{
  "members": [
    {
      "user_id": "uuid",
      "nickname": "alex",
      "avatar_path": "/uploads/avatars/alex.jpg",
      "role": "member"
    }
  ],
  "next_cursor": "last_user_id",
  "limit": 20
}
```

next_cursor is omitted when there are no more rows.

---

## Endpoints

### GET /api/groups/{groupId}/members
Returns members of a group.

Auth: Required
Access: Only current members of the group can list members.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Cursor as user_id |
| limit | int | No | 20 | Results per page, range 1 to 100 |

Ordering and Pagination
- Ordered by membership creation ascending, then user_id ascending.
- Uses cursor-based pagination and returns next_cursor when another page exists.

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/members?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "user_id": "user-2",
        "nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "role": "member"
      }
    ],
    "next_cursor": "user-2",
    "limit": 20
  },
  "message": "Members retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | only group members can list members |
| 400 | Invalid limit parameter |

---

### DELETE /api/groups/{groupId}/leave
Removes the authenticated user from the group.

Auth: Required
Access: Only current members can leave.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/leave"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Left group successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path param: groupId |
| 400 | only group members can leave the group |

Side Effect
- If this leave operation makes member count zero, the group is deleted.

---

### DELETE /api/groups/{groupId}/members/{userId}
Removes a target member from the group.

Auth: Required
Access: Only group owner can remove members.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| userId | string | Target member user UUID |

Rules
- Owner cannot remove themselves.
- Target user must already be a member.

curl
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/members/<userId>"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Member removed successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 500 | only group owner can remove members |
| 500 | owner cannot remove themselves |
| 500 | user is not a member of the group |
| 500 | failed to remove member from group |

Implementation Note
- Current handler maps service and repo failures to status 500.

---

## Notes

- List endpoint is members-only, not public.
- Remove-member endpoint is owner-only.
- Leave endpoint is available to any current member.
- Removing the final member through leave triggers group deletion.
