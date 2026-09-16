/* Santosh Fashion Hub — real fashion photo bridge */
(function(){
  const U='https://images.unsplash.com/';
  const P={
    men:U+'photo-1768696082704-c4e5593d9f27?auto=format&fit=crop&w=1200&q=85',
    ladies:U+'photo-1692992193981-d3d92fabd9cb?auto=format&fit=crop&w=1200&q=85',
    kids:U+'photo-1744807561461-00bbe2419a65?auto=format&fit=crop&w=1200&q=85',
    jeans:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85',
    tshirt:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',
    shirt:U+'photo-1715865717728-298d1925e4c6?auto=format&fit=crop&w=1200&q=85',
    trouser:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
    jacket:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',
    ethnic:U+'photo-1572470176170-98fa8abcb741?auto=format&fit=crop&w=1200&q=85',
    active:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
    inner:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
    accessories:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85'
  };
  const PRODUCT_PHOTOS={
    M001:P.tshirt,M002:P.shirt,J001:P.jeans,M003:P.trouser,M004:P.jacket,
    K001:P.kids,K002:P.kids,L001:P.ladies,M005:P.shirt,J002:P.jeans,
    K003:P.kids,L002:P.ladies
  };
  const COLLECTION_PHOTOS=[
    ['Men',P.men,'Men’s Wear'],['Ladies',P.ladies,'Women’s Wear'],['Kids',P.kids,'Kids’ Wear'],
    ['Jeans',P.jeans,'Jeans'],['T-Shirt',P.tshirt,'T-Shirts'],['Shirt',P.shirt,'Shirts'],
    ['Trouser',P.trouser,'Trousers'],['Jacket',P.jacket,'Jackets'],['Ethnic',P.ethnic,'Ethnic Wear'],
    ['Activewear',P.active,'Activewear'],['Innerwear',P.inner,'Innerwear'],['Accessories',P.accessories,'Accessories']
  ];
  function updateProductStorage(){
    let products=[];try{products=JSON.parse(localStorage.getItem('sfh-products')||'[]')}catch(e){products=[]}
    if(!Array.isArray(products)||!products.length)return false;
    let changed=false;
    products=products.map(p=>{if(!p||!p.id)return p;if(PRODUCT_PHOTOS[p.id]&&(!p.image||String(p.image).includes('assets/products/'))){changed=true;return {...p,image:PRODUCT_PHOTOS[p.id],images:[PRODUCT_PHOTOS[p.id],...(p.images||[]).filter(x=>x&&x!==PRODUCT_PHOTOS[p.id])].slice(0,5)}}return p});
    if(changed)localStorage.setItem('sfh-products',JSON.stringify(products));return changed;
  }
  function fillCollectionPhotos(){
    const slots=[...document.querySelectorAll('.photoSlot')];if(!slots.length)return;
    slots.forEach((slot,i)=>{if(slot.dataset.sfhPhotoReady==='1')return;const item=COLLECTION_PHOTOS[i%COLLECTION_PHOTOS.length];const src=item[1],fallback=item[2];const old=slot.textContent.replace(/📸|Add image later/g,'').trim();const label=old&&!/^\d+$/.test(old)?old:fallback;slot.innerHTML=`<img src="${src}" alt="${label} — Santosh Fashion Hub" loading="lazy" referrerpolicy="no-referrer"><span class="photoCaption">${label}</span>`;slot.dataset.sfhPhotoReady='1'});
    if(!document.getElementById('sfh-default-photo-css')){const st=document.createElement('style');st.id='sfh-default-photo-css';st.textContent='.photoSlot{position:relative;overflow:hidden;padding:0!important;min-height:210px!important;background:#eef0f4;border-radius:14px}.photoSlot img{width:100%;height:100%;min-height:210px;object-fit:cover;display:block;transition:transform .4s ease,filter .4s ease}.photoSlot:hover img{transform:scale(1.05);filter:saturate(1.05)}.photoSlot .photoCaption{position:absolute;left:9px;right:9px;bottom:9px;padding:8px 10px;border-radius:10px;background:linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.78));color:#fff;font-size:12px;font-weight:900;text-align:center;backdrop-filter:blur(6px)}';document.head.appendChild(st)}
  }
  function load(){const changed=updateProductStorage();fillCollectionPhotos();if(changed&&sessionStorage.getItem('sfh-default-photo-reloaded')!=='1'){sessionStorage.setItem('sfh-default-photo-reloaded','1');location.reload()}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,30));else setTimeout(load,30)
})();
