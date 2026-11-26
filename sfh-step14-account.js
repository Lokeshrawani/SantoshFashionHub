/* Santosh Fashion Hub — secure customer account UI backed by Firebase Authentication */
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

(async function () {
  const CDN = "https://www.gstatic.com/firebasejs/12.19.0/";
  let auth = null;
  let db = null;
  let ready = false;
  let initPromise = null;
  let currentUser = null;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  function configReady(config) {
    return config && typeof config.projectId === "string" && config.projectId.trim() &&
      Object.values(config).every(value => typeof value === "string" && value.trim() && !/^YOUR_/i.test(value));
  }
  function message(text, kind = "") {
    const target = document.getElementById("sfhAccountMsg");
    if (target) { target.textContent = text; target.className = "sfh-account-msg " + kind; }
  }
  function addAccountButton() {
    const actions = document.querySelector(".headerActions");
    if (!actions || document.getElementById("sfhAccountBtn")) return;
    const button = document.createElement("button");
    button.id = "sfhAccountBtn";
    button.className = "sfh-account-btn";
    button.type = "button";
    button.innerHTML = '<span class="sfh-account-dot"></span><span id="sfhAccountLabel">My Account</span>';
    button.addEventListener("click", () => window.sfhToggleAccount(true));
    actions.insertBefore(button, actions.firstChild);
  }
  function ensurePanel() {
    if (document.getElementById("sfhAccountPanel")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "sfhAccountBackdrop";
    backdrop.className = "sfh-account-backdrop";
    backdrop.addEventListener("click", () => window.sfhToggleAccount(false));
    const panel = document.createElement("section");
    panel.id = "sfhAccountPanel";
    panel.className = "sfh-account-panel";
    panel.innerHTML = `
      <div class="sfh-account-head">
        <div><span>SANTOSH FASHION HUB</span><h3 id="sfhAccountTitle">My Account</h3></div>
        <button class="sfh-account-close" type="button" aria-label="Close account panel" onclick="sfhToggleAccount(false)">×</button>
      </div>
      <div class="sfh-account-body"><div id="sfhAccountContent"></div></div>`;
    document.body.append(backdrop, panel);
  }
  function renderLoggedOut() {
    const box = document.getElementById("sfhAccountContent");
    if (!box) return;
    box.innerHTML = `
      <form id="sfhAccountForm" class="sfh-account-form">
        <label>Full name (for new accounts)<input id="sfhAcctName" type="text" maxlength="80" autocomplete="name" placeholder="Your name"></label>
        <label>Email address<input id="sfhAcctEmail" type="email" required autocomplete="email" placeholder="you@example.com"></label>
        <label>Password<input id="sfhAcctPassword" type="password" required minlength="6" autocomplete="current-password" placeholder="At least 6 characters"></label>
        <div class="sfh-account-actions">
          <button class="primary" type="submit">Sign In</button>
          <button type="button" id="sfhAcctSignup">Create Account</button>
        </div>
        <div class="sfh-account-secondary">
          <button type="button" id="sfhAcctReset">Forgot password?</button>
        </div>
        <div id="sfhAccountMsg" class="sfh-account-msg"></div>
      </form>
      <div class="sfh-account-links"><a href="./sfh-step13-orders.html">📦 My Orders & Tracking</a></div>
      <div class="sfh-account-note">Your password is managed by Firebase Authentication. We never ask you to send passwords by WhatsApp.</div>`;
    box.querySelector("#sfhAccountForm").addEventListener("submit", signIn);
    box.querySelector("#sfhAcctSignup").addEventListener("click", signUp);
    box.querySelector("#sfhAcctReset").addEventListener("click", resetPassword);
  }
  function renderLoggedIn(user) {
    const box = document.getElementById("sfhAccountContent");
    if (!box) return;
    const verified = user.emailVerified === true;
    box.innerHTML = `
      <div class="sfh-account-user">
        <b>${escapeHtml(user.displayName || user.email || "Signed-in customer")}</b>
        <span>${escapeHtml(user.email || "")}</span>
        <span>Account status: ${verified ? "Email verified" : "Email verification required"}</span>
      </div>
      ${verified ? "" : '<div class="sfh-account-verify"><b>Verify your email to place orders.</b><p>Open the verification link sent to your inbox, then sign in again.</p><button type="button" id="sfhAcctResend">Resend verification email</button></div>'}
      <div class="sfh-account-links">
        <a href="./sfh-step13-orders.html">📦 My Orders & Tracking</a>
        <button type="button" id="sfhAcctLogout">↪ Sign Out</button>
      </div>
      <div id="sfhAccountMsg" class="sfh-account-msg ${verified ? "ok" : ""}">${verified ? "You are signed in securely." : "Your account is created. Verify your email to continue."}</div>`;
    box.querySelector("#sfhAcctLogout").addEventListener("click", async () => {
      try { await signOut(auth); }
      catch (error) { message(error.message || "Sign out failed.", "bad"); }
    });
    box.querySelector("#sfhAcctResend")?.addEventListener("click", async () => {
      try { await sendEmailVerification(user); message("A new verification email has been sent.", "ok"); }
      catch (error) { message(error.message || "Could not send verification email.", "bad"); }
    });
  }
  function updateLabel(user) {
    const label = document.getElementById("sfhAccountLabel");
    const button = document.getElementById("sfhAccountBtn");
    if (!label || !button) return;
    label.textContent = user ? (user.emailVerified ? "Account" : "Verify email") : "My Account";
    button.classList.toggle("signed", !!user);
  }
  async function signIn(event) {
    event.preventDefault();
    if (!ready && !await initialiseFirebase()) return message("Firebase account service is not connected yet.", "bad");
    const email = document.getElementById("sfhAcctEmail").value.trim();
    const password = document.getElementById("sfhAcctPassword").value;
    message("Signing in…");
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user).catch(() => {});
        message("Your email is not verified yet. We sent another verification link. Open it, then sign in again.", "bad");
      } else {
        message("Signed in successfully.", "ok");
      }
    } catch (error) {
      message((error.code || "auth/error").replace("auth/", "") + ". Please check your email and password.", "bad");
    }
  }
  async function signUp() {
    if (!ready && !await initialiseFirebase()) return message("Firebase account service is not connected yet.", "bad");
    const email = document.getElementById("sfhAcctEmail").value.trim();
    const password = document.getElementById("sfhAcctPassword").value;
    const displayName = document.getElementById("sfhAcctName").value.trim().slice(0, 80);
    if (!email || password.length < 6) return message("Enter an email and a password with at least 6 characters.", "bad");
    message("Creating your secure customer account…");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(credential.user, { displayName });
      await setDoc(doc(db, "customers", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email || email,
        displayName,
        role: "customer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      await sendEmailVerification(credential.user);
      message("Account created. Please verify the link sent to " + email + " before checkout.", "ok");
    } catch (error) {
      message((error.code || "auth/error").replace("auth/", "") + ": " + (error.message || "Account creation failed."), "bad");
    }
  }
  async function resetPassword() {
    if (!ready && !await initialiseFirebase()) return message("Firebase account service is not connected yet.", "bad");
    const email = document.getElementById("sfhAcctEmail").value.trim();
    if (!email) return message("Enter your email address first.", "bad");
    try {
      await sendPasswordResetEmail(auth, email);
      message("Password reset instructions have been sent to " + email + ".", "ok");
    } catch (error) {
      message((error.code || "auth/error").replace("auth/", "") + ": " + (error.message || "Could not send reset email."), "bad");
    }
  }
  async function initialiseFirebase() {
    if (ready) return true;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const config = window.SFH_FIREBASE_CONFIG;
        if (!configReady(config)) return false;
        const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
          import(CDN + "firebase-app.js"),
          import(CDN + "firebase-auth.js"),
          import(CDN + "firebase-firestore.js")
        ]);
        const app = getApps().find(existing => existing.name === "[DEFAULT]") || initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        ready = true;
        onAuthStateChanged(auth, user => {
          currentUser = user || null;
          updateLabel(currentUser);
          if (document.getElementById("sfhAccountPanel")?.classList.contains("open")) {
            currentUser ? renderLoggedIn(currentUser) : renderLoggedOut();
          }
          document.dispatchEvent(new CustomEvent("sfh-customer-auth", { detail: { user: currentUser } }));
        });
        return true;
      } catch (error) {
        console.error("Santosh Fashion Hub account auth:", error);
        return false;
      }
    })();
    return initPromise;
  }
  window.sfhToggleAccount = open => {
    ensurePanel();
    document.getElementById("sfhAccountPanel").classList.toggle("open", !!open);
    document.getElementById("sfhAccountBackdrop").classList.toggle("open", !!open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      if (currentUser) renderLoggedIn(currentUser);
      else renderLoggedOut();
      initialiseFirebase().then(ok => { if (ok && currentUser) renderLoggedIn(currentUser); });
    }
  };
  addAccountButton();
  ensurePanel();
  renderLoggedOut();
  initialiseFirebase();
  document.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-account-open]");
    if (trigger) { event.preventDefault(); window.sfhToggleAccount(true); }
  });
})();
