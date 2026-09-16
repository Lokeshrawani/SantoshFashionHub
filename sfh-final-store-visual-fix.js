/* SFH_FINAL_STORE_VISUAL_FIX_V1 */
(function(){
  const css=`
    img{filter:none!important;backdrop-filter:none!important}
    .header .brand img,.heroVisual>img,.categoryRail .sfh-cat-photo,.collectionPortal .sfh-photo,.sfh-portal-photo img{filter:none!important;backdrop-filter:none!important;transform:none!important;image-rendering:auto!important}
    .collectionPortal .sfh-photo,.sfh-portal-photo img{object-fit:contain!important;object-position:center center!important}
    .collectionPortal .photoSlot,.sfh-portal-photo{overflow:hidden!important}
  `;
  const s=document.createElement('style');s.id='sfh-final-store-visual-fix';s.textContent=css;document.head.appendChild(s);
  const clean=()=>document.querySelectorAll('img').forEach(im=>{im.style.filter='none';im.style.backdropFilter='none';});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
})();
