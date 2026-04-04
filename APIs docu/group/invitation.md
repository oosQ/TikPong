# Group Invitation API

Endpoints for sending, canceling, listing, and responding to group invitations.

**Base URL:** `http://localhost:8433`

**Authentication:** All endpoints require a valid `session_id` cookie.

---

## Response Envelope

**Success**
```json
{
  "success": true,
  "data": { "...": "..." },
  "message": "..."
}
```

**Error**
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
| `POST` | `/api/groups/{groupId}/invitations/{userId}` | Required | Invite a user to a group |
| `DELETE` | `/api/groups/{groupId}/invitations/{userId}` | Required | Cancel a pending invitation |
| `GET` | `/api/sent-invitations` | Required | List invitations you sent |
| `GET` | `/api/received-invitations` | Required | List invitations you received |
| `POST` | `/api/groups/{groupId}/invitations/me/accept` | Required | Accept your invitation to a group |
| `POST` | `/api/groups/{groupId}/invitations/me/reject` | Required | Reject your invitation to a group |

---

## DTOs

### `SentInvitationResponse`
```json
{
  "id": "groupId:inviteeId",
  "group_id": "uuid",
  "group_title": "Hiking Club",
  "group_avatar": "/uploads/avatars/group.jpg",
  "invitee_id": "uuid",
  "invitee_nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "created_at": "2026-04-02T09:00:00Z"
}
```

### `ListSentInvitationsResponse`
```json
{
  "invitations": [ { "...": "SentInvitationResponse" } ],
  "next_cursor": "groupId:inviteeId",
  "limit": 20
}
```

### `ReceivedInvitationResponse`
```json
{
  "id": "groupId:inviteeId",
  "group_id": "uuid",
  "group_title": "Hiking Club",
  "group_avatar": "/uploads/avatars/group.jpg",
  "inviter_id": "uuid",
  "inviter_nickname": "sara",
  "avatar_path": "/uploads/avatars/sara.jpg",
  "created_at": "2026-04-02T09:00:00Z"
}
```

### `ListReceivedInvitationsResponse`
```json
{
  "invitations": [ { "...": "ReceivedInvitationResponse" } ],
  "next_cursor": "groupId:inviteeId",
  "limit": 20
}
```

`next_cursor` is omitted when there is no next page.

---

## Endpoints

### POST `/api/groups/{groupId}/invitations/{userId}`
Send (or refresh) a group invitation for a user.

**Auth:** Required

**Path Params**
| Param | Type | Description |
|---|---|---|
| `groupId` | string | Group UUID |
| `userId` | string | Invitee user UUID |

**Rules**
- Invitee cannot be the inviter.
- Group must exist.
- Inviter must be a member of the group.
- Invitee must not already be a group member.
- Existing invitation for `(group_id, invitee_id)` is upserted back to `pending`.

**curl**
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/invitations/<userId>"
```

**Success `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Invitation sent successfully"
}
```

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Missing required path params |
| `400` | invitee id is required |
| `400` | cannot invite yourself |
| `400` | group not found |
| `400` | only group members can invite users |
| `400` | user is already a member |

Side effect:
- Triggers notification dispatch to invitee with type `group_invitation`.

---

### DELETE `/api/groups/{groupId}/invitations/{userId}`
Cancel a pending invitation sent by the authenticated inviter.

**Auth:** Required

**Path Params**
| Param | Type | Description |
|---|---|---|
| `groupId` | string | Group UUID |
| `userId` | string | Invitee user UUID |

**curl**
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/invitations/<userId>"
```

**Success `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Invitation cancelled successfully"
}
```

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Missing required path params |
| `400` | pending invitation not found |

---

### GET `/api/sent-invitations`
List your pending invitations sent to other users.

**Auth:** Required

**Query Params**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | string | No | `""` | Cursor in form `groupId:inviteeId` |
| `limit` | int | No | `20` | Page size (1 to 100) |

**curl**
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/sent-invitations?limit=20"
```

**Success `200`**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "group-1:user-2",
        "group_id": "group-1",
        "group_title": "Hiking Club",
        "group_avatar": "/uploads/avatars/group.jpg",
        "invitee_id": "user-2",
        "invitee_nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "created_at": "2026-04-02T09:00:00Z"
      }
    ],
    "next_cursor": "group-1:user-2",
    "limit": 20
  },
  "message": "Sent invitations retrieved successfully"
}
```

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Invalid limit parameter |
| `500` | Internal server error message |

---

### GET `/api/received-invitations`
List your pending invitations received from other users.

**Auth:** Required

**Query Params**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `cursor` | string | No | `""` | Cursor in form `groupId:inviteeId` |
| `limit` | int | No | `20` | Page size (1 to 100) |

**curl**
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/received-invitations?limit=20"
```

**Success `200`**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "group-1:user-2",
        "group_id": "group-1",
        "group_title": "Hiking Club",
        "group_avatar": "/uploads/avatars/group.jpg",
        "inviter_id": "user-9",
        "inviter_nickname": "sara",
        "avatar_path": "/uploads/avatars/sara.jpg",
        "created_at": "2026-04-02T09:00:00Z"
      }
    ],
    "next_cursor": "group-1:user-2",
    "limit": 20
  },
  "message": "Sent invitations retrieved successfully"
}
```

Note:
- The current handler returns message text `Sent invitations retrieved successfully` for received list as well.

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Invalid limit parameter |
| `500` | Internal server error message |

---

### POST `/api/groups/{groupId}/invitations/me/accept`
Accept your own pending invitation to a group.

**Auth:** Required

**Path Params**
| Param | Type | Description |
|---|---|---|
| `groupId` | string | Group UUID |

**curl**
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/invitations/me/accept"
```

**Success `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Invitation response recorded"
}
```

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Missing groupId parameter |
| `400` | pending invitation not found |

Side effect:
- On accept, user is inserted into `group_members` as role `member` (`INSERT OR IGNORE`).

---

### POST `/api/groups/{groupId}/invitations/me/reject`
Reject your own pending invitation to a group.

**Auth:** Required

**Path Params**
| Param | Type | Description |
|---|---|---|
| `groupId` | string | Group UUID |

**curl**
```bash
curl -b "session_id=<token>" \
  -X POST \
  "http://localhost:8433/api/groups/<groupId>/invitations/me/reject"
```

**Success `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Invitation response recorded"
}
```

**Common Errors**
| Status | Message |
|---|---|
| `401` | Unauthorized |
| `400` | Missing groupId parameter |
| `400` | pending invitation not found |

---

## Notes

- Invitation status lifecycle used here: `pending`, then `accepted` or `rejected`.
- Cancel operation only removes rows with status `pending` and matching inviter.
- List endpoints only return `pending` invitations.
- Cursor pagination for list endpoints is ordered by `created_at DESC` with tie-breakers; cursor value is the composite ID `group_id:invitee_id`.
