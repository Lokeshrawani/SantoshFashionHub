/* Santosh Fashion Hub — shared Cloudinary storefront adapter */
(function(){
  const fileCfg=window.SFH_CLOUDINARY||{};let localCfg={};
  try{localCfg=JSON.parse(localStorage.getItem('sfh-cloudinary-public')||'{}')}catch(e){}
  const C={...fileCfg,...localCfg};const labels=['front','left','right','back','detail'];
  function ready(){return !!(C.cloudName&&String(C.cloudName).trim())}
  function url(id,slot){if(!ready()||!id)return '';const safe=String(id).trim().replace(/[^A-Za-z0-9_-]/g,'');const s=labels[Number(slot)||0]||'front';return `https://res.cloudinary.com/${encodeURIComponent(String(C.cloudName).trim())}/image/upload/f_auto,q_auto/${C.folder||'sfh-products'}/${safe}/${s}.jpg`}
  function visual(p){const direct=typeof p.image==='string'&&/^https:\/\//i.test(p.image)?p.image:'';const u=direct||url(p.id,0);if(!u)return `<div class="art">${p.art||'👕'}</div>`;const alt=String(p.name||'Product').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return `<div class="cloudImageWrap"><img class="productPhoto cloudProductPhoto" src="${u}" alt="${alt}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="art cloudFallback">${p.art||'👕'}</div></div>`}
  const css=document.createElement('style');css.textContent='.cloudImageWrap{width:100%;height:100%;display:grid;place-items:center}.cloudImageWrap .cloudProductPhoto{width:100%!important;height:100%!important}.cloudFallback{display:none;width:100%;height:100%;place-items:center}.cloudImageWrap .cloudProductPhoto[style*="display: none"] + .cloudFallback{display:grid}';document.head.appendChild(css);
  window.sfhCloudinary={configured:ready(),url,visual,config:C};
  function rerender(){try{if(typeof window.renderProducts==='function')window.renderProducts()}catch(e){}try{if(typeof window.renderCart==='function')window.renderCart()}catch(e){}try{if(typeof window.renderWishlist==='function')window.renderWishlist()}catch(e){}}
  function install(){if(typeof window.productVisual==='function')window.productVisual=p=>visual(p);rerender()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
