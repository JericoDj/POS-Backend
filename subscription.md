# Implementing Native Mobile Subscriptions (Apple & Google) with Backend Sync

This guide explains how to implement In-App Purchases (IAP) for your Flutter app using the official `in_app_purchase` package and verify receipts directly with Apple and Google servers from your Node.js backend.

## 🏗️ Architecture

1.  **Mobile App (Flutter)**: Uses `in_app_purchase` package to initiate purchases and get receipts.
2.  **This Backend**:
    *   Receives the **receipt data** (iOS) or **purchase token** (Android) from the app.
    *   Verifies the purchase directly with **Apple App Store Server API** or **Google Play Developer API**.
    *   Updates the user's subscription status in Firestore.
    *   Listens for **Server-to-Server Notifications** (Webhooks) from Apple/Google to handle renewals/cancellations.

---

## 📱 Step 1: Flutter Implementation

### 1. Install Plugin
Add `in_app_purchase` to your `pubspec.yaml`:
```yaml
dependencies:
  in_app_purchase: ^3.2.0
  in_app_purchase_android: ^0.3.5
  in_app_purchase_storekit: ^0.3.16
```

### 2. Purchase Logic
Create a `SubscriptionService` class to handle the purchase flow.

```dart
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_android/in_app_purchase_android.dart';
import 'package:in_app_purchase_storekit/in_app_purchase_storekit.dart';
import 'dart:async';
import 'dart:io';

class SubscriptionService {
  final InAppPurchase _iap = InAppPurchase.instance;
  late StreamSubscription<List<PurchaseDetails>> _subscription;

  // Initialize and listen to purchase updates
  void initialize() {
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen((purchaseDetailsList) {
      _listenToPurchaseUpdated(purchaseDetailsList);
    }, onDone: () {
      _subscription.cancel();
    }, onError: (error) {
      // Handle error
    });
  }

  // Handle updates
  void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) {
    purchaseDetailsList.forEach((PurchaseDetails purchaseDetails) async {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        // Show pending UI
      } else {
        if (purchaseDetails.status == PurchaseStatus.error) {
          // Handle error
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
            purchaseDetails.status == PurchaseStatus.restored) {
          
          // Verify with your backend
          bool valid = await _verifyPurchase(purchaseDetails);
          if (valid) {
            // Unlock content locally if desired, but rely on backend sync
          }
        }
        
        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      }
    });
  }

  // Call your Node.js backend to verify
  Future<bool> _verifyPurchase(PurchaseDetails purchaseDetails) async {
    // Send this data to your backend:
    // verificationData.serverVerificationData contains:
    // - iOS: The receipt string (base64)
    // - Android: The purchase token
    
    final response = await http.post(
      Uri.parse('https://your-api.com/api/subscriptions/verify'),
      body: {
        'source': Platform.isIOS ? 'app_store' : 'google_play',
        'productId': purchaseDetails.productID,
        'verificationData': purchaseDetails.verificationData.serverVerificationData,
        'localVerificationData': purchaseDetails.verificationData.localVerificationData, // Android needs this too sometimes for signature
      }
    );
    
    return response.statusCode == 200;
  }

  // Start Purchase Flow
  void buyProduct(ProductDetails product) {
    final PurchaseParam purchaseParam = PurchaseParam(productDetails: product);
    _iap.buyNonConsumable(purchaseParam: purchaseParam); // For subscriptions
  }
}
```

---

## 🖥️ Step 2: Backend Verification (Node.js)

You need to verify the receipt with Apple/Google. Using libraries makes this easier.

**Dependencies:**
`npm install node-apple-receipt-verify googleapis`

### 1. iOS Verification (App Store Server API)

```javascript
/* src/utils/appleVerify.js */
const appleReceiptVerify = require('node-apple-receipt-verify'); // Or fetch directly from Apple API

// Configure (Shared Secret from App Store Connect)
appleReceiptVerify.config({
  secret: process.env.APPLE_SHARED_SECRET,
  environment: ['production', 'sandbox']
});

const verifyApple = async (receiptData) => {
  try {
    const products = await appleReceiptVerify.validate({
      receipt: receiptData
    });
    // Check latest receipt info for expiration date
    return products;
  } catch (e) {
    throw e;
  }
};
```

### 2. Android Verification (Google Play Developer API)

You need a **Service Account JSON**key from Google Cloud Console linked to your Play Console.

```javascript
/* src/utils/googleVerify.js */
const { google } = require('googleapis');
const key = require('../../service-account.json'); // Your Google Auth JSON

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const androidPublisher = google.androidpublisher('v3');

const verifyGoogle = async (packageName, insuranceId, token) => {
  const authClient = await auth.getClient();
  google.options({ auth: authClient });

  const res = await androidPublisher.purchases.subscriptions.get({
    packageName: packageName,
    subscriptionId: insuranceId, // product ID
    token: token,
  });
  
  return res.data; // contains expiryTimeMillis, paymentState
};
```

### 3. Verification Endpoint

```javascript
/* src/controllers/subscriptionController.js */

const verifySubscription = async (req, res) => {
  const { source, productId, verificationData } = req.body;
  const uid = req.user.uid; // From auth middleware

  try {
    let isValid = false;
    let expiryDate = null;

    if (source === 'app_store') {
       const result = await verifyApple(verificationData); 
       // Parse result to check if subscription is active
       // Update isValid and expiryDate
    } else if (source === 'google_play') {
       const result = await verifyGoogle('com.your.app', productId, verificationData);
       // Parse result
    }

    if (isValid) {
      // Update Firestore
      await db.collection('businesses').doc(req.user.businessId).update({
         'subscription.status': 'active',
         'subscription.planId': mapProductIdToPlan(productId),
         'subscription.expiresAt': expiryDate
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid receipt' });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🔔 Step 3: Handling Renewals (Server Notifications)

Apps don't always run when a subscription renews. You MUST set up **Server-to-Server Notifications** in App Store Connect and Google Play Console.

### 1. Apple Notifications (V2)
Apple sends JSON payloads to your webhook URL.
*   **Events**: `SUBSCRIBED`, `DID_RENEW`, `EXPIRED`, `DID_FAIL_TO_RENEW`.
*   **Action**: Decode the JWS payload, extract `transactionId` and `originalTransactionId`, find the user in your DB (you saved `originalTransactionId` during initial purchase, right?), and update their status.

### 2. Google Real-Time Developer Notifications (RTDN)
Google sends messages to a **Cloud Pub/Sub** topic.
*   **Events**: `SUBSCRIPTION_PURCHASED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELED`.
*   **Action**: Create a backend listener for the Pub/Sub topic. When a message arrives, use the `purchaseToken` inside to call the Google API (Step 2.2) and get the latest status.

---

## ⚠️ Comparison: Native vs RevenueCat

| Feature | Native Implementation | RevenueCat |
| :--- | :--- | :--- |
| **Effort** | **High**. You maintain receipt validation logic, server notifications, and API updates. | **Low**. 10 lines of code. |
| **Backend** | You must build validation for Apple & Google (2 separate APIs). | Unified webhook for both. |
| **Edge Cases** | You handle grace periods, upgrades, cross-grades, refunds. | Handled automatically. |
| **Cost** | Free (your own dev time). | Free up to $2.5k/mo revenue (then 1%). |

**Recommendation:** Unless you have a specific reason to avoid RevenueCat (e.g., data privacy, enterprise policy), **native implementation is significantly more complex and prone to bugs**. If you proceed with native, allocate 2-3 weeks for robust testing of all renewal/cancellation scenarios.
