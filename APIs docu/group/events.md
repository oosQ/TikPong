# Group Events API

Endpoints for creating group events, listing events, canceling events, and managing attendance responses.

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
| POST | /api/groups/{groupId}/events | Required | Create a group event |
| GET | /api/groups/{groupId}/events | Required | List group events |
| DELETE | /api/groups/{groupId}/events/{eventId} | Required | Cancel an event (creator only) |
| POST | /api/groups/{groupId}/events/{eventId}/response | Required | Save my response for an event |
| GET | /api/groups/{groupId}/events/{eventId}/response | Required | List responses for an event |

---

## DTOs

### CreateEventRequest
```json
{
  "title": "Team Meetup",
  "description": "Monthly planning",
  "event_time": "2026-05-10"
}
```

Notes:
- event_time must be in YYYY-MM-DD format.

### EventAnswerRequest
```json
{
  "response": "going"
}
```

Allowed values:
- going
- not_going

### EventResponse
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "creator_id": "uuid",
  "title": "Team Meetup",
  "description": "Monthly planning",
  "event_time": "2026-05-10T00:00:00Z",
  "created_at": "2026-04-02T10:00:00Z"
}
```

### ListEventsResponse
```json
{
  "events": [
    {
      "id": "uuid",
      "group_id": "uuid",
      "creator_id": "uuid",
      "title": "Team Meetup",
      "description": "Monthly planning",
      "event_time": "2026-05-10T00:00:00Z",
      "created_at": "2026-04-02T10:00:00Z"
    }
  ],
  "next_cursor": "event_id",
  "limit": 20
}
```

### EventAnswerResponse
```json
{
  "user_id": "uuid",
  "nickname": "alex",
  "avatar_path": "/uploads/avatars/alex.jpg",
  "response": "going"
}
```

### ListEventResponsesResponse
```json
{
  "responses": [
    {
      "user_id": "uuid",
      "nickname": "alex",
      "avatar_path": "/uploads/avatars/alex.jpg",
      "response": "going"
    }
  ],
  "next_cursor": "user_id",
  "limit": 20
}
```

next_cursor is omitted when there are no more rows.

---

## Endpoints

### POST /api/groups/{groupId}/events
Create a new event in a group.

Auth: Required
Access: Only group members can create events.
Content-Type: application/json

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Request Body
```json
{
  "title": "Team Meetup",
  "description": "Monthly planning",
  "event_time": "2026-05-10"
}
```

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"title":"Team Meetup","description":"Monthly planning","event_time":"2026-05-10"}' \
  "http://localhost:8433/api/groups/<groupId>/events"
```

Success 200
```json
{
  "success": true,
  "data": {
    "event_id": "a1b2c3d4-..."
  },
  "message": "Event created successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | Invalid request body |
| 400 | title, description and event_time are required |
| 400 | only group members can create events |
| 400 | event_time must be in YYYY-MM-DD format |
| 400 | failed to generate event id |

Side Effect
- Sends notifications to all other group members with type group_event.

---

### GET /api/groups/{groupId}/events
List upcoming events for a group.

Auth: Required
Access: Only group members can view events.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | Event ID cursor |
| limit | int | No | 20 | Results per page, range 1 to 100 |

Ordering and Pagination
- Ordered by event_time ASC, then id ASC.
- Cursor points to the last returned event ID.

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/events?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-1",
        "group_id": "group-1",
        "creator_id": "user-9",
        "title": "Team Meetup",
        "description": "Monthly planning",
        "event_time": "2026-05-10T00:00:00Z",
        "created_at": "2026-04-02T10:00:00Z"
      }
    ],
    "next_cursor": "event-1",
    "limit": 20
  },
  "message": "Group events retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing groupId parameter |
| 400 | only group members can view events |
| 400 | Invalid limit parameter |

---

### DELETE /api/groups/{groupId}/events/{eventId}
Cancel and remove an event.

Auth: Required
Access: Only the event creator can cancel it.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| eventId | string | Event UUID |

curl
```bash
curl -b "session_id=<token>" \
  -X DELETE \
  "http://localhost:8433/api/groups/<groupId>/events/<eventId>"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Event cancelled successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | event not found in group |
| 400 | only event creator can cancel event |

---

### POST /api/groups/{groupId}/events/{eventId}/response
Create or update your response for an event.

Auth: Required
Access: Only group members can answer events.
Content-Type: application/json

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| eventId | string | Event UUID |

Request Body
```json
{
  "response": "going"
}
```

Allowed values:
- going
- not_going

curl
```bash
curl -b "session_id=<token>" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"response":"going"}' \
  "http://localhost:8433/api/groups/<groupId>/events/<eventId>/response"
```

Success 200
```json
{
  "success": true,
  "data": null,
  "message": "Event response saved"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | Invalid request body |
| 400 | response must be going or not_going |
| 400 | only group members can answer events |
| 400 | event not found in group |

Behavior
- Upserts by event_id and user_id, so each user has one current response per event.

---

### GET /api/groups/{groupId}/events/{eventId}/response
List member responses for a specific event.

Auth: Required
Access: Only group members can view responses.

Path Parameters
| Param | Type | Description |
|---|---|---|
| groupId | string | Group UUID |
| eventId | string | Event UUID |

Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| cursor | string | No | "" | User ID cursor |
| limit | int | No | 20 | Results per page, range 1 to 100 |

Ordering and Pagination
- Ordered by user_id ASC.
- Cursor points to the last returned user ID.

curl
```bash
curl -b "session_id=<token>" \
  "http://localhost:8433/api/groups/<groupId>/events/<eventId>/response?limit=20"
```

Success 200
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "user_id": "user-2",
        "nickname": "alex",
        "avatar_path": "/uploads/avatars/alex.jpg",
        "response": "going"
      }
    ],
    "next_cursor": "user-2",
    "limit": 20
  },
  "message": "Event responses retrieved successfully"
}
```

Common Errors
| Status | Message |
|---|---|
| 401 | Unauthorized |
| 400 | Missing required path params |
| 400 | Invalid limit parameter |
| 500 | only group members can view event responses |
| 500 | event not found in group |
| 500 | Internal server error message |

Implementation Note
- Current handler maps service errors to status 500 for this endpoint.

---

## Notes

- Event date input is date-only (YYYY-MM-DD) and stored as a time value.
- Creating an event notifies group members except the creator.
- Cancel checks both event-group relation and creator ownership.
- Response values are restricted to going and not_going.
- Event and response list endpoints both use cursor-based pagination.
