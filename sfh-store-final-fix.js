/* Santosh Fashion Hub — final storefront compatibility fix */
(()=>{
  'use strict';
  const PRODUCT_KEY='sfh-products';
  const getProducts=()=>{try{const p=JSON.parse(localStorage.getItem(PRODUCT_KEY)||'[]');return Array.isArray(p)?p:[]}catch(_){return[]}};
  const findProduct=id=>getProducts().find(p=>String(p.id)===String(id));
  const css=`
    /* Full-photo mode: never crop storefront/product images */
    .productVisual,.sfh-portal-photo,.photoSlot,.heroVisual,.shopImages img{overflow:hidden!important}
    .productVisual{background:#fff!important}
    .productPhoto,.productVisual img.productPhoto{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;display:block!important;object-fit:contain!important;object-position:center center!important;padding:10px!important;box-sizing:border-box!important;transform:none!important;filter:none!important;background:#fff!important}
    .sfh-portal-photo img.sfh-pp,.collectionBlock .photoSlot img.sfh-photo{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;display:block!important;object-fit:contain!important;object-position:center center!important;padding:8px!important;box-sizing:border-box!important;transform:none!important;filter:none!important;background:#fff!important}
    .sfh-portal-photo:hover img.sfh-pp,.collectionBlock .photoSlot:hover img.sfh-photo{transform:none!important;filter:none!important}
    .sfh-portal-photo:after,.photoSlot .photoCaption{pointer-events:none}
    .sfh-portal-card-head .sfh-tag{backdrop-filter:none!important;filter:none!important}
    .productInfo .priceRow{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important}
    .productInfo .priceRow>div{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
    .sfh-cart-actions{display:flex!important;gap:7px!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important}
    .sfh-cart-actions .add,.sfh-cart-actions .viewBtn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:40px!important;border:0!important;border-radius:10px!important;padding:9px 12px!important;font-weight:900!important;cursor:pointer!important;text-decoration:none!important;white-space:nowrap!important}
    .sfh-cart-actions .add{background:#0b1020!important;color:#fff!important}
    .sfh-cart-actions .viewBtn{background:#f4c95d!important;color:#17130a!important}
    .sfh-cart-actions .add:hover,.sfh-cart-actions .viewBtn:hover{transform:translateY(-1px)!important}
    .sfh-product-added{display:inline-block!important;margin-top:6px!important;font-size:10px!important;font-weight:900!important;color:#087443!important}
    @media(max-width:650px){.productPhoto{padding:8px!important}.sfh-cart-actions{width:100%!important}.sfh-cart-actions .add,.sfh-cart-actions .viewBtn{flex:1 1 120px!important}}
  `;
  const st=document.createElement('style');st.id='sfh-store-final-fix-style';st.textContent=css;document.head.appendChild(st);

  function extractId(btn){
    const attr=btn.getAttribute('onclick')||'';
    const m=attr.match(/quickView\(\s*['\"]([^'\"]+)['\"]\s*\)/);
    if(m)return m[1];
    const card=btn.closest('.product');
    const text=card?.querySelector('.productMeta span')?.textContent||'';
    const x=text.match(/•\s*([A-Za-z0-9_-]+)/); return x?x[1]:'';
  }

  function addButton(card,id){
    const row=card.querySelector('.priceRow'); if(!row)return;
    let wrap=row.querySelector('.sfh-cart-actions');
    if(!wrap){
      const old=row.querySelector('.add');
      wrap=document.createElement('div');wrap.className='sfh-cart-actions';
      if(old) old.parentNode.insertBefore(wrap,old); else row.appendChild(wrap);
      if(old) wrap.appendChild(old);
    }
    const view=wrap.querySelector('.add');
    if(view){view.classList.add('viewBtn');view.textContent='View Details';view.setAttribute('type','button')}
    if(!wrap.querySelector('.sfh-add-cart')){
      const b=document.createElement('button');b.type='button';b.className='add sfh-add-cart';b.textContent='Add to Cart';
      b.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const p=findProduct(id);
        if(!p){return}
        const qtyStock=Number(p.stock)||0;
        if(qtyStock<=0){if(typeof window.toast==='function')window.toast('Out of stock');return}
        const size=Array.isArray(p.sizes)&&p.sizes.length?p.sizes[0]:'M';
        if(typeof window.addToCart==='function'){
          window.addToCart(id,size,1);
          b.textContent='✓ Added';
          setTimeout(()=>b.textContent='Add to Cart',1400);
        }else if(typeof window.quickView==='function'){
          window.quickView(id);
        }
      });
      wrap.insertBefore(b,wrap.firstChild);
    }
  }

  function fixBrokenImage(img){
    if(img.dataset.sfhBrokenHandled)return;
    img.dataset.sfhBrokenHandled='1';
    img.addEventListener('error',()=>{
      const holder=img.parentElement; if(!holder)return;
      img.style.display='none';
      const existing=holder.querySelector('.sfh-img-fallback');
      if(!existing){const f=document.createElement('div');f.className='sfh-img-fallback';f.textContent='👕';f.style.cssText='width:100%;height:100%;display:grid;place-items:center;font-size:54px;background:#f4f5f8;color:#667085;';holder.appendChild(f)}
    },{once:true});
  }

  function fixProductGrid(){
    const grid=document.getElementById('productGrid'); if(!grid)return;
    grid.querySelectorAll('.product').forEach(card=>{
      const view=card.querySelector('.priceRow .add');
      const id=view?extractId(view):(card.querySelector('.productMeta span')?.textContent.match(/•\s*([A-Za-z0-9_-]+)/)||[])[1];
      if(id) addButton(card,id);
      card.querySelectorAll('img.productPhoto,.sfh-photo,.sfh-pp').forEach(fixBrokenImage);
    });
  }

  function fixCollectionText(){
    document.querySelectorAll('.collectionBlock .collectionHead .tag,.sfh-portal-card-head .sfh-tag').forEach(e=>{
      e.style.filter='none';
      e.style.backdropFilter='none';
      e.style.opacity='1';
      e.style.textShadow='none';
    });
  }

  const obs=new MutationObserver(()=>{fixProductGrid();fixCollectionText()});
  obs.observe(document.body,{subtree:true,childList:true});
  const boot=()=>{fixProductGrid();fixCollectionText()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350),{once:true});
  else setTimeout(boot,350);
  setInterval(boot,1200);
})();
