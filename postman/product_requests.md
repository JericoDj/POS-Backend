# Product Routes Postman Examples

Base URL: `http://localhost:5001/api/products`

**Global Header:** `Authorization: Bearer <ID_TOKEN>`

## 1. Create Product
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
  "name": "Smartphone X",
  "price": 999.99,
  "stock": 50,
  "categoryId": "CATEGORY_ID_HERE",
  "details": "Latest model with AI features"
}
```
**Notes:** 
- Requires `name` and `price`.
- **Subscription Limit:** This endpoint checks if the business has reached its product limit based on the subscription plan. If limit reached, returns `403`.

## 2. Get All Products
**Method:** `GET`
**URL:** `/`
**Query Params (Optional):**
- `?categoryId=CATEGORY_ID_HERE` (Filter by category)
**Note:** Returns products ordered by `createdAt` desc.

## 3. Get Product by ID
**Method:** `GET`
**URL:** `/:id`

## 4. Update Product
**Method:** `PUT`
**URL:** `/:id`
**Body:**
```json
{
  "price": 899.99,
  "stock": 45,
  "details": "Updated description"
}
```
**Note:** Only products belonging to the user's business can be updated.

## 5. Bulk Delete Products
**Method:** `DELETE`
**URL:** `/bulk-delete`
**Body:**
```json
{
  "ids": ["PRODUCT_ID_1", "PRODUCT_ID_2", "PRODUCT_ID_3"]
}
```
**Note:** Deletes multiple products by ID. Returns success count.

## 6. Delete Product (Single)
**Method:** `DELETE`
**URL:** `/:id`
