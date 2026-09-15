/* Santosh Fashion Hub — Step 13: Central Firestore Orders bridge */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

(function(){
  let auth=null, db=null, currentUser=null, ready=false;

  function isConfigReady(c){return c && Object.values(c).every(v=>typeof v==='string'&&v.trim()&&!/^YOUR_/i.test(v));}
  async function boot(){
    try{
      await import('./firebase-config.js');
      const cfg=window.SFH_FIREBASE_CONFIG;
      if(!isConfigReady(cfg)) return;
      const app=initializeApp(cfg);
      auth=getAuth(app); db=getFirestore(app); ready=true;
      onAuthStateChanged(auth,u=>{currentUser=u||null; window.dispatchEvent(new CustomEvent('sfh-auth-ready',{detail:{user:currentUser}}));});
    }catch(e){console.warn('SFH Firebase bridge not ready:',e.message);}
  }

  window.sfhFirebaseOrderStatus=function(){
    return {ready, signedIn:!!currentUser, uid:currentUser?.uid||null, email:currentUser?.email||null};
  };

  window.sfhCreateOrder=async function(customer,cart){
    if(!ready || !db || !currentUser) return null;
    const cleanItems=(cart?.items||[]).map(x=>({
      productId:String(x.p.id||''),
      name:String(x.p.name||''),
      size:String(x.size||''),
      qty:Number(x.qty||0),
      unitPrice:Number(x.p.price||0),
      lineTotal:Number(x.p.price||0)*Number(x.qty||0)
    }));
    const total=Number(cart?.total||0);
    const ref=await addDoc(collection(db,'orders'),{
      uid:currentUser.uid,
      customerEmail:currentUser.email||'',
      customer:{
        name:String(customer?.name||''),
        mobile:String(customer?.mobile||''),
        pin:String(customer?.pin||''),
        city:String(customer?.city||''),
        address:String(customer?.address||''),
        payment:String(customer?.payment||''),
        note:String(customer?.note||'')
      },
      items:cleanItems,
      subtotal:Number(cart?.subtotal||0),
      discount:Number(cart?.discount||0),
      total,
      status:'Pending',
      source:'website',
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
    return {id:ref.id};
  };

  boot();
})();
