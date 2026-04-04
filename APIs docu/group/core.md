# Group Core API

Endpoints for creating, browsing, viewing, updating, and deleting groups.

**Base URL:** `http://localhost:8433`

**Authentication:** All endpoints require a valid `session_id` cookie.

---

## Response Envelope

**Success**
```json
{
  "success": true,
  "data": { ... },
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

| Method   | Endpoint                  | Auth     | Description              |
|----------|---------------------------|----------|--------------------------|
| `GET`    | `/api/groups`             | Required | Browse all groups        |
| `POST`   | `/api/groups`             | Required | Create a group           |
| `GET`    | `/api/groups/{groupId}`   | Required | Get group details        |
| `PUT`    | `/api/groups/{groupId}`   | Required | Update a group           |
| `DELETE` | `/api/groups/{groupId}`   | Required | Delete a group           |

---

## DTOs

### `CreateGroupRequest` (`multipart/form-data`)
| Field          | Type   | Required | Description                  |
|----------------|--------|----------|------------------------------|
| `title`        | string | Yes      | Group title                  |
| `description`  | string | Yes      | Group description            |
| `group_avatar` | file   | No       | Avatar image file (upload)   |

### `UpdateGroupRequest` (`application/json`)
| Field          | Type   | Required | Description                          |
|----------------|--------|----------|--------------------------------------|
| `title`        | string | Yes      | Updated group title                  |
| `description`  | string | Yes      | Updated group description            |
| `group_avatar` | string | No       | Updated avatar path (omitempty)      |

### `GroupResponse`
```json
{
  "id": "uuid",
  "title": "My Group",
  "description": "A description of my group",
  "group_avatar": "/uploads/avatars/group.jpg",
  "creator_id": "uuid",
  "created_at": "2026-04-02T10:00:00Z"
}
```

### `BrowseGroupsResponse`
```json
{
  "groups": [ { ...GroupResponse } ],
  "next_cursor": "uuid",
  "limit": 20
}
```
`next_cursor` is omitted when there are no more pages.

### `GetGroupDetailsResponse`
```json
{
  "id": "uuid",
  "title": "My Group",
  "description": "A description of my group",
  "group_avatar": "/uploads/avatars/group.jpg",
  "creator_id": "uuid",
  "creator_nickname": "john_doe",
  "creator_avatar_path": "/uploads/avatars/john.jpg",
  "member_count": 42,
  "created_at": "2026-04-02T10:00:00Z"
}
```

---

## Endpoints

---

### GET `/api/groups` — Browse Groups

Returns a paginated list of all groups ordered by `created_at DESC`.

**Auth:** Required

**Query Parameters**
| Param    | Type   | Required | Default | Description          |
|----------|--------|----------|---------|----------------------|
| `cursor` | string | No       | `""`    | Pagination cursor (last group ID) |
| `limit`  | int    | No       | `20`    | Results per page (1–100)         |

**curl**
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups?limit=20"
```

**Success Response `200`**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "a1b2c3d4-...",
        "title": "Photography Lovers",
        "description": "Share your best shots",
        "group_avatar": "/uploads/avatars/photo-group.jpg",
        "creator_id": "u1u2u3u4-...",
        "created_at": "2026-04-01T12:00:00Z"
      }
    ],
    "next_cursor": "a1b2c3d4-...",
    "limit": 20
  },
  "message": "Groups retrieved successfully"
}
```

**Common Errors**
| Status | Message                  | Cause                        |
|--------|--------------------------|------------------------------|
| `401`  | Unauthorized             | Missing or invalid session   |
| `400`  | Invalid limit parameter  | Limit out of range 1–100     |

---

### POST `/api/groups` — Create Group

Creates a new group. The creator is automatically added as a member with role `creator`.

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields**
| Field         | Type   | Required | Description                     |
|---------------|--------|----------|---------------------------------|
| `title`       | string | Yes      | Group title (non-empty)         |
| `description` | string | Yes      | Group description (non-empty)   |
| `avatar`      | file   | No       | Group avatar image              |

**curl**
```bash
curl -b "session_id=<token>" \
  -X POST \
  -F "title=Photography Lovers" \
  -F "description=Share your best shots" \
  -F "avatar=@/path/to/image.jpg" \
  "http://localhost:8433/api/groups"
```

**Success Response `200`**
```json
{
  "success": true,
  "data": {
    "group_id": "a1b2c3d4-e5f6-..."
  },
  "message": "Group created successfully"
}
```

**Common Errors**
| Status | Message                           | Cause                               |
|--------|-----------------------------------|-------------------------------------|
| `401`  | Unauthorized                      | Missing or invalid session          |
| `400`  | title and description are required | Either field is blank              |
| `400`  | (image upload error)              | Invalid or unsupported image format |

---

### GET `/api/groups/{groupId}` — Get Group Details

Returns extended details for a single group including creator info and member count.

**Auth:** Required  
**Access:** Only current members of the group can view its details.

**Path Parameters**
| Param     | Type   | Description |
|-----------|--------|-------------|
| `groupId` | string | Group UUID  |

**curl**
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/a1b2c3d4-e5f6-..."
```

**Success Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-...",
    "title": "Photography Lovers",
    "description": "Share your best shots",
    "group_avatar": "/uploads/avatars/photo-group.jpg",
    "creator_id": "u1u2u3u4-...",
    "creator_nickname": "john_doe",
    "creator_avatar_path": "/uploads/avatars/john.jpg",
    "member_count": 42,
    "created_at": "2026-04-01T12:00:00Z"
  },
  "message": "Group details retrieved successfully"
}
```

**Common Errors**
| Status | Message                                | Cause                               |
|--------|----------------------------------------|-------------------------------------|
| `401`  | Unauthorized                           | Missing or invalid session          |
| `400`  | Missing required path param: groupId   | Path param absent                   |
| `400`  | only group members can view group details | Requester is not a member         |

---

### PUT `/api/groups/{groupId}` — Update Group

Updates the title, description, and/or avatar of a group.

**Auth:** Required  
**Access:** Only the group **owner (creator)** can update the group.  
**Content-Type:** `application/json`

**Path Parameters**
| Param     | Type   | Description |
|-----------|--------|-------------|
| `groupId` | string | Group UUID  |

**Request Body**
```json
{
  "title": "Updated Group Name",
  "description": "Updated description"
}
```

**curl**
```bash
curl -b "session_id=<token>" \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Name","description":"Updated description"}' \
  "http://localhost:8433/api/groups/a1b2c3d4-e5f6-..."
```

**Success Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Group updated successfully"
}
```

**Common Errors**
| Status | Message                               | Cause                              |
|--------|---------------------------------------|------------------------------------|
| `401`  | Unauthorized                          | Missing or invalid session         |
| `400`  | Missing groupId parameter             | Path param absent                  |
| `400`  | only group owner can update the group | Requester is not the creator       |
| `400`  | title and description are required    | Either field is blank after update |
| `400`  | Invalid request body                  | Malformed JSON                     |

---

### DELETE `/api/groups/{groupId}` — Delete Group

Permanently deletes the group and all its data.

**Auth:** Required  
**Access:** Only the group **owner (creator)** can delete the group.

**Path Parameters**
| Param     | Type   | Description |
|-----------|--------|-------------|
| `groupId` | string | Group UUID  |

**curl**
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/a1b2c3d4-e5f6-..."
```

**Success Response `200`**
```json
{
  "success": true,
  "data": null,
  "message": "Group deleted successfully"
}
```

**Common Errors**
| Status | Message                               | Cause                        |
|--------|---------------------------------------|------------------------------|
| `401`  | Unauthorized                          | Missing or invalid session   |
| `400`  | Missing required path param: groupId  | Path param absent            |
| `400`  | only group owner can delete the group | Requester is not the creator |

---

## Notes

- **Creator auto-membership:** On `POST /api/groups`, the creator is automatically inserted into `group_members` with `role = 'creator'` in the same transaction.
- **Member-only details:** `GET /api/groups/{groupId}` is restricted to current members — non-members (including unauthenticated users) receive a `400` error.
- **Browse is open to all authenticated users:** `GET /api/groups` returns all groups without any membership restriction.
- **Owner-only mutations:** Both `PUT` and `DELETE` require the requester to be the creator (checked via `shared.IsGroupOwner`).
- **Update requires both fields:** `title` and `description` are mandatory even in update requests — partial updates (only one field) are not supported.
- **Pagination:** `GET /api/groups` uses cursor-based pagination ordered by `created_at DESC, id DESC`. Pass the last returned `id` as `cursor` for the next page. `next_cursor` is omitted when the last page is reached.
- **Avatar upload:** Group avatar is uploaded as a file in `multipart/form-data` on creation. Update currently accepts a string path (`group_avatar`) in the JSON body.
