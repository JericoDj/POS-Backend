# Subscription Routes Postman Examples

Base URL: `http://localhost:5001/api/subscription`

**Global Header:** `Authorization: Bearer <ID_TOKEN>`

## 1. Create Checkout Session
**Method:** `POST`
**URL:** `/create-checkout`
**Body:**
```json
{
  "planId": "starter", 
  "businessId": "BUSINESS_ID_HERE"
}
```
*Note: `planId` can be `starter`, `growth`, or `pro`.*

## 2. Cancel Subscription
**Method:** `POST`
**URL:** `/cancel-subscription`
**Body:**
```json
{
  "businessId": "BUSINESS_ID_HERE"
}
```

## 3. Webhook (Test - Usually called by Polar)
**Method:** `POST`
**URL:** `/webhook`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "type": "order.paid",
  "data": {
    "id": "ORDER_ID",
    "metadata": {
       "transactionId": "TRANSACTION_ID_FROM_DB"
    },
    "customer_id": "CUST_123",
    "subscription_id": "SUB_123",
    "product_id": "PROD_123"
  }
}
```
