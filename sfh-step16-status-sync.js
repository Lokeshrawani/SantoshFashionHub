/* Santosh Fashion Hub — Step 16: Customer Order Status Sync */
(function(){
  const KEY='sfh-orders';
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
  function get(id){return read().find(o=>o.id===id)||null;}
  function renderOne(host,o){
    if(!host||!o)return;
    const status=o.status||'Pending';
    const steps=['Pending','Confirmed','Shipped','Delivered'];
    const active=status==='Cancelled'?0:Math.max(0,steps.indexOf(status));
    host.innerHTML=`<div class="sfh16-status-sync"><div class="sfh16-current">Current status: <strong>${status}</strong>${o.updatedAt?`<small>Updated ${new Date(o.updatedAt).toLocaleString('en-IN')}</small>`:''}</div><div class="sfh16-track">${steps.map((s,i)=>`<div class="sfh16-step ${i<=active&&status!=='Cancelled'?'on':''}"><span>${i+1}</span><b>${s}</b></div>`).join('')}</div>${status==='Cancelled'?'<div class="sfh16-cancel">⚠️ This order has been cancelled.</div>':''}</div>`;
  }
  window.sfh16GetOrderStatus=get;
  window.sfh16WatchOrder=function(id,host){const target=host||document.getElementById('sfh16Status');const update=()=>{const o=get(id);if(o)renderOne(target,o);};update();window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)update();});setInterval(update,2000);};
  window.sfh16RefreshAll=function(){document.querySelectorAll('[data-sfh-order-id]').forEach(el=>{const o=get(el.dataset.sfhOrderId);if(o)renderOne(el,o);});};
  window.addEventListener('storage',window.sfh16RefreshAll);
})();
