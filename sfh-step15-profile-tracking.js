/* Santosh Fashion Hub — central account and order-tracking shortcut.
   Customer profile/order data is stored in Firebase, not localStorage on one device. */
(function(){
  function inject(){
    const products=document.getElementById("products");
    if(!products||document.getElementById("sfh15AccountBar"))return;
    const section=document.createElement("section");
    section.id="sfh15AccountBar";
    section.className="section sfh-business-account-callout";
    section.innerHTML=`
      <div>
        <span class="eyebrow">YOUR SHOPPING ACCOUNT</span>
        <h2>All your orders, in one place</h2>
        <p>Sign in to see order history, payment confirmation, courier details and delivery updates across your devices.</p>
      </div>
      <div class="sfh-business-account-actions">
        <a class="btn outline" href="./sfh-step13-orders.html">📦 Track my orders</a>
        <button class="btn primary" type="button" data-account-open>👤 My account</button>
      </div>`;
    products.parentNode.insertBefore(section,products);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inject,{once:true});
  else inject();
})();
