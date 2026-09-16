/* Santosh Fashion Hub — default catalog photo bridge */
(function(){
  const PRODUCT_PHOTOS={
    M001:'assets/products/mens-premium-tshirt.svg',
    M002:'assets/products/mens-casual-shirt.svg',
    J001:'assets/products/mens-denim-jeans.svg',
    M003:'assets/products/mens-formal-trouser.svg',
    M004:'assets/products/mens-stylish-jacket.svg',
    K001:'assets/products/kids-trendy-wear.svg',
    K002:'assets/products/kids-tshirt.svg',
    L001:'assets/products/ladies-comfort-collection.svg',
    M005:'assets/products/mens-everyday-shirt.svg',
    J002:'assets/products/mens-comfort-denim.svg',
    K003:'assets/products/kids-casual-set.svg',
    L002:'assets/products/ladies-comfort-pack.svg'
  };
  const COLLECTION_PHOTOS=[
    ['Men','assets/products/mens-casual-shirt.svg','Men’s fashion'],
    ['Men','assets/products/mens-denim-jeans.svg','Men’s denim'],
    ['Men','assets/products/mens-stylish-jacket.svg','Men’s outerwear'],
    ['Men','assets/products/mens-formal-trouser.svg','Men’s formalwear'],
    ['Ladies','assets/products/ladies-comfort-collection.svg','Women’s collection'],
    ['Ladies','assets/products/ladies-comfort-pack.svg','Women’s essentials'],
    ['Kids','assets/products/kids-trendy-wear.svg','Kids fashion'],
    ['Kids','assets/products/kids-tshirt.svg','Kids T-shirts']
  ];
  function updateProductStorage(){
    let products=[];
    try{products=JSON.parse(localStorage.getItem('sfh-products')||'[]')}catch(e){products=[]}
    if(!Array.isArray(products)||!products.length)return false;
    let changed=false;
    products=products.map(p=>{
      if(!p||!p.id)return p;
      if(!p.image && PRODUCT_PHOTOS[p.id]){changed=true;return {...p,image:PRODUCT_PHOTOS[p.id]};}
      return p;
    });
    if(changed)localStorage.setItem('sfh-products',JSON.stringify(products));
    return changed;
  }
  function fillCollectionPhotos(){
    const slots=[...document.querySelectorAll('.photoSlot')];
    if(!slots.length)return;
    const imgs=COLLECTION_PHOTOS.map(x=>x[1]);
    slots.forEach((slot,i)=>{
      if(slot.dataset.sfhPhotoReady==='1')return;
      const src=imgs[i%imgs.length];
      const label=slot.textContent.replace(/📸|Add image later/g,'').trim()||'Fashion collection';
      slot.innerHTML=`<img src="${src}" alt="Santosh Fashion Hub fashion collection photo" loading="lazy"><span class="photoCaption">${label}</span>`;
      slot.dataset.sfhPhotoReady='1';
    });
    if(!document.getElementById('sfh-default-photo-css')){
      const st=document.createElement('style');st.id='sfh-default-photo-css';
      st.textContent='.photoSlot{position:relative;overflow:hidden;padding:0!important;min-height:190px!important;background:#f4f4f4}.photoSlot img{width:100%;height:100%;min-height:190px;object-fit:cover;display:block}.photoSlot .photoCaption{position:absolute;left:8px;right:8px;bottom:8px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.65);color:#fff;font-size:11px;font-weight:700;text-align:center}';
      document.head.appendChild(st);
    }
  }
  function load(){
    const changed=updateProductStorage();
    fillCollectionPhotos();
    if(changed && sessionStorage.getItem('sfh-default-photo-reloaded')!=='1'){
      sessionStorage.setItem('sfh-default-photo-reloaded','1');location.reload();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,30));else setTimeout(load,30);
})();