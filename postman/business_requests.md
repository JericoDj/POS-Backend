# Business Routes Postman Examples

Base URL: `http://localhost:5001/api/business`

**Global Header:** `Authorization: Bearer <ID_TOKEN>`

## 1. Create Business
**Method:** `POST`
**URL:** `/`
**Body:**
```json
{
  "name": "My Awesome Store",
  "address": "123 Main St",
  "contact": "555-0199",
  "type": "Retail"
}
```
**Note:** This creates the business and automatically promotes the creating user to "owner" of that business. **You must refresh the ID token on the client side after this request to pick up the new `owner` role and `businessId` claims.**

## 2. Get Business Profile (My Business)
**Method:** `GET`
**URL:** `/profile`
**Note:** Fetches the business associated with the logged-in user. Useful for the dashboard.

## 3. Get All Businesses
**Method:** `GET`
**URL:** `/`
**Note:** Returns a list of all businesses (Admin/Directory).

## 4. Get Business By ID
**Method:** `GET`
**URL:** `/:id` 
*Replace `:id` with actual Business ID (e.g., `FGXtVM6bzgeZC5FXa9Nf`)*

## 5. Update Business
**Method:** `PUT`
**URL:** `/:id`
**Body:**
```json
{
  "name": "My Awesome Store (Updated)",
  "contact": "555-1234",
  "settings": {
      "currency": "EUR",
      "timezone": "CET"
  }
}
```
**Note:** Only the **Owner** of the business can update it. The `:id` must match the user's `businessId`.

## 6. Delete Business
**Method:** `DELETE`
**URL:** `/:id`
**Note:** Only the **Owner** can delete the business. This action deletes the business document and resets the user's role to `user` (removing the `businessId` association).
