# User Requests

## Subscription

### Update User Subscription (Subscribe/Unsubscribe)
Update the full subscription object for a user.

**URL**: `{{baseUrl}}/api/users/subscription`
**Method**: `POST`
**Auth**: Bearer Token required

#### Subscribe (or Update)
**Body** (JSON):
```json
{
  "status": "active",
  "planId": "pro",
  "provider": "apple_store",
  "productId": "com.myapp.user.pro",
  "expiresAt": 1710978400000
}
```

### Unsubscribe User
Explicitly cancels the user's subscription.

**URL**: `{{baseUrl}}/api/users/unsubscribe`
**Method**: `POST`
**Auth**: Bearer Token required

**Body**: (Empty or optional details)
```json
{}
```

**Response** (200 OK):
```json
{
  "message": "User unsubscribed successfully"
}
```

### Update User Subscription ID (Legacy)
Updates only the `subscriptionId` field.

**URL**: `{{baseUrl}}/api/users/subscription-id`
**Method**: `POST`
**Auth**: Bearer Token required

**Body** (JSON):
```json
{
  "subscriptionId": "rc_user_123"
}
```
