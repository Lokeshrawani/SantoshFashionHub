/* Santosh Fashion Hub — simple single-photo storefront bridge */
(function(){
  const KEY='sfh-single-images';
  function load(){
    let map={};
    try{map=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){map={}}
    if(!map||typeof map!=='object')return;
    if(!Array.isArray(window.products))return;
    let changed=false;
    window.products=window.products.map(p=>{
      const img=map[p.id];
      if(typeof img==='string'&&img.startsWith('data:image/')){changed=true;return {...p,image:img};}
      return p;
    });
    try{
      if(typeof window.productVisual==='function'){
        const old=window.productVisual;
        window.productVisual=function(p){const img=map[p.id]||p.image;if(img)return `<img class="productPhoto" src="${img}" alt="${String(p.name||'Product').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}" loading="lazy">`;return old(p)};
      }
    }catch(e){}
    try{if(typeof window.renderProducts==='function')window.renderProducts()}catch(e){}
    try{if(typeof window.renderCart==='function')window.renderCart()}catch(e){}
    try{if(typeof window.renderWishlist==='function')window.renderWishlist()}catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,20));else setTimeout(load,20);
})();
