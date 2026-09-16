/* SFH_ADMIN_UI_FIX_V1 */
(function(){
  const add=()=>{
    const b=document.getElementById('addTop');
    if(b){b.click();return;}
    alert('Please sign in first with the admin account.');
  };
  const ready=()=>{
    const b=document.getElementById('addMain');
    if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',add)}
    document.querySelectorAll('.sfh-help-add').forEach(e=>e.hidden=false);
  };
  const style=document.createElement('style');
  style.textContent=`
    #addTop,#addMain{visibility:visible!important;opacity:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important}
    .sfh-help-add{margin:12px 0 18px;padding:14px 16px;border:1px solid #dfe3ea;border-radius:14px;background:#fff;color:#344054;font-size:13px;line-height:1.55}
    .sfh-help-add b{color:#0b1020}
    .photo img,.sfh-av-card img,.sfh-drop img,.sfh-logo-mark img{filter:none!important;backdrop-filter:none!important;image-rendering:auto!important}
    .sfh-admin-visual img,.sfh-photo-manager img{filter:none!important}
  `;
  document.head.appendChild(style);
  document.addEventListener('DOMContentLoaded',ready);
  setTimeout(ready,500);
  setTimeout(ready,1500);
})();
