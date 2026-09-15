/* Santosh Fashion Hub — Step 6: Customer Checkout */
(function(){
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
  function cartData(){
    const items=(window.cart||[]).map(x=>{const p=(window.products||[]).find(y=>y.id===x.id);return p?{...x,p}:null}).filter(Boolean);
    const subtotal=items.reduce((a,x)=>a+Number(x.p.price||0)*Number(x.qty||0),0);
    const discount=Number(window.discount||0);
    return {items,subtotal,discount,total:Math.max(0,subtotal-discount)};
  }
  function ensureModal(){
    if(document.getElementById('sfhCheckout')) return;
    const div=document.createElement('div'); div.id='sfhCheckout'; div.className='sfh-checkout-modal';
    div.innerHTML=`<div class="sfh-checkout-card" role="dialog" aria-modal="true" aria-labelledby="sfhCheckoutTitle">
      <button class="sfh-checkout-close" type="button" aria-label="Close" onclick="sfhCloseCheckout()">×</button>
      <div class="sfh-checkout-head"><span class="eyebrow">STEP 6 • CHECKOUT</span><h2 id="sfhCheckoutTitle">Complete your order</h2><p>Enter your details. Your order summary will open in WhatsApp for confirmation.</p></div>
      <div id="sfhCheckoutSummary" class="sfh-checkout-summary"></div>
      <form id="sfhCheckoutForm" class="sfh-checkout-form">
        <label>Full Name<input id="sfhName" required maxlength="60" placeholder="Your name"></label>
        <label>Mobile Number<input id="sfhMobile" required inputmode="numeric" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile"></label>
        <label>PIN Code<input id="sfhPin" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="6-digit PIN"></label>
        <label>City / Village<input id="sfhCity" required maxlength="80" placeholder="City or village"></label>
        <label class="sfh-full">Delivery Address<textarea id="sfhAddress" required maxlength="220" rows="3" placeholder="House / street / landmark"></textarea></label>
        <label>Payment Preference<select id="sfhPayment"><option>UPI</option><option>Cash on Delivery</option><option>Bank Transfer</option><option>Need payment guidance</option></select></label>
        <label>Order Note<input id="sfhNote" maxlength="120" placeholder="Optional note"></label>
        <div class="sfh-order-total"><span>Estimated Total</span><strong id="sfhCheckoutTotal">₹0</strong></div>
        <button class="btn sfh-checkout-submit" type="submit">💬 Send Order to WhatsApp</button>
        <p class="sfh-checkout-note">Final stock, shipping charge and payment availability will be confirmed by Santosh Fashion Hub.</p>
      </form>
    </div>`;
    div.addEventListener('click',e=>{if(e.target===div)window.sfhCloseCheckout()});
    document.body.appendChild(div);
    document.getElementById('sfhCheckoutForm').addEventListener('submit',submitOrder);
  }
  function render(){
    ensureModal(); const d=cartData();
    const summary=document.getElementById('sfhCheckoutSummary');
    summary.innerHTML=d.items.length?d.items.map(x=>`<div class="sfh-summary-row"><div><b>${esc(x.p.name)}</b><small>${esc(x.p.id)} • Size ${esc(x.size)} • Qty ${x.qty}</small></div><strong>${money(Number(x.p.price)*Number(x.qty))}</strong></div>`).join(''):'<p>Your cart is empty.</p>';
    document.getElementById('sfhCheckoutTotal').textContent=money(d.total);
  }
  window.sfhOpenCheckout=function(){
    const d=cartData(); if(!d.items.length){ if(typeof window.toast==='function')toast('Your cart is empty'); return; }
    render(); document.getElementById('sfhCheckout').classList.add('open'); document.body.classList.add('sfh-no-scroll'); setTimeout(()=>document.getElementById('sfhName')?.focus(),80);
  };
  window.sfhCloseCheckout=function(){document.getElementById('sfhCheckout')?.classList.remove('open');document.body.classList.remove('sfh-no-scroll')};
  function submitOrder(e){
    e.preventDefault(); const d=cartData();
    const name=document.getElementById('sfhName').value.trim(), mobile=document.getElementById('sfhMobile').value.trim(), pin=document.getElementById('sfhPin').value.trim(), city=document.getElementById('sfhCity').value.trim(), address=document.getElementById('sfhAddress').value.trim(), payment=document.getElementById('sfhPayment').value, note=document.getElementById('sfhNote').value.trim();
    if(!/^[0-9]{10}$/.test(mobile)){alert('Please enter a valid 10-digit mobile number.');return}
    if(!/^[0-9]{6}$/.test(pin)){alert('Please enter a valid 6-digit PIN code.');return}
    const lines=d.items.map(x=>`${x.p.id} - ${x.p.name} | Size: ${x.size} | Qty: ${x.qty} | ${money(Number(x.p.price)*Number(x.qty))}`);
    const text=['Hello Santosh Fashion Hub 👋','','*New Website Order*',`Customer: ${name}`,`Mobile: ${mobile}`,`PIN: ${pin}`,`City/Village: ${city}`,`Address: ${address}`,`Payment Preference: ${payment}`,...(note?[`Note: ${note}`]:[]),'', '*Items*',...lines,'',`*Estimated Total:* ${money(d.total)}`,'','Please confirm stock, final price, shipping charge and payment/COD availability.'].join('\n');
    window.open(`https://wa.me/${window.PHONE||'919835567894'}?text=${encodeURIComponent(text)}`,'_blank');
    if(typeof window.toast==='function')toast('Order details opened in WhatsApp');
    window.sfhCloseCheckout();
  }
  // Replace the existing WhatsApp checkout button behavior without changing the core cart code.
  document.addEventListener('click',function(e){const btn=e.target.closest?.('button,a'); if(!btn)return; const label=(btn.textContent||'').toLowerCase(); if(label.includes('whatsapp checkout')||label.includes('checkout on whatsapp')){e.preventDefault(); e.stopImmediatePropagation(); window.sfhOpenCheckout();}},true);
})();
