# Santosh Fashion Hub — Online Fashion Store

Premium mobile-first fashion storefront for men's, women's and kids' clothing.

## Storefront

Live Pages site: https://lokeshrawani.github.io/SantoshFashionHub/

The storefront includes product browsing, search and category filters, quick view, cart, wishlist, customer account entry, and mobile navigation.

## Commerce architecture

- **Customer accounts:** Firebase Authentication email/password, email verification and password reset.
- **Database:** Cloud Firestore products, customer profile documents and server-side orders.
- **Inventory:** Admin-managed stock, optional size-level inventory, and transactional stock reservation/deduction.
- **Online payments:** Razorpay Standard Checkout with server-created Razorpay Orders, server-side signature and captured-payment verification, plus webhook processing.
- **Order tracking:** Customer's signed-in order history and status timeline; admin updates courier/tracking details in Business Manager.
- **Security:** Firestore rules prevent browser-side order writes; only trusted Cloud Functions can create or update orders.

## Important launch conditions

The storefront's existing starter product values are sample/demo prices. New secure checkout rejects products until the shop owner verifies the actual selling price and stock, then enables each product in Business Manager.

GitHub Pages hosts the frontend only. The Firebase Cloud Functions backend, Firestore rules/indexes, Razorpay merchant account, server secrets and webhook must be deployed/configured before real orders and online payments can be processed. Courier status is manually entered until a shipping-provider API is integrated. See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for the launch runbook.

## Admin pages

- [Product & Photo Admin](https://lokeshrawani.github.io/SantoshFashionHub/admin.html)
- [Business Manager](https://lokeshrawani.github.io/SantoshFashionHub/admin-commerce.html)
- [Customer Orders & Tracking](https://lokeshrawani.github.io/SantoshFashionHub/sfh-step13-orders.html)

Authorised shop admin email: `santoshrawani123@gmail.com`.

## Contact

WhatsApp: +91 98355 67894  
Email: santoshrawani123@gmail.com
