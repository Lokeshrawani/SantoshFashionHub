import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

const REGION = "asia-south1";
const $ = id => document.getElementById(id);
let auth;
let functions;
let currentUser = null;
let checkoutBusy = false;
let razorpayLoader;
let pendingOnlinePayment = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function showToast(message) {
  if (typeof window.toast === "function") window.toast(message);
  else console.info("[Santosh Fashion Hub]", message);
}
function setMessage(message, kind = "") {
  const element = $("sfhProductionMessage");
  if (element) {
    element.textContent = message;
    element.className = "sfh-production-message " + kind;
  }
}
function cartItems() {
  const products = Array.isArray(window.products) ? window.products : [];
  return (Array.isArray(window.cart) ? window.cart : []).map(item => {
    const product = products.find(candidate => candidate.id === item.id);
    if (!product) return null;
    return {
      productId: String(product.id),
      size: String(item.size || ""),
      quantity: Number(item.qty || 1),
      name: String(product.name || product.id)
    };
  }).filter(Boolean);
}
function clearCart() {
  window.cart = [];
  try { localStorage.setItem("sfh-cart", "[]"); } catch (_) {}
  if (typeof window.renderCart === "function") window.renderCart();
  if (typeof window.closeCart === "function") window.closeCart();
  document.querySelectorAll("#cartCount,#drawerCount,#mobileCartCount").forEach(node => node.textContent = "0");
}
function profileDefaults() {
  try { return JSON.parse(localStorage.getItem("sfh-customer-profile") || "{}") || {}; }
  catch (_) { return {}; }
}
function ensureModal() {
  if ($("sfhProductionCheckout")) return;
  const modal = document.createElement("div");
  modal.id = "sfhProductionCheckout";
  modal.className = "sfh-production-modal";
  modal.innerHTML = `
    <section class="sfh-production-card" role="dialog" aria-modal="true" aria-labelledby="sfhProductionTitle">
      <button class="sfh-production-close" type="button" aria-label="Close checkout" id="sfhProductionClose">×</button>
      <div class="sfh-production-kicker">SECURE CHECKOUT • SANTOSH FASHION HUB</div>
      <h2 id="sfhProductionTitle">Complete your order</h2>
      <p class="sfh-production-intro">Your price and available stock are checked securely by the shop system before your order is accepted.</p>
      <div id="sfhProductionSummary" class="sfh-production-summary"></div>
      <form id="sfhProductionForm" class="sfh-production-form">
        <label>Full name<input id="sfhProductionName" maxlength="80" required autocomplete="name"></label>
        <label>Mobile number<input id="sfhProductionMobile" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" required autocomplete="tel"></label>
        <label>PIN code<input id="sfhProductionPin" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required autocomplete="postal-code"></label>
        <label>City / Village<input id="sfhProductionCity" maxlength="100" required autocomplete="address-level2"></label>
        <label class="sfh-production-full">Delivery address<textarea id="sfhProductionAddress" rows="3" maxlength="300" required autocomplete="street-address"></textarea></label>
        <label class="sfh-production-full">Order note (optional)<input id="sfhProductionNote" maxlength="240" placeholder="Landmark or delivery instruction"></label>
        <fieldset class="sfh-payment-choice sfh-production-full">
          <legend>Payment method</legend>
          <label><input type="radio" name="sfhProductionPayment" value="razorpay" checked><span><b>Pay online</b><small>UPI, cards and available Razorpay methods</small></span></label>
          <label><input type="radio" name="sfhProductionPayment" value="cod"><span><b>Cash on Delivery</b><small>Subject to shop confirmation for your PIN code</small></span></label>
        </fieldset>
        <p class="sfh-production-shipping sfh-production-full">Shipping charges and delivery availability will be confirmed by the shop. The checkout total includes only the amount configured by the shop.</p>
        <p id="sfhProductionMessage" class="sfh-production-message sfh-production-full" aria-live="polite"></p>
        <button class="sfh-production-submit sfh-production-full" id="sfhProductionSubmit" type="submit">Continue securely</button>
      </form>
      <div id="sfhProductionSuccess" class="sfh-production-success" hidden></div>
    </section>`;
  modal.addEventListener("click", event => {
    if (event.target === modal) closeCheckout();
  });
  document.body.appendChild(modal);
  $("sfhProductionClose").addEventListener("click", closeCheckout);
  $("sfhProductionForm").addEventListener("submit", submitCheckout);
}
function closeCheckout() {
  $("sfhProductionCheckout")?.classList.remove("open");
  document.body.classList.remove("sfh-production-no-scroll");
}
function renderSummary(items) {
  const products = Array.isArray(window.products) ? window.products : [];
  $("sfhProductionSummary").innerHTML = items.map(item => {
    const product = products.find(candidate => candidate.id === item.productId);
    return `<div class="sfh-production-line"><span><b>${escapeHtml(item.name)}</b><small>SKU ${escapeHtml(item.productId)} • Size ${escapeHtml(item.size)} • Qty ${item.quantity}</small></span><span class="sfh-production-line-note">Server will confirm price</span></div>`;
  }).join("");
}
function openCheckout() {
  if (checkoutBusy) return;
  ensureModal();
  if (!cartItems().length) {
    showToast("Your cart is empty.");
    return;
  }
  if (!currentUser) {
    showToast("Please sign in or create a customer account before checkout.");
    if (typeof window.sfhToggleAccount === "function") window.sfhToggleAccount(true);
    return;
  }
  if (!currentUser.emailVerified) {
    showToast("Please verify your email address before placing an order.");
    if (typeof window.sfhToggleAccount === "function") window.sfhToggleAccount(true);
    return;
  }
  const profile = profileDefaults();
  $("sfhProductionName").value = profile.name || currentUser.displayName || "";
  $("sfhProductionMobile").value = profile.mobile || "";
  $("sfhProductionPin").value = profile.pin || "";
  $("sfhProductionCity").value = profile.city || "";
  $("sfhProductionAddress").value = profile.address || "";
  $("sfhProductionNote").value = "";
  $("sfhProductionForm").hidden = false;
  $("sfhProductionSuccess").hidden = true;
  setBusy(false);
  setMessage("");
  renderSummary(cartItems());
  $("sfhProductionCheckout").classList.add("open");
  document.body.classList.add("sfh-production-no-scroll");
}
function setBusy(value) {
  checkoutBusy = value;
  const button = $("sfhProductionSubmit");
  if (button) {
    button.disabled = value;
    button.textContent = value ? "Please wait…" : "Continue securely";
  }
}
function readCustomer() {
  const customer = {
    name: $("sfhProductionName").value.trim(),
    mobile: $("sfhProductionMobile").value.trim(),
    pin: $("sfhProductionPin").value.trim(),
    city: $("sfhProductionCity").value.trim(),
    address: $("sfhProductionAddress").value.trim(),
    note: $("sfhProductionNote").value.trim()
  };
  if (!/^\d{10}$/.test(customer.mobile)) throw new Error("Enter a valid 10-digit mobile number.");
  if (!/^\d{6}$/.test(customer.pin)) throw new Error("Enter a valid 6-digit PIN code.");
  if (!customer.name || !customer.city || !customer.address) throw new Error("Complete all required delivery details.");
  return customer;
}
function showSuccess(orderId, status, amountPaise) {
  pendingOnlinePayment = null;
  clearCart();
  $("sfhProductionForm").hidden = true;
  $("sfhProductionSuccess").hidden = false;
  $("sfhProductionSuccess").innerHTML = `
    <div class="sfh-production-success-icon">✓</div>
    <h3>Order received</h3>
    <p>Your reference is <b>${escapeHtml(orderId)}</b>.</p>
    <p>Status: ${escapeHtml(status || "Order received")}</p>
    ${Number.isFinite(Number(amountPaise)) ? `<p>Order total: <b>₹${(Number(amountPaise)/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</b></p>` : ""}
    <a class="sfh-production-track" href="./sfh-step13-orders.html">View order tracking →</a>`;
}
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayLoader) return razorpayLoader;
  razorpayLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => window.Razorpay ? resolve() : reject(new Error("Payment window could not be loaded."));
    script.onerror = () => reject(new Error("Could not load Razorpay checkout. Check your internet connection."));
    document.head.appendChild(script);
  });
  return razorpayLoader;
}
async function submitCheckout(event) {
  event.preventDefault();
  if (checkoutBusy) return;
  try {
    if (!currentUser || !currentUser.emailVerified) throw new Error("Sign in with a verified customer account before checkout.");
    const customer = readCustomer();
    const items = cartItems().map(({ productId, size, quantity }) => ({ productId, size, quantity }));
    if (!items.length) throw new Error("Your cart is empty.");
    const method = document.querySelector('input[name="sfhProductionPayment"]:checked')?.value || "razorpay";
    if (pendingOnlinePayment) {
      if (method !== "razorpay") throw new Error("You have an unpaid online order. Retry that payment or wait for its 20-minute reservation to expire before choosing COD.");
      await openRazorpayPayment(pendingOnlinePayment.order, pendingOnlinePayment.customer);
      return;
    }
    setBusy(true);
    setMessage(method === "cod" ? "Checking stock and placing your COD order…" : "Checking stock and creating your secure payment…");

    if (method === "cod") {
      const call = httpsCallable(functions, "placeCodOrder");
      const result = await call({ customer, items });
      setBusy(false);
      showSuccess(result.data.orderId, "Order received • Cash on Delivery requested", result.data.amount);
      return;
    }

    await loadRazorpay();
    const create = httpsCallable(functions, "createRazorpayOrder");
    const result = await create({ customer, items });
    pendingOnlinePayment = { order: result.data, customer };
    await openRazorpayPayment(result.data, customer);
  } catch (error) {
    setMessage(error.message || "Checkout could not be completed. Please try again.", "error");
    setBusy(false);
  }
}
function offerPaymentRetry(message, paymentOrder, customer) {
  setBusy(false);
  setMessage(message, "error");
  const host = $("sfhProductionMessage");
  if (!host || host.querySelector("[data-sfh-retry-payment]")) return;
  if (paymentOrder.reservationExpiresAtMs && Date.now() >= paymentOrder.reservationExpiresAtMs) {
    pendingOnlinePayment = null;
    host.appendChild(document.createTextNode(" The stock reservation window has expired. Check My Orders before placing a fresh order."));
    return;
  }
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "sfh-production-retry";
  retry.dataset.sfhRetryPayment = "true";
  retry.textContent = "Retry payment";
  retry.addEventListener("click", () => openRazorpayPayment(paymentOrder, customer));
  host.appendChild(document.createTextNode(" "));
  host.appendChild(retry);
}
async function openRazorpayPayment(paymentOrder, customer) {
  if (paymentOrder.reservationExpiresAtMs && Date.now() >= paymentOrder.reservationExpiresAtMs) {
    pendingOnlinePayment = null;
    setBusy(false);
    setMessage("This payment reservation has expired. Do not continue with this payment. Check My Orders and place a fresh order once stock is released.", "error");
    return;
  }
  setBusy(true);
  let finished = false;
  let verificationStarted = false;
  let retryWasShown = false;
  const verifyPayment = async response => {
    verificationStarted = true;
    setBusy(true);
    setMessage("Payment received. Verifying securely…");
    try {
      const verify = httpsCallable(functions, "verifyRazorpayPayment");
      const verified = await verify({
        orderId: paymentOrder.orderId,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      });
      finished = true;
      pendingOnlinePayment = null;
      showSuccess(paymentOrder.orderId, verified.data.status || "Confirmed", paymentOrder.amount);
    } catch (error) {
      setMessage("We could not confirm the payment in this browser. The Razorpay webhook may still update your order. Check My Orders and contact the shop before attempting another payment. " + (error.message || ""), "error");
    } finally {
      setBusy(false);
    }
  };
  const widget = new window.Razorpay({
    key: paymentOrder.keyId,
    amount: paymentOrder.amount,
    currency: paymentOrder.currency,
    name: "Santosh Fashion Hub",
    description: "Fashion order " + paymentOrder.orderId,
    order_id: paymentOrder.razorpayOrderId,
    prefill: { name: customer.name, email: currentUser.email || "", contact: customer.mobile },
    notes: { sfhOrderId: paymentOrder.orderId },
    theme: { color: "#211d1a" },
    modal: {
      ondismiss: () => {
        if (!finished && !verificationStarted && !retryWasShown) {
          retryWasShown = true;
          offerPaymentRetry("Payment window closed. Your stock remains reserved temporarily so you can retry this same payment.", paymentOrder, customer);
        }
      }
    },
    handler: verifyPayment
  });
  widget.on("payment.failed", response => {
    if (retryWasShown) return;
    retryWasShown = true;
    const description = response?.error?.description || "This payment attempt did not complete.";
    offerPaymentRetry(description + " Your stock remains reserved for a short retry window.", paymentOrder, customer);
  });
  widget.open();
}
function boot() {
  const config = window.SFH_FIREBASE_CONFIG;
  if (!config || !config.projectId) {
    console.error("SFH checkout: Firebase web config is not available.");
    return;
  }
  const app = getApps().find(existing => existing.name === "[DEFAULT]") || initializeApp(config);
  auth = getAuth(app);
  functions = getFunctions(app, REGION);
  onAuthStateChanged(auth, user => { currentUser = user || null; });
  window.sfhOpenProductionCheckout = openCheckout;
  window.sfhOpenCheckout = openCheckout;
  // Replace all legacy checkout entry points with the secure server-side checkout.
  window.checkout = openCheckout;
  window.orderWhatsApp = openCheckout;
  ensureModal();
}
boot();
