# Sales Routes Postman Examples

**Base URL:** `{{base_url}}/api/sales`
**Authorization:** Bearer Token

**Headers:**
- `Content-Type`: `application/json`
- `X-Business-Id`: `YOUR_BUSINESS_ID` (Optional: Use to switch context if you have multiple businesses.)

## 1. Create Sale (Record Transaction)
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
  "items": [
    { 
        "productId": "PRODUCT_ID_1", 
        "productName": "Item Name",
        "quantity": 1, 
        "price": 999.99 
    }
  ],
  "totalAmount": 1099.97,
  "paymentMethod": "cash", // "cash", "card", "qr_code"
  "businessId": "OPTIONAL_OVERRIDE_ID" 
}
```
**Note:** `businessId` is automatically taken from the `X-Business-Id` header or your login context. You can optionally pass it in the body to be explicit.

## 2. Get Sales History
**Method:** `GET`
**URL:** `/`
**Query Params (Optional):**
- `?businessId=YOUR_BUSINESS_ID` (Override header context)
- `?startDate=YYYY-MM-DD`
- `?endDate=YYYY-MM-DD`
**Note:** Returns sales history associated with the authenticated user's business.

## 3. Get Sale by ID
**Method:** `GET`
**URL:** `/:id`
**Note:** Fetches a specific sale. Enforces business ownership.

## 4. Update Sale
**Method:** `PUT`
**URL:** `/:id`
**Body:**
```json
{
  "status": "refunded",
  "paymentMethod": "card"
}
```
**Note:** Updates sale metadata.

## 5. Delete Sale
**Method:** `DELETE`
**URL:** `/:id`
**Note:** Permanently removes a sale record.
