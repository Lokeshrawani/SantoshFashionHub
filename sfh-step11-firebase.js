/* Santosh Fashion Hub — Step 11: Firebase/Firestore bridge */
(function(){
  const cfg=window.SFH_FIREBASE_CONFIG;
  const configured=cfg && cfg.apiKey && !String(cfg.apiKey).startsWith('YOUR_') && cfg.projectId && !String(cfg.projectId).startsWith('YOUR_');
  window.SFH_FIREBASE={configured,ready:false,app:null,auth:null,db:null,user:null};
  if(!configured){console.info('SFH Firebase is not configured yet. Local mode remains active.');return;}

  function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  (async function(){
    try{
      await loadScript('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore-compat.js');
      const app=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);
      const auth=firebase.auth(),db=firebase.firestore();
      window.SFH_FIREBASE.app=app;window.SFH_FIREBASE.auth=auth;window.SFH_FIREBASE.db=db;
      auth.onAuthStateChanged(u=>{window.SFH_FIREBASE.user=u||null;document.dispatchEvent(new CustomEvent('sfh-firebase-auth',{detail:{user:u||null}}))});
      await auth.signInAnonymously();
      window.SFH_FIREBASE.ready=true;
      document.dispatchEvent(new Event('sfh-firebase-ready'));
      console.log('SFH Firebase connected');
    }catch(err){console.error('SFH Firebase init failed:',err);window.SFH_FIREBASE.error=err;}
  })();

  document.addEventListener('submit',async function(e){
    if(e.target?.id!=='sfhCheckoutForm'||!window.SFH_FIREBASE.ready||!window.SFH_FIREBASE.db)return;
    try{
      const items=(window.cart||[]).map(x=>{const p=(window.products||[]).find(y=>y.id===x.id);return p?{productId:p.id,name:p.name,size:x.size,qty:Number(x.qty||0),price:Number(p.price||0),lineTotal:Number(p.price||0)*Number(x.qty||0)}:null}).filter(Boolean);
      if(!items.length)return;
      const value=id=>document.getElementById(id)?.value.trim()||'';
      const order={
        orderId:'SFH-'+Date.now().toString(36).toUpperCase(),
        uid:window.SFH_FIREBASE.user?.uid||null,
        customer:{name:value('sfhName'),mobile:value('sfhMobile'),pin:value('sfhPin'),city:value('sfhCity'),address:value('sfhAddress')},
        payment:value('sfhPayment'),note:value('sfhNote'),items,
        subtotal:items.reduce((a,x)=>a+x.lineTotal,0),discount:Number(window.discount||0),
        status:'Pending',channel:'Website + WhatsApp',createdAt:firebase.firestore.FieldValue.serverTimestamp()
      };
      await window.SFH_FIREBASE.db.collection('orders').doc(order.orderId).set(order);
      localStorage.setItem('sfh-last-order-id',order.orderId);
      document.dispatchEvent(new CustomEvent('sfh-order-saved',{detail:order}));
    }catch(err){console.error('SFH order save failed:',err)}
  },true);
})();
