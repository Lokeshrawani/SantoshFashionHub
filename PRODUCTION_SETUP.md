# Santosh Fashion Hub — production launch checklist

This repository now contains a secure Firebase Cloud Functions commerce backend, Firebase Authentication customer accounts, Firestore order and inventory rules, Razorpay Checkout integration, and customer/admin tracking screens.

**Important status:** the GitHub Pages storefront can be deployed from this repository, but payment processing and server-side checkout are not live until the Firebase backend is deployed and the shop's Razorpay merchant credentials are configured. Do not advertise online payment as live before completing the checks below.

## 1. Firebase project setup

The web configuration in `firebase-config.js` points to the existing Firebase project `santosh-fashion-hub`. The browser config is public by design; it is not an Admin SDK key. Never commit a service-account private key or Razorpay secret.

In the Firebase Console:

1. Open project `santosh-fashion-hub`.
2. Set up the project's billing account on the **Blaze** plan. Cloud Functions, Secret Manager, and the scheduled payment-reservation cleanup require billing-enabled Google Cloud services.
3. In **Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, verify that `lokeshrawani.github.io` is listed. Add it if missing.
5. Create/confirm the Cloud Firestore database in the production region used by the project.
6. Check the email verification template and sender details so customers can verify their email addresses.

## 2. Deploy Firestore security rules, indexes and Cloud Functions

Install Node.js 22 and the Firebase CLI, then run these commands from the repository root on a computer authenticated to the shop's Google/Firebase account:

```bash
npm install --global firebase-tools
firebase login
firebase use santosh-fashion-hub
npm install --prefix functions
npm --prefix functions run check
firebase deploy --only firestore:rules,firestore:indexes
```

The order rules intentionally block all browser-side order creation and modification. Only the trusted Cloud Functions Admin SDK can create or update order records. Customers can read only their own orders; the authorised admin can read the shop's orders.

## 3. Configure Razorpay securely

Create and activate a Razorpay merchant account for Santosh Fashion Hub. Complete the business/KYC and bank settlement requirements in the Razorpay Dashboard.

Use Razorpay **Test Mode** first. Create a test API Key ID and Key Secret, then set them in Firebase Secret Manager:

```bash
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
```

Enter the value only at the secure CLI prompt. Do not paste keys in chat, source code, GitHub commits, issue comments, or browser JavaScript.

Deploy the backend:

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes
```

After deployment, copy the HTTPS URL printed for the `razorpayWebhook` function. In Razorpay Dashboard → Webhooks, add that exact URL and subscribe to:

- `payment.captured`
- `payment.failed`

Use the same webhook secret you stored as `RAZORPAY_WEBHOOK_SECRET`. Keep automatic payment capture enabled in Razorpay; the backend confirms an online order only after the payment API reports `captured` and the server verifies the amount, currency, order and signature.

For launch, replace test API keys with **Live Mode** credentials using the same Firebase Secret Manager commands, then redeploy the functions that use those secrets. Perform one low-value real transaction and verify the captured payment and webhook before announcing online checkout.

## 4. Configure shipping

The backend currently defaults to a shipping fee of ₹0. Do not treat this as a promise of free shipping. Configure the shop's real shipping policy before accepting online payment.

To use a flat fee, create a local `.env.santosh-fashion-hub` file in the repository root (it is ignored by Git) with:

```ini
SFH_SHIPPING_FEE_INR=60
```

Replace `60` with the shop's actual fee and redeploy Cloud Functions. A PIN-code/weight-based shipping quote would require a shipping provider API integration; that is not enabled yet.

## 5. Set up products and live inventory

1. Open `https://lokeshrawani.github.io/SantoshFashionHub/admin.html` and sign in with the authorised shop admin account `santoshrawani123@gmail.com`.
2. Add/edit the real catalogue: SKU, title, category, actual selling price, MRP, sizes, product photos and physical stock.
3. Open **Business Manager** from the Admin Portal.
4. For each product, re-check the actual selling price and physical stock, enter global stock or stock by size (format: `S:3, M:5, L:2`), tick **I verified actual price & stock**, then tick **Enable online sale** and save.
5. Products are blocked from paid checkout until the admin has explicitly enabled them and the price approval matches the current selling price. A price edit through the older product editor invalidates this approval until re-approved in Business Manager.

The existing starter catalogue contains sample/demo prices. Do not approve any sample value as a real price. The new backend rejects items that are not approved, even if a browser changes the cart price or quantity.

## 6. Customer orders and tracking

- Customers create an email/password account in **My Account** and verify their email address before checkout.
- **My Orders & Tracking** lists only the signed-in customer's server-stored orders.
- The admin updates status from **Business Manager** and can enter courier, tracking number, secure tracking URL, expected delivery and a customer note.
- Courier tracking is currently **manual**: the shop must paste the courier details into the admin screen. Automatic carrier updates require a courier API/account and have not been connected.
- COD orders reserve/deduct stock immediately. Online orders hold stock for up to 20 minutes while payment is pending; failed, dismissed or expired payments release the reservation once.
- Cancelled paid orders are flagged for manual refund action. This implementation does not initiate automatic refunds.

## 7. Optional automatic backend deploy from GitHub Actions

The workflow `.github/workflows/deploy-firebase-backend.yml` is included. To enable it:

1. Create a restricted Google Cloud service account for Firebase deployment with the permissions needed to deploy Cloud Functions, Firestore rules/indexes, and required Google Cloud services.
2. Add its full JSON key as a GitHub repository Actions secret named `FIREBASE_SERVICE_ACCOUNT`.
3. Run **Actions → Deploy Firebase commerce backend → Run workflow** or push a backend/rules change to `main`.

When that secret is absent the workflow skips the cloud deployment rather than exposing credentials or failing the storefront deployment. Protect the `main` branch and restrict who can edit workflow files and repository secrets.

## 8. Go-live acceptance tests

Before enabling live checkout for customers, test all of the following in Razorpay Test Mode:

- Customer can create an account, receive verification email, sign in and sign out.
- Unverified customers cannot place orders.
- A product not explicitly approved for online sale is rejected.
- An edited price cannot be charged until the admin re-approves it.
- An item cannot be purchased above available global or size-specific stock.
- Two simultaneous carts cannot oversell the last item.
- COD creates one order and decrements inventory once.
- Successful online payment verifies the server-created Razorpay order, signature, captured amount and currency.
- Failed/dismissed/expired payment releases the stock reservation once.
- Webhook retries do not duplicate order updates.
- A customer can see only their own order and its status/tracking details.
- Only the designated admin can change status or tracking.
- Paid-order cancellation flags the order for a manual refund.

The site is not production-ready for online payments until this checklist is passed with the real Firebase project and Razorpay Test Mode.
