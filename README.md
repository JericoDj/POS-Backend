# POS Application Backend

A robust Node.js/Express backend for a Point of Sale (POS) system, integrated with Firebase for data & auth, and Polar.sh for subscription management.

## 🚀 Features

*   **Authentication**: Secure user registration and login using Firebase Auth.
*   **Role-Based Access Control (RBAC)**: Custom claims for `owner`, `admin`, and `user` roles.
*   **Business Management**: Multi-tenancy support allowing users to create and manage their own businesses.
*   **Inventory Management**:
    *   **Categories**: Organize products.
    *   **Products**: Track stock, price, and details.
    *   **Subscription Limits**: Enforces product/category limits based on the active plan.
*   **Sales Processing**: Records sales and automatically deducts inventory stock.
*   **Subscription System (Polar.sh)**:
    *   Checkout Link integration for seamless payments.
    *   Webhook handling for real-time subscription status updates (`active`, `canceled`, `past_due`).
    *   Automatic plan downgrades/upgrades.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: Firebase Firestore (NoSQL)
*   **Authentication**: Firebase Admin SDK
*   **Storage**: Firebase Storage (for images)
*   **Payments**: Polar.sh SDK & Checkout Links

## 📋 Prerequisites

*   Node.js (v18 or higher)
*   Firebase Project (Firestore, Auth, Storage enabled)
*   Polar.sh Merchant Account

## ⚙️ Setup & Installation

1.  **Clone the repository** (if applicable) and navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Firebase Service Account**:
    *   Go to **Firebase Console > Project Settings > Service Accounts**.
    *   Click **Generate new private key**.
    *   Rename the downloaded file to `serviceAccountKey.json`.
    *   Place it in the root of the `backend` directory.
    *   *Important: Never commit this file to version control.*

4.  **Environment Variables**:
    Create a `.env` file in the root directory with the following keys:

    ```env
    PORT=5001
    FIREBASE_WEB_API_KEY=your_firebase_web_api_key_here
    POLAR_ACCESS_TOKEN=your_polar_access_token_here
    POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
    ```

## 🏃‍♂️ Running the Server

*   **Development** (with hot-reload):
    ```bash
    npm run dev
    ```
*   **Production**:
    ```bash
    npm start
    ```

## 📚 API Documentation

### Authentication (`/api/auth`)
*   `POST /register`: Create a new user account.
*   `POST /login`: Authenticate and receive `idToken`.

### Business (`/api/business`)
*   `POST /`: Create a new business (Assigns `owner` role to user).
*   `GET /`: Get all businesses (Admin/Directory).
*   `GET /profile`: Get the logged-in user's business profile.
*   `GET /:id`: Get business details by ID.
*   `PUT /:id`: Update business details (Owner only).
*   `DELETE /:id`: Delete business (Owner only).

### Inventory (`/api`)
*   **Categories** (`/api/categories`):
    *   `GET /`: List all categories.
    *   `POST /`: Create category (Checks Plan Limit).
    *   `PUT /:id`: Update category.
    *   `DELETE /bulk-delete`: Delete multiple categories.
    *   `DELETE /:id`: Delete single category.

*   **Products** (`/api/products`):
    *   `GET /`: List all products (Optional `?categoryId` filter).
    *   `POST /`: Create product (Checks Plan Limit).
    *   `PUT /:id`: Update product (Stock, Price, etc.).
    *   `DELETE /bulk-delete`: Delete multiple products.
    *   `DELETE /:id`: Delete single product.

### Sales (`/api/sales`)
*   `POST /`: Create a new sale record.
    *   *Effect*: Automatically reduces stock count for sold items.
    *   *Validation*: Checks if sufficient stock exists.

### Subscriptions (`/api/subscription`)
*   `POST /create-checkout`: Generate a Polar Checkout Link for a specific plan.
    *   **Body**: `{ "planId": "starter", "businessId": "..." }`
    *   **Returns**: `{ "checkoutUrl": "..." }`
*   `POST /cancel-subscription`: Cancel the active subscription.
*   `POST /webhook`: Handle Polar events (`order.paid`, `subscription.active`, etc.).

## 💎 Subscription Plans

The backend enforces the following limits based on the active plan:

| Feature | Basic (Free) | Starter | Pro | Plus |
| :--- | :--- | :--- | :--- | :--- |
| **Products** | 50 | 50 | 50 | Unlimited |
| **Categories** | 10 | 10 | 10 | Unlimited |
| **Reports** | No | Basic | Advanced | Advanced |
| **AI Insights** | No | No | Yes | Yes |

*Refer to `src/utils/subscriptionPlans.js` for the exact configuration.*

## 🔒 Security & Permissions

*   **VerifyToken Middleware**: Validates Firebase ID Tokens on protected routes.
*   **Ownership Checks**: Ensuring users can only modify/delete their own business data.
*   **Subscription Middleware**: Intercepts `POST` requests to `products` and `categories` to enforce quota limits.
