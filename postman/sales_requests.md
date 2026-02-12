# Sales Routes Postman Examples

Base URL: `http://localhost:5001/api/sales`

**Global Header:** `Authorization: Bearer <ID_TOKEN>`

## 1. Create Sale (Record Transaction)
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
  "items": [
    { "productId": "PRODUCT_ID_1", "quantity": 1, "price": 999.99 },
    { "productId": "PRODUCT_ID_2", "quantity": 2, "price": 49.99 }
  ],
  "totalAmount": 1099.97,
  "paymentMethod": "cash" // or "card", "qr_code"
}
```

## 2. Get Sales History
**Method:** `GET`
**URL:** `/`

## 3. Get Sale by ID
**Method:** `GET`
**URL:** `/:id`
