# Category Routes Postman Examples

Base URL: `http://localhost:5001/api/categories`

**Global Header:** `Authorization: Bearer <ID_TOKEN>`

## 1. Create Category
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
  "name": "Electronics",
  "description": "Gadgets and devices",
  "color": "#FF5733"
}
```

## 2. Get All Categories
**Method:** `GET`
**URL:** `/`

## 3. Get Category by ID
**Method:** `GET`
**URL:** `/:id`

## 4. Update Category
**Method:** `PUT`
**URL:** `/:id`
**Body:**
```json
{
  "name": "Electronics & Gadgets",
  "color": "#C70039"
}
```

## 5. Delete Category
**Method:** `DELETE`
**URL:** `/:id`

## 6. Bulk Delete Categories
**Method:** `DELETE`
**URL:** `/bulk-delete`
**Body:**
```json
{
  "ids": ["CATEGORY_ID_1", "CATEGORY_ID_2"]
}
```
