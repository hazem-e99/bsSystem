# Notification Endpoints Documentation

## Overview
This document describes the notification endpoints available in the bus system API for managing user notifications.

## Base URL
```
http://localhost:3001
```

## Available Endpoints

### 1. Get All Notifications
```
GET /notifications
```
Returns all notifications in the system.

### 2. Get Notifications by User
```
GET /notifications?userId={userId}
```
Returns all notifications for a specific user.

### 3. Get Unread Notifications by User
```
GET /notifications?userId={userId}&read=false
```
Returns only unread notifications for a specific user.

### 4. Get Notification by ID
```
GET /notifications/{id}
```
Returns a specific notification by its ID.

### 5. Mark Notification as Read
```
PATCH /notifications/{id}
Body: { "read": true }
```
Marks a specific notification as read.

### 6. Mark All Notifications as Read for User
```
POST /notifications-bulk/mark-read
Body: { "userId": "user-id", "action": "mark-all-read" }
```
Marks all notifications for a specific user as read by updating each notification individually.

### 7. Clear Read Notifications for User
```
POST /notifications-bulk/clear-read
Body: { "userId": "user-id", "action": "clear-read" }
```
Removes all read notifications for a specific user by deleting each notification individually.

### 8. Create New Notification
```
POST /notifications
Body: {
  "userId": "user-id",
  "message": "Notification message",
  "type": "info|success|warning|error",
  "actionUrl": "/dashboard/route"
}
```
Creates a new notification.

## Usage Examples

### JavaScript/TypeScript
```typescript
import { notificationAPI } from '@/lib/api';

// Mark all notifications as read
await notificationAPI.markAllAsRead('user-123');

// Clear all read notifications
await notificationAPI.clearReadNotifications('user-123');

// Get unread notifications count
const unreadNotifications = await notificationAPI.getUnreadByUser('user-123');
const unreadCount = unreadNotifications.length;
```

### cURL Examples

#### Mark all notifications as read
```bash
curl -X POST "http://localhost:3001/notifications-bulk/mark-read" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "action": "mark-all-read"}'
```

#### Clear read notifications
```bash
curl -X POST "http://localhost:3001/notifications-bulk/clear-read" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "action": "clear-read"}'
```

#### Get unread notifications
```bash
curl "http://localhost:3001/notifications?userId=user-123&read=false"
```

## Frontend Integration

The notification system is integrated into the Topbar component with the following features:

1. **Notification Badge**: Shows the count of unread notifications
2. **Mark All Read**: Button to mark all notifications as read
3. **Clear Read**: Button to remove all read notifications
4. **Real-time Updates**: Local state updates immediately after API calls

## Database Schema

Notifications are stored with the following structure:
```json
{
  "id": "notif-1",
  "userId": "user-123",
  "message": "Your bus is running 5 minutes late today",
  "type": "warning",
  "date": "2024-01-20T08:05:00Z",
  "read": false,
  "actionUrl": "/dashboard/student"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Notes

- The `clearReadNotifications` endpoint permanently removes read notifications by deleting each one individually
- The `markAllAsRead` endpoint updates all notifications for a user by updating each one individually
- These operations work with json-server by making individual requests for each notification
- Unread notifications are preserved when using these endpoints
- The notification badge automatically updates based on the unread count
- All bulk operations return success status and count of affected items
