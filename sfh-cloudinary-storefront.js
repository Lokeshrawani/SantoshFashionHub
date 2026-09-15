/* Santosh Fashion Hub — shared Cloudinary storefront adapter
 * Uses deterministic public IDs so product photos uploaded from the admin
 * are visible to every visitor. No API secret is used in the browser.
 */
(function(){
  const C=window.SFH_CLOUDINARY||{};
  const labels=['front','left','right','back','detail'];
  function ready(){return !!(C.cloudName&&C.cloudName.trim());}
  function url(id,slot){
    if(!ready()||!id)return '';
    const safe=String(id).trim().replace(/[^A-Za-z0-9_-]/g,'');
    const s=labels[Number(slot)||0]||'front';
    return `https://res.cloudinary.com/${encodeURIComponent(C.cloudName.trim())}/image/upload/f_auto,q_auto/${C.folder||'sfh-products'}/${safe}/${s}.jpg`;
  }
  function visual(p){
    const u=url(p.id,0);
    if(!u)return `<div class="art">${p.art||'👕'}</div>`;
    const alt=String(p.name||'Product').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="cloudImageWrap"><img class="productPhoto cloudProductPhoto" src="${u}" alt="${alt}" loading="lazy" onerror="this.remove()"><div class="art cloudFallback">${p.art||'👕'}</div></div>`;
  }
  window.sfhCloudinary={configured:ready,url,visual};
  function rerender(){
    try{ if(typeof window.renderProducts==='function') window.renderProducts(); }catch(e){console.warn(e)}
    try{ if(typeof window.renderCart==='function') window.renderCart(); }catch(e){console.warn(e)}
    try{ if(typeof window.renderWishlist==='function') window.renderWishlist(); }catch(e){console.warn(e)}
  }
  function install(){
    if(typeof window.productVisual==='function') window.productVisual=function(p){return visual(p);};
    rerender();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0)); else setTimeout(install,0);
})();
