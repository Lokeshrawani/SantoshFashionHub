/* Santosh Fashion Hub — Step 5: Product Details & Buy Now */
(function(){
  const money = window.money || (n => '₹' + Number(n||0).toLocaleString('en-IN'));

  function discountPct(p){
    const old=Number(p.old||0), price=Number(p.price||0);
    return old>price ? Math.round((old-price)*100/old) : 0;
  }

  window.quickView = function(id){
    const p=(window.products||[]).find(x=>x.id===id);
    if(!p) return;
    const out=Number(p.stock)<=0;
    const sizes=Array.isArray(p.sizes)&&p.sizes.length?p.sizes:['Free Size'];
    const d=discountPct(p);
    const first=sizes[0];
    const image=p.image ? `<img class="productPhoto" src="${p.image}" alt="${p.name}">` : `<div class="art">${p.art||'👕'}</div>`;
    const wa=`https://wa.me/${window.PHONE||'919835567894'}?text=${encodeURIComponent('Hello Santosh Fashion Hub, I am interested in '+p.name+' ('+p.id+'). Please confirm size, stock, final price and delivery details.')}`;

    const c=document.getElementById('quickViewContent');
    c.innerHTML=`
      <div class="sfh-detail-grid">
        <div class="sfh-detail-image">${image}<div class="sfh-photo-badge">${p.tag||'PRODUCT'}</div></div>
        <div class="sfh-detail-info">
          <div class="productMeta"><span>${String(p.group||'').toUpperCase()} • ${p.id}</span><span>★★★★★</span></div>
          <h2>${p.name}</h2>
          <p class="sfh-description">${p.desc||'Quality fashion from Santosh Fashion Hub.'}</p>
          <div class="sfh-price"><strong>${money(p.price)}</strong>${p.old?`<span class="old">${money(p.old)}</span>`:''}${d?`<b>${d}% OFF</b>`:''}</div>
          <div class="sfh-stock ${out?'out':''}">${out?'🔴 Out of Stock':`🟢 In Stock • ${Number(p.stock)} available`}</div>
          ${out?'':`
          <div class="sfh-field"><label>Choose Size</label><div class="sizeBtns sfh-sizes">${sizes.map((s,i)=>`<button class="${i===0?'selected':''}" type="button" data-size="${s}" onclick="selectSize(this)">${s}</button>`).join('')}</div></div>
          <div class="sfh-field"><label>Quantity</label><div class="sfh-qty"><button type="button" onclick="sfhChangeDetailQty(-1)">−</button><strong id="sfhDetailQty">1</strong><button type="button" onclick="sfhChangeDetailQty(1)">+</button></div></div>
          <div class="sfh-actions">
            <button class="btn primary full" onclick="sfhAddDetailToCart('${p.id}')">🛒 Add to Cart</button>
            <button class="btn sfh-buy full" onclick="sfhBuyNow('${p.id}')">⚡ Buy Now</button>
          </div>
          `}
          <a class="btn outline full" style="margin-top:9px" target="_blank" rel="noopener" href="${wa}">💬 Ask on WhatsApp</a>
          <div class="sfh-meta-box"><span>Product ID</span><b>${p.id}</b><span>Category</span><b>${p.cat||p.group||'Fashion'}</b></div>
        </div>
      </div>`;

    window.__sfhDetail={id:p.id,size:first,qty:1};
    document.getElementById('quickView').classList.add('open');
  };

  window.selectSize=function(el){
    el.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));
    el.classList.add('selected');
    if(window.__sfhDetail) window.__sfhDetail.size=el.dataset.size;
  };

  window.sfhChangeDetailQty=function(delta){
    const p=(window.products||[]).find(x=>x.id===window.__sfhDetail?.id);
    if(!p) return;
    const max=Math.max(1,Number(p.stock)||1);
    window.__sfhDetail.qty=Math.min(max,Math.max(1,(window.__sfhDetail.qty||1)+delta));
    const e=document.getElementById('sfhDetailQty'); if(e)e.textContent=window.__sfhDetail.qty;
  };

  window.sfhAddDetailToCart=function(id){
    const d=window.__sfhDetail||{size:'M',qty:1};
    if(typeof window.addToCart==='function') window.addToCart(id,d.size,d.qty);
    if(typeof window.closeQuickView==='function') window.closeQuickView();
    if(typeof window.openCart==='function') window.openCart();
  };

  window.sfhBuyNow=function(id){
    const d=window.__sfhDetail||{size:'M',qty:1};
    const p=(window.products||[]).find(x=>x.id===id); if(!p) return;
    const total=Number(p.price||0)*Number(d.qty||1);
    const text=`Hello Santosh Fashion Hub 👋\n\n*Buy Now Request*\nProduct: ${p.name}\nProduct ID: ${p.id}\nSize: ${d.size}\nQuantity: ${d.qty}\nPrice: ${money(total)}\n\nPlease confirm final price, stock, shipping charge and payment/COD availability.`;
    window.open(`https://wa.me/${window.PHONE||'919835567894'}?text=${encodeURIComponent(text)}`,'_blank');
  };
})();
