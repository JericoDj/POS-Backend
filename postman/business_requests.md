# Business Requests

## General

### Create Business
**URL**: `{{baseUrl}}/api/businesses`
**Method**: `POST`
**Auth**: Bearer Token required
**Body**:
```json
{
    "name": "My Coffee Shop",
    "address": "123 Main St",
    "contact": "555-0123",
    "type": "retail"
}
```

### Get All Businesses (Profile)
Returns all businesses associated with the authenticated user.
**URL**: `{{baseUrl}}/api/businesses` (or `/api/businesses/profile`, aliases to same logic)
**Method**: `GET`
**Auth**: Bearer Token required

### Get Business by ID
**URL**: `{{baseUrl}}/api/businesses/:id`
**Method**: `GET`
**Auth**: Bearer Token required

### Update Business
**URL**: `{{baseUrl}}/api/businesses/:id`
**Method**: `PUT`
**Auth**: Bearer Token required
**Body** (JSON):
```json
{
    "name": "Updated Shop Name",
    "settings": {
        "currency": "PHP"
    }
}
```

### Delete Business
**URL**: `{{baseUrl}}/api/businesses/:id`
**Method**: `DELETE`
**Auth**: Bearer Token required

---

## Subscription

### Update Subscription (Subscribe/Unsubscribe)
Directly update the subscription status and details for a business. Used by the mobile app after a successful In-App Purchase or cancellation.

**URL**: `{{baseUrl}}/api/businesses/:id/subscription`
**Method**: `POST`
**Auth**: Bearer Token required

#### Subscribe (Activate)
**Body** (JSON):
```json
{
  "status": "active",
  "planId": "pro",
  "provider": "apple_store", // or 'google_play'
  "productId": "com.myapp.pro.monthly",
  "startDate": 1708300000000,
  "expiresAt": 1710978400000
}
```

#### Unsubscribe (Cancel)
**Body** (JSON):
```json
{
  "status": "canceled",
  "planId": "pro", // optional, keeps record of what was canceled
  "canceledAt": 1708305000000
}
```

**Response** (200 OK):
```json
{
  "message": "Subscription updated successfully"
}
```
