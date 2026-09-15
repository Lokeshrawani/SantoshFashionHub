/* Santosh Fashion Hub - IndexedDB product photo bridge
   Product metadata remains in localStorage; product photos live in IndexedDB.
   This avoids the browser localStorage quota that caused photo 2/3 uploads to fail. */
(function(){
  const DB_NAME='sfh-gallery-db';
  const DB_VERSION=1;
  const STORE='photos';
  const META_KEY='sfh-products';
  let dbPromise=null;
  const objectUrls=new Set();

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'key'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB open failed'));
    });
    return dbPromise;
  }
  function key(productId,slot){return `${productId}:${slot}`}
  async function putPhoto(productId,slot,blob){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({key:key(productId,slot),productId,slot,blob,updated:Date.now()});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Photo save failed'));
    });
  }
  async function getPhoto(productId,slot){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key(productId,slot));
      req.onsuccess=()=>resolve(req.result?.blob||null);req.onerror=()=>reject(req.error);
    });
  }
  async function deletePhoto(productId,slot){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(key(productId,slot));
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }
  async function listPhotos(productId){
    const arr=[];
    for(let i=0;i<5;i++) arr[i]=await getPhoto(productId,i);
    return arr;
  }
  function cleanupUrls(){for(const u of objectUrls) URL.revokeObjectURL(u);objectUrls.clear()}
  function normalizeMeta(){
    let arr=[];try{arr=JSON.parse(localStorage.getItem(META_KEY)||'[]')}catch(e){arr=[]}
    if(!Array.isArray(arr))arr=[];
    arr=arr.map((p,i)=>{const x={...p};delete x.images;if(typeof x.image!=='string'||x.image.startsWith('blob:')||x.image.startsWith('data:')) delete x.image;return {...x,id:x.id||`P${i+1}`}});
    try{localStorage.setItem(META_KEY,JSON.stringify(arr))}catch(e){}
    return arr;
  }
  async function loadGallery(){
    if(!window.products||!Array.isArray(window.products)) return;
    cleanupUrls();
    for(const p of window.products){
      const blobs=await listPhotos(p.id);
      const urls=[];
      for(let i=0;i<blobs.length;i++){
        if(blobs[i]){const u=URL.createObjectURL(blobs[i]);objectUrls.add(u);urls[i]=u;}
      }
      p.images=urls.filter(Boolean);
      p.image=p.images[0]||'';
    }
    normalizeMeta();
    if(typeof window.renderProducts==='function') window.renderProducts();
    if(typeof window.renderWishlist==='function') window.renderWishlist();
    if(typeof window.renderCart==='function') window.renderCart();
  }
  function installStorageGuard(){
    const nativeSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      if(k===META_KEY){
        try{
          const arr=JSON.parse(v);if(Array.isArray(arr)){
            v=JSON.stringify(arr.map(p=>{const x={...p};delete x.images;if(typeof x.image==='string'&&(x.image.startsWith('blob:')||x.image.startsWith('data:')))delete x.image;return x;}));
          }
        }catch(e){}
      }
      return nativeSet.call(this,k,v);
    };
  }
  function installGlobalBridge(){
    window.SFH_IDB={putPhoto,getPhoto,deletePhoto,listPhotos,loadGallery};
    installStorageGuard();
    if(typeof window.productVisual==='function'){
      window.productVisual=function(p){return p?.image?`<img class="productPhoto" src="${p.image}" alt="${p.name||''}" loading="lazy">`:`<div class="art">${p?.art||'👕'}</div>`};
    }
    loadGallery().catch(console.error);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installGlobalBridge,{once:true});
  else installGlobalBridge();
})();