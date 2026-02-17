# Category Routes Postman Examples
    
   **Base URL:** `{{base_url}}/api/categories`
**Authorization:** Bearer Token (JWT from Login)

**Headers:**
- `Content-Type`: `application/json`
- `X-Business-Id`: `YOUR_BUSINESS_ID` (Optional: Use to switch context if you have multiple businesses. Defaults to your primary business if omitted.)
    
    ## 1. Create Category
    **Method:** `POST`
    **URL:** `/`
    **Body:**
    ```json
    {
        "name": "Beverages",
        "description": "Drinks and Refreshments",
        "color": "#FF5733",
        "businessId": "OPTIONAL_BUSINESS_ID_OVERRIDE" 
    }
    ```
    
    ## 2. Get All Categories
    **Method:** `GET`
    **URL:** `/`
    **Query Params (Optional):**
    - `?businessId=YOUR_BUSINESS_ID` (Override header context)
    **Note:** Returns all categories associated with the authenticated user's business (or specific business if param provided).
    
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
