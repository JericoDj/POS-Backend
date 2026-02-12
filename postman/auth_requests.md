# Auth Routes Postman Examples

Base URL: `http://localhost:5001/api/auth`

**Global Header (for protected routes):** `Authorization: Bearer <ID_TOKEN>`

## 1. Register User
**Method:** `POST`
**URL:** `/register`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "displayName": "Test User",
  "role": "staff",
  "businessId": "BUSINESS_ID_IF_KNOWN" 
}
```
*Note: `role` defaults to 'staff' if not provided. `businessId` is optional.*

## 2. Login
**Method:** `POST`
**URL:** `/login`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Response Note:** Copy the `idToken` from the response. You will need it for the `Authorization` header.

## 3. Forgot Password
**Method:** `POST`
**URL:** `/forgot-password`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "email": "test@example.com"
}
```

## 4. Get Current User (Protected)
**Method:** `GET`
**URL:** `/me`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <ID_TOKEN>`

## 5. Update User Profile (Protected)
**Method:** `PUT`
**URL:** `/update`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <ID_TOKEN>`
**Body:**
```json
{
  "displayName": "Updated Name",
  "phoneNumber": "+15555555555",
  "photoURL": "https://example.com/photo.jpg"
}
```

## 6. Delete Account (Protected)
**Method:** `DELETE`
**URL:** `/delete`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <ID_TOKEN>`\
```




