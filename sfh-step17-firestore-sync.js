/* Santosh Fashion Hub — Step 17: Firestore Order Sync
   Works only when firebase-config.js contains real Firebase Web App config.
   Local storage remains the fallback when Firebase is not configured.
*/
(async function(){
  const CFG_READY=()=>{
    const c=window.SFH_FIREBASE_CONFIG;
    return c && Object.values(c).every(v=>typeof v==='string'&&v.trim()&&!/^YOUR_/i.test(v));
  };
  if(!CFG_READY()){
    window.SFH_FIRESTORE_STATUS='not-configured';
    return;
  }
  try{
    const {initializeApp,getApps,getApp}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
    const {getAuth,onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
    const {getFirestore,collection,addDoc,doc,getDoc,updateDoc,onSnapshot,serverTimestamp,query,orderBy}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const app=getApps().length?getApp():initializeApp(window.SFH_FIREBASE_CONFIG);
    const auth=getAuth(app); const db=getFirestore(app);
    window.SFH_FIRESTORE_STATUS='ready'; window.SFH_FIRESTORE_DB=db; window.SFH_FIREBASE_AUTH=auth;

    function localOrder(data,total){
      const id='SFH-'+Date.now().toString().slice(-8);
      const order={id,uid:auth.currentUser?.uid||'',customer:data.name,mobile:data.mobile,pin:data.pin,city:data.city,address:data.address,payment:data.payment,note:data.note||'',status:'Pending',total:Number(total||0),createdAt:new Date().toISOString(),items:(window.cart||[]).map(x=>{const p=(window.products||[]).find(y=>y.id===x.id);return p?{id:p.id,name:p.name,size:x.size,qty:Number(x.qty||1),price:Number(p.price||0),total:Number(p.price||0)*Number(x.qty||0)}:null}).filter(Boolean)};
      return order;
    }
    window.sfhCreateOrder=function(data,cartData){
      const order=localOrder(data,cartData?.total||0);
      try{localStorage.setItem('sfh-orders',JSON.stringify([order,...JSON.parse(localStorage.getItem('sfh-orders')||'[]')]));}catch(e){}
      if(auth.currentUser){
        addDoc(collection(db,'orders'),{...order,createdAt:serverTimestamp(),uid:auth.currentUser.uid}).then(ref=>{
          order.firestoreId=ref.id;
          try{
            const arr=JSON.parse(localStorage.getItem('sfh-orders')||'[]');
            const i=arr.findIndex(x=>x.id===order.id); if(i>=0){arr[i].firestoreId=ref.id;localStorage.setItem('sfh-orders',JSON.stringify(arr));}
          }catch(e){}
        }).catch(err=>{console.warn('SFH Firestore order sync failed:',err); window.SFH_FIRESTORE_STATUS='write-failed';});
      } else {
        window.SFH_FIRESTORE_STATUS='login-required';
      }
      return order;
    };

    window.sfhLoadMyOrders=async function(){
      if(!auth.currentUser)return [];
      const snap=await new Promise((resolve,reject)=>onSnapshot(query(collection(db,'orders'),orderBy('createdAt','desc')),resolve,reject));
      return snap.docs.filter(d=>d.data().uid===auth.currentUser.uid).map(d=>({firestoreId:d.id,...d.data()}));
    };

    window.sfhWatchOrder=async function(orderId,cb){
      const local=JSON.parse(localStorage.getItem('sfh-orders')||'[]');
      const found=local.find(o=>o.id===orderId); const firestoreId=found?.firestoreId;
      if(!firestoreId||!auth.currentUser)return ()=>{};
      return onSnapshot(doc(db,'orders',firestoreId),s=>{if(s.exists())cb({firestoreId:s.id,...s.data()});});
    };

    window.sfhAdminListOrders=async function(cb){
      if(!auth.currentUser)return ()=>{};
      return onSnapshot(query(collection(db,'orders'),orderBy('createdAt','desc')),snap=>cb(snap.docs.map(d=>({firestoreId:d.id,...d.data()}))));
    };
    window.sfhAdminUpdateOrder=async function(firestoreId,status){
      if(!auth.currentUser)throw new Error('Sign in required');
      await updateDoc(doc(db,'orders',firestoreId),{status,updatedAt:serverTimestamp()});
    };

    onAuthStateChanged(auth,u=>{window.SFH_FIRESTORE_USER=u||null;document.dispatchEvent(new CustomEvent('sfh-firestore-auth',{detail:{user:u}}));});
  }catch(e){
    console.warn('SFH Firestore sync unavailable:',e); window.SFH_FIRESTORE_STATUS='error';
  }
})();
