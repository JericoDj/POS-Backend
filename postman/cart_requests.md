# Shopping Cart API Requests

Base URL: `{{URL}}/api/cart`
Auth: Bearer Token required for all requests.

## 1. Get Cart
**Method:** `GET`
**URL:** `/`
**Params:**
- `businessId` (Optional): Override the business context.
**Response:**
```json
{
    "id": "userId_businessId",
    "userId": "...",
    "businessId": "...",
    "items": [
        {
            "productId": "p1",
            "productName": "Phone",
            "price": 999,
            "quantity": 1
        }
    ]
}
```

## 2. Add to Cart
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
    "productId": "product_uid",
    "quantity": 1,
    "businessId": "optional_biz_id"
}
```
**Note:** Merges quantity if item exists.

## 3. Update Cart Item
**Method:** `PUT`
**URL:** `/:productId`
**Body:**
```json
{
    "quantity": 3
}
```

## 4. Remove Item
**Method:** `DELETE`
**URL:** `/:productId`

## 5. Clear Cart / Delete Selected
**Method:** `DELETE`
**URL:** `/`
**Body (Optional - to delete specific items):**
```json
{
    "productIds": ["p1", "p2"]
}
```
**Note:** If body is empty, clears the entire cart.
