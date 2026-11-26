const crypto = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");

initializeApp();
const db = getFirestore();
const REGION = "asia-south1";
const ADMIN_EMAIL = "santoshrawani123@gmail.com";
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");
const SHIPPING_FEE_INR = defineString("SFH_SHIPPING_FEE_INR", { default: "0" });
const ALLOWED_STATUSES = [
  "Order received", "Confirmed", "Processing", "Packed",
  "Shipped", "Out for delivery", "Delivered", "Cancelled",
  "Awaiting payment", "Payment review required", "Payment expired",
  "Payment not completed", "Payment cancelled", "Pending"
];

function fail(code, message) { throw new HttpsError(code, message); }
function requireCustomer(request) {
  if (!request.auth) fail("unauthenticated", "Please sign in to place an order.");
  if (request.auth.token.email_verified !== true) {
    fail("failed-precondition", "Please verify your email address before checkout.");
  }
  return request.auth.uid;
}
function requireAdmin(request) {
  if (!request.auth ||
      String(request.auth.token.email || "").toLowerCase() !== ADMIN_EMAIL ||
      request.auth.token.email_verified !== true) {
    fail("permission-denied", "Only the email-verified shop administrator can perform this action.");
  }
  return request.auth.uid;
}
function text(value, max, label) {
  const result = String(value == null ? "" : value).trim();
  if (!result || result.length > max) fail("invalid-argument", label + " is required.");
  return result;
}
function phone(value) {
  const result = String(value || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(result)) fail("invalid-argument", "Enter a valid 10-digit mobile number.");
  return result;
}
function pinCode(value) {
  const result = String(value || "").trim();
  if (!/^\d{6}$/.test(result)) fail("invalid-argument", "Enter a valid 6-digit PIN code.");
  return result;
}
function moneyPaise(rupees) {
  const value = Number(rupees);
  if (!Number.isFinite(value) || value <= 0 || value > 1000000) {
    fail("failed-precondition", "A product has an invalid selling price.");
  }
  return Math.round(value * 100);
}
function shippingPaise() {
  const value = Number(SHIPPING_FEE_INR.value() || "0");
  if (!Number.isFinite(value) || value < 0 || value > 100000) {
    fail("internal", "The shop shipping fee is not configured correctly.");
  }
  return Math.round(value * 100);
}
function normaliseCart(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    fail("invalid-argument", "Your cart must contain between 1 and 20 product lines.");
  }
  const grouped = new Map();
  for (const item of items) {
    const productId = String(item && item.productId || "").trim();
    const size = String(item && item.size || "").trim();
    const quantity = Number(item && item.quantity);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(productId)) fail("invalid-argument", "A cart product ID is invalid.");
    if (!size || size.length > 24) fail("invalid-argument", "Choose a valid size for every product.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      fail("invalid-argument", "Each product quantity must be between 1 and 10.");
    }
    const key = productId + "::" + size;
    grouped.set(key, { productId, size, quantity: (grouped.get(key)?.quantity || 0) + quantity });
    if (grouped.get(key).quantity > 10) fail("invalid-argument", "Maximum quantity per size is 10.");
  }
  return Array.from(grouped.values());
}
function customerDetails(input) {
  const value = input || {};
  return {
    name: text(value.name, 80, "Full name"),
    mobile: phone(value.mobile),
    pin: pinCode(value.pin),
    city: text(value.city, 100, "City or village"),
    address: text(value.address, 300, "Delivery address"),
    note: String(value.note || "").trim().slice(0, 240)
  };
}
function totalStock(inventory) {
  return Object.values(inventory).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0);
}
function productStockState(product, size, quantity) {
  const sizes = Array.isArray(product.sizes) ? product.sizes.map(String) : [];
  if (sizes.length && !sizes.includes(size)) fail("failed-precondition", "Size " + size + " is not available for " + (product.name || "this product") + ".");
  const variantStock = product.inventoryBySize && typeof product.inventoryBySize === "object" && !Array.isArray(product.inventoryBySize);
  if (variantStock) {
    const inventory = { ...product.inventoryBySize };
    const available = Number(inventory[size] || 0);
    if (!Number.isInteger(available) || available < quantity) {
      fail("failed-precondition", (product.name || "Product") + " has only " + Math.max(0, available) + " item(s) in size " + size + ".");
    }
    inventory[size] = available - quantity;
    return { mode: "variant", inventory, stock: totalStock(inventory) };
  }
  const available = Number(product.stock || 0);
  if (!Number.isInteger(available) || available < quantity) {
    fail("failed-precondition", (product.name || "Product") + " is out of stock.");
  }
  return { mode: "global", stock: available - quantity };
}
function addInventoryBack(product, line) {
  if (line.inventoryMode === "variant") {
    const inventory = { ...(product.inventoryBySize || {}) };
    inventory[line.size] = Math.max(0, Number(inventory[line.size]) || 0) + Number(line.qty || 0);
    return { inventoryBySize: inventory, stock: totalStock(inventory) };
  }
  return { stock: Math.max(0, Number(product.stock) || 0) + Number(line.qty || 0) };
}
async function reserveOrder(request, paymentMethod) {
  const uid = requireCustomer(request);
  const customer = customerDetails(request.data && request.data.customer);
  const cart = normaliseCart(request.data && request.data.items);
  const orderRef = db.collection("orders").doc();
  const now = Timestamp.now();
  const online = paymentMethod === "razorpay";
  const shippingFeePaise = shippingPaise();

  const result = await db.runTransaction(async (transaction) => {
    const uniqueProductIds = Array.from(new Set(cart.map(item => item.productId)));
    const productRefs = uniqueProductIds.map(id => db.collection("products").doc(id));
    const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
    const workingProducts = new Map();
    productSnaps.forEach((snap, index) => {
      if (!snap.exists) fail("not-found", "A product in your cart is no longer available.");
      workingProducts.set(uniqueProductIds[index], { ref: productRefs[index], data: snap.data() });
    });
    const lines = [];
    let subtotalPaise = 0;

    for (const item of cart) {
      const working = workingProducts.get(item.productId);
      const product = working.data;
      if (product.saleEnabled !== true || product.priceVerified !== true) {
        fail("failed-precondition", (product.name || item.productId) + " is not yet enabled for online sale. Please contact the shop.");
      }
      const unitPaise = moneyPaise(product.price);
      if (Number(product.approvedPricePaise || 0) !== unitPaise) {
        fail("failed-precondition", (product.name || item.productId) + " needs the shop to re-verify its selling price before online checkout.");
      }
      const lineTotalPaise = unitPaise * item.quantity;
      subtotalPaise += lineTotalPaise;
      const stock = productStockState(product, item.size, item.quantity);
      working.data = stock.mode === "variant"
        ? { ...product, inventoryBySize: stock.inventory, stock: stock.stock }
        : { ...product, stock: stock.stock };
      lines.push({
        productId: item.productId,
        id: item.productId,
        name: String(product.name || item.productId).slice(0, 120),
        size: item.size,
        qty: item.quantity,
        price: unitPaise / 100,
        unitPaise,
        lineTotal: lineTotalPaise / 100,
        lineTotalPaise,
        inventoryMode: stock.mode
      });
    }
    if (subtotalPaise <= 0 || subtotalPaise > 100000000) fail("failed-precondition", "Order total is outside the allowed range.");
    const totalPaise = subtotalPaise + shippingFeePaise;
    for (const working of workingProducts.values()) {
      const update = working.data.inventoryBySize && typeof working.data.inventoryBySize === "object"
        ? { inventoryBySize: working.data.inventoryBySize, stock: working.data.stock, updatedAt: FieldValue.serverTimestamp() }
        : { stock: working.data.stock, updatedAt: FieldValue.serverTimestamp() };
      transaction.update(working.ref, update);
    }

    const id = "SFH-" + orderRef.id.toUpperCase();
    const status = online ? "Awaiting payment" : "Order received";
    const order = {
      id,
      uid,
      customer,
      items: lines,
      subtotal: subtotalPaise / 100,
      subtotalPaise,
      shippingFee: shippingFeePaise / 100,
      shippingFeePaise,
      total: totalPaise / 100,
      amountPaise: totalPaise,
      currency: "INR",
      paymentMethod,
      paymentStatus: online ? "created" : "cod_pending",
      status,
      stockReserved: online,
      stockCommitted: !online,
      reservationExpiresAt: online ? Timestamp.fromMillis(now.toMillis() + 20 * 60 * 1000) : null,
      tracking: { courier: "", trackingNumber: "", trackingUrl: "", estimatedDelivery: "", note: "" },
      timeline: [{ status, at: now, message: online ? "Inventory reserved. Waiting for payment." : "Order placed. Cash on delivery requested." }],
      createdAt: now,
      updatedAt: now
    };
    transaction.create(orderRef, order);
    return {
      orderId: id,
      documentId: orderRef.id,
      amount: totalPaise,
      currency: "INR",
      reservationExpiresAtMs: online ? now.toMillis() + 20 * 60 * 1000 : null
    };
  });
  return result;
}
async function restoreOrderInventory(transaction, order) {
  if (!order || (!order.stockReserved && !order.stockCommitted)) return false;
  const lines = Array.isArray(order.items) ? order.items : [];
  const grouped = new Map();
  for (const line of lines) {
    const productId = line.productId || line.id;
    if (!grouped.has(productId)) grouped.set(productId, []);
    grouped.get(productId).push(line);
  }
  const productIds = Array.from(grouped.keys());
  const refs = productIds.map(id => db.collection("products").doc(id));
  const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
  for (let i = 0; i < productIds.length; i += 1) {
    if (!snapshots[i].exists) continue;
    let product = snapshots[i].data();
    for (const line of grouped.get(productIds[i])) {
      product = { ...product, ...addInventoryBack(product, line) };
    }
    transaction.update(refs[i], {
      ...(product.inventoryBySize && typeof product.inventoryBySize === "object"
        ? { inventoryBySize: product.inventoryBySize, stock: product.stock }
        : { stock: product.stock }),
      updatedAt: FieldValue.serverTimestamp()
    });
  }
  return true;
}
async function expireOrder(orderId, reason) {
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return false;
    const order = snap.data();
    if (order.paymentStatus === "paid" || !order.stockReserved) return false;
    const restored = await restoreOrderInventory(transaction, order);
    transaction.update(ref, {
      stockReserved: false,
      paymentStatus: reason === "expired" ? "expired" : "failed",
      status: reason === "expired" ? "Payment expired" : "Payment not completed",
      updatedAt: FieldValue.serverTimestamp(),
      timeline: FieldValue.arrayUnion({
        status: reason === "expired" ? "Payment expired" : "Payment not completed",
        at: Timestamp.now(),
        message: restored ? "Unpaid inventory reservation released." : "Payment attempt closed."
      })
    });
    return true;
  });
}
function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex")); }
  catch (_) { return false; }
}
async function findOrderByRazorpayOrderId(razorpayOrderId) {
  const snap = await db.collection("orders").where("razorpayOrderId", "==", razorpayOrderId).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}
async function markPaymentCaptured(orderId, paymentId, amountPaise, currency) {
  const ref = db.collection("orders").doc(orderId);
  return db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) fail("not-found", "The order could not be found.");
    const order = snap.data();
    if (order.paymentStatus === "paid") return { orderId: order.id, status: order.status, alreadyPaid: true };
    if (Number(order.amountPaise) !== Number(amountPaise) || currency !== "INR") {
      fail("failed-precondition", "The captured payment amount does not match this order.");
    }
    if (order.stockReserved) {
      transaction.update(ref, {
        paymentStatus: "paid",
        paymentId,
        status: "Confirmed",
        stockReserved: false,
        stockCommitted: true,
        updatedAt: FieldValue.serverTimestamp(),
        timeline: FieldValue.arrayUnion({ status: "Confirmed", at: Timestamp.now(), message: "Payment captured and verified." })
      });
      return { orderId: order.id, status: "Confirmed" };
    }
    transaction.update(ref, {
      paymentStatus: "paid",
      paymentId,
      status: "Payment review required",
      needsManualReview: true,
      updatedAt: FieldValue.serverTimestamp(),
      timeline: FieldValue.arrayUnion({ status: "Payment review required", at: Timestamp.now(), message: "Payment was captured after the stock reservation had been released. Shop action is required." })
    });
    return { orderId: order.id, status: "Payment review required", needsManualReview: true };
  });
}

exports.placeCodOrder = onCall({ region: REGION, maxInstances: 10 }, async request => {
  const order = await reserveOrder(request, "cod");
  return { success: true, ...order, paymentStatus: "cod_pending" };
});

exports.createRazorpayOrder = onCall({
  region: REGION,
  maxInstances: 10,
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET]
}, async request => {
  const keyId = RAZORPAY_KEY_ID.value();
  const keySecret = RAZORPAY_KEY_SECRET.value();
  if (!keyId || !keySecret) fail("failed-precondition", "The shop payment gateway is not configured yet.");
  const order = await reserveOrder(request, "razorpay");
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: order.amount,
        currency: "INR",
        receipt: order.documentId.slice(0, 40),
        notes: { sfhOrderId: order.orderId, customerUid: request.auth.uid }
      }),
      signal: AbortSignal.timeout(15000)
    });
    const gateway = await response.json();
    if (!response.ok || !gateway.id) throw new Error(gateway.error && gateway.error.description || "Razorpay could not create the payment order.");
    await db.collection("orders").doc(order.documentId).update({
      razorpayOrderId: gateway.id,
      razorpayKeyId: keyId,
      updatedAt: FieldValue.serverTimestamp()
    });
    return {
      success: true,
      orderId: order.orderId,
      razorpayOrderId: gateway.id,
      keyId,
      amount: order.amount,
      currency: "INR",
      reservationExpiresAtMs: order.reservationExpiresAtMs
    };
  } catch (error) {
    await expireOrder(order.documentId, "failed");
    console.error("Razorpay order creation failed:", error.message);
    fail("unavailable", "Payment could not be started. Reserved stock has been released. Please try again.");
  }
});

exports.verifyRazorpayPayment = onCall({
  region: REGION,
  maxInstances: 10,
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET]
}, async request => {
  const uid = requireCustomer(request);
  const orderId = text(request.data && request.data.orderId, 100, "Order reference");
  const paymentId = text(request.data && request.data.razorpayPaymentId, 100, "Payment reference");
  const signature = text(request.data && request.data.razorpaySignature, 256, "Payment signature");
  const snap = await db.collection("orders").where("id", "==", orderId).limit(1).get();
  if (snap.empty) fail("not-found", "The order could not be found.");
  const orderDoc = snap.docs[0];
  const order = orderDoc.data();
  if (order.uid !== uid) fail("permission-denied", "This order does not belong to your account.");
  if (!order.razorpayOrderId) fail("failed-precondition", "The payment order is not ready for verification.");
  const secret = RAZORPAY_KEY_SECRET.value();
  const expected = crypto.createHmac("sha256", secret)
    .update(order.razorpayOrderId + "|" + paymentId)
    .digest("hex");
  if (!safeEqualHex(expected, signature)) fail("permission-denied", "Payment signature verification failed.");

  const keyId = RAZORPAY_KEY_ID.value();
  const response = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
    headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + secret).toString("base64") },
    signal: AbortSignal.timeout(15000)
  });
  const payment = await response.json();
  if (!response.ok || payment.order_id !== order.razorpayOrderId ||
      payment.status !== "captured" || Number(payment.amount) !== Number(order.amountPaise) ||
      payment.currency !== "INR") {
    fail("failed-precondition", "Payment is not confirmed as captured for this order. Please refresh My Orders before retrying.");
  }
  return await markPaymentCaptured(orderDoc.id, paymentId, payment.amount, payment.currency);
});

exports.cancelPendingPayment = onCall({ region: REGION, maxInstances: 10 }, async request => {
  const uid = requireCustomer(request);
  const orderId = text(request.data && request.data.orderId, 100, "Order reference");
  const snap = await db.collection("orders").where("id", "==", orderId).limit(1).get();
  if (snap.empty) return { success: true };
  const ref = snap.docs[0].ref;
  return db.runTransaction(async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists) return { success: true };
    const order = current.data();
    if (order.uid !== uid) fail("permission-denied", "This order does not belong to your account.");
    if (order.paymentStatus === "paid" || !order.stockReserved) return { success: true, status: order.status };
    await restoreOrderInventory(transaction, order);
    transaction.update(ref, {
      stockReserved: false,
      paymentStatus: "cancelled",
      status: "Payment cancelled",
      updatedAt: FieldValue.serverTimestamp(),
      timeline: FieldValue.arrayUnion({ status: "Payment cancelled", at: Timestamp.now(), message: "Payment window closed. Inventory returned to stock." })
    });
    return { success: true, status: "Payment cancelled" };
  });
});

exports.adminUpdateOrder = onCall({ region: REGION, maxInstances: 10 }, async request => {
  requireAdmin(request);
  const orderId = text(request.data && request.data.orderId, 100, "Order reference");
  const status = text(request.data && request.data.status, 40, "Order status");
  if (!ALLOWED_STATUSES.includes(status)) fail("invalid-argument", "Choose a valid order status.");
  const orderQuery = await db.collection("orders").where("id", "==", orderId).limit(1).get();
  if (orderQuery.empty) fail("not-found", "Order not found.");
  const ref = orderQuery.docs[0].ref;
  const input = request.data || {};
  const tracking = {
    courier: String(input.courier || "").trim().slice(0, 80),
    trackingNumber: String(input.trackingNumber || "").trim().slice(0, 100),
    trackingUrl: String(input.trackingUrl || "").trim().slice(0, 500),
    estimatedDelivery: String(input.estimatedDelivery || "").trim().slice(0, 40),
    note: String(input.note || "").trim().slice(0, 300)
  };
  if (tracking.trackingUrl && !/^https:\/\//i.test(tracking.trackingUrl)) {
    fail("invalid-argument", "Tracking link must begin with https://");
  }
  return db.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) fail("not-found", "Order not found.");
    const order = snap.data();
    const nonWorkflowStatuses = ["Awaiting payment", "Payment review required", "Payment expired", "Payment not completed", "Payment cancelled", "Pending"];
    if (nonWorkflowStatuses.includes(status) && status !== order.status) {
      fail("failed-precondition", "Payment/system statuses can only be retained, not selected as a new fulfilment status.");
    }
    if (order.status === "Cancelled" && status !== "Cancelled") {
      fail("failed-precondition", "A cancelled order cannot be reactivated. Please ask the customer to place a new order.");
    }
    if (status === "Cancelled" && order.status === "Delivered") fail("failed-precondition", "A delivered order cannot be cancelled from this screen.");
    if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" && status !== "Cancelled" && status !== "Awaiting payment") {
      fail("failed-precondition", "Do not confirm or dispatch an online order until Razorpay reports a captured payment.");
    }
    if (order.needsManualReview && status !== "Cancelled" && status !== "Payment review required") {
      fail("failed-precondition", "This order requires payment/stock reconciliation. Cancel it for a manual refund or resolve it outside normal dispatch.");
    }
    let stockRestored = false;
    // Unpaid checkout reservations can be released automatically. Already-committed
    // COD/paid units are not blindly returned to sellable stock until the shop confirms
    // that the physical goods are back and inspected.
    if (status === "Cancelled" && order.stockReserved) {
      stockRestored = await restoreOrderInventory(transaction, order);
    }
    const manualRestockRequired = status === "Cancelled" &&
      (Boolean(order.restockRequired) || (Boolean(order.stockCommitted) && !stockRestored));
    const update = {
      status,
      tracking,
      stockReserved: status === "Cancelled" ? false : Boolean(order.stockReserved),
      stockCommitted: status === "Cancelled" ? false : Boolean(order.stockCommitted),
      restockRequired: manualRestockRequired,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: request.auth.uid,
      timeline: FieldValue.arrayUnion({
        status,
        at: Timestamp.now(),
        message: tracking.note || (status === "Cancelled" ? "Order cancelled by the shop." : "Order status updated by the shop.")
      })
    };
    if (status === "Cancelled" && order.paymentStatus === "paid") {
      update.refundRequired = true;
      update.refundStatus = "manual_action_required";
    } else if (status === "Cancelled") {
      update.paymentStatus = "cancelled";
    }
    transaction.update(ref, update);
    return { success: true, orderId: order.id, status, stockRestored, manualRestockRequired, refundRequired: status === "Cancelled" && order.paymentStatus === "paid" };
  });
});

exports.razorpayWebhook = onRequest({
  region: REGION,
  maxInstances: 10,
  secrets: [RAZORPAY_WEBHOOK_SECRET]
}, async (request, response) => {
  if (request.method !== "POST") return response.status(405).send("Method not allowed");
  const secret = RAZORPAY_WEBHOOK_SECRET.value();
  const supplied = request.get("x-razorpay-signature") || "";
  const raw = request.rawBody;
  if (!secret || !raw || !supplied) return response.status(400).send("Webhook signature is required");
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!safeEqualHex(expected, supplied)) return response.status(401).send("Invalid webhook signature");

  let event;
  try { event = JSON.parse(raw.toString("utf8")); }
  catch (_) { return response.status(400).send("Invalid JSON"); }
  const eventName = String(event.event || "");
  if (!["payment.captured", "payment.failed"].includes(eventName)) {
    return response.status(200).send("Event ignored");
  }
  const entity = event.payload && event.payload.payment && event.payload.payment.entity;
  if (!entity || !entity.order_id) return response.status(200).send("No payment entity");
  try {
    const orderSnap = await findOrderByRazorpayOrderId(entity.order_id);
    if (!orderSnap) return response.status(200).send("Order not found; event acknowledged");
    const eventId = request.get("x-razorpay-event-id") || (eventName + "_" + entity.id);
    const eventRef = db.collection("razorpayWebhookEvents").doc(String(eventId).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 140));
    const orderRef = orderSnap.ref;
    await db.runTransaction(async transaction => {
      const eventDoc = await transaction.get(eventRef);
      if (eventDoc.exists) return;
      const current = await transaction.get(orderRef);
      if (!current.exists) return;
      const order = current.data();
      if (eventName === "payment.captured") {
        if (Number(entity.amount) !== Number(order.amountPaise) || entity.currency !== "INR") {
          transaction.update(orderRef, { needsManualReview: true, paymentReviewReason: "Webhook amount/currency mismatch", updatedAt: FieldValue.serverTimestamp() });
        } else if (order.stockReserved) {
          transaction.update(orderRef, {
            paymentStatus: "paid", paymentId: entity.id, status: "Confirmed",
            stockReserved: false, stockCommitted: true, updatedAt: FieldValue.serverTimestamp(),
            timeline: FieldValue.arrayUnion({ status: "Confirmed", at: Timestamp.now(), message: "Payment confirmed by Razorpay webhook." })
          });
        } else if (order.paymentStatus !== "paid") {
          transaction.update(orderRef, {
            paymentStatus: "paid", paymentId: entity.id, status: "Payment review required",
            needsManualReview: true, updatedAt: FieldValue.serverTimestamp(),
            timeline: FieldValue.arrayUnion({ status: "Payment review required", at: Timestamp.now(), message: "Razorpay reported payment captured after inventory reservation ended." })
          });
        }
      } else if (eventName === "payment.failed" && order.paymentStatus === "created" && order.stockReserved) {
        // Razorpay orders may have multiple payment attempts. Keep the stock reservation
        // alive until the customer retries, explicitly cancels, or the 20-minute expiry job runs.
        transaction.update(orderRef, {
          lastPaymentAttempt: "failed",
          lastPaymentFailureAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          timeline: FieldValue.arrayUnion({ status: "Payment attempt failed", at: Timestamp.now(), message: "A payment attempt did not complete. Stock remains temporarily reserved so the customer can retry." })
        });
      }
      transaction.create(eventRef, { event: eventName, paymentId: entity.id || "", receivedAt: FieldValue.serverTimestamp() });
    });
    return response.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    return response.status(500).send("Webhook processing failed");
  }
});

exports.expirePendingPayments = onSchedule({
  region: REGION,
  schedule: "every 10 minutes",
  timeZone: "Asia/Kolkata",
  maxInstances: 1
}, async () => {
  const now = Timestamp.now();
  const expired = await db.collection("orders")
    .where("paymentStatus", "==", "created")
    .where("reservationExpiresAt", "<=", now)
    .limit(100)
    .get();
  for (const doc of expired.docs) {
    try { await expireOrder(doc.id, "expired"); }
    catch (error) { console.error("Could not expire order", doc.id, error); }
  }
});
