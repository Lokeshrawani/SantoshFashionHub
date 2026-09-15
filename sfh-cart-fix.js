/* Santosh Fashion Hub — reliable direct Add to Cart fix */
(function(){
  function getProducts(){ return Array.isArray(window.products) ? window.products : []; }
  function addDirect(id){
    const p=getProducts().find(x=>x.id===id);
    if(!p) return;
    const sizes=Array.isArray(p.sizes)&&p.sizes.length?p.sizes:['Free Size'];
    if(typeof window.addToCart==='function'){
      window.addToCart(id,sizes[0],1);
      if(typeof window.openCart==='function') window.openCart();
    } else {
      // Safe fallback when the main script is unavailable.
      const cart=JSON.parse(localStorage.getItem('sfh-cart')||'[]');
      const item=cart.find(x=>x.id===id&&x.size===sizes[0]);
      if(item)item.qty=(item.qty||1)+1;else cart.push({id,size:sizes[0],qty:1});
      localStorage.setItem('sfh-cart',JSON.stringify(cart));
      const badge=document.getElementById('cartCount');
      if(badge) badge.textContent=cart.reduce((a,x)=>a+Number(x.qty||1),0);
      alert(p.name+' added to cart');
    }
  }
  function upgrade(){
    document.querySelectorAll('.product').forEach(card=>{
      const view=card.querySelector('.add');
      if(!view || card.querySelector('.sfh-direct-add')) return;
      const id=(view.getAttribute('onclick')||'').match(/quickView\('([^']+)'\)/)?.[1];
      if(!id) return;
      const btn=document.createElement('button');
      btn.className='sfh-direct-add btn primary';
      btn.type='button';
      btn.textContent='🛒 Add to Cart';
      btn.onclick=function(e){e.preventDefault();addDirect(id)};
      view.parentElement.appendChild(btn);
    });
  }
  const oldRender=window.renderProducts;
  if(typeof oldRender==='function'){
    window.renderProducts=function(){ oldRender(); setTimeout(upgrade,0); };
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(upgrade,100));
  setTimeout(upgrade,500);
})();
