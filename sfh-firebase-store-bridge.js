import './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const app=initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-store-bridge-v4'});
const db=getFirestore(app);
const KEY='sfh-products';
const FINGERPRINT_KEY='sfh-products-firebase-fingerprint-v4';
const U='https://images.unsplash.com/';
const PHOTOS={men:U+'photo-1768696082704-c4e5593d9f27?auto=format&fit=crop&w=1200&q=85',ladies:U+'photo-1692992193981-d3d92fabd9cb?auto=format&fit=crop&w=1200&q=85',kids:U+'photo-1744807561461-00bbe2419a65?auto=format&fit=crop&w=1200&q=85',jeans:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85',tshirt:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',shirt:U+'photo-1715865717728-298d1925e4c6?auto=format&fit=crop&w=1200&q=85',trouser:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',jacket:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',ethnic:U+'photo-1572470176170-98fa8abcb741?auto=format&fit=crop&w=1200&q=85',active:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',inner:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',accessories:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85'};
const PRODUCT_PHOTOS={M001:PHOTOS.tshirt,M002:PHOTOS.shirt,J001:PHOTOS.jeans,M003:PHOTOS.trouser,M004:PHOTOS.jacket,K001:PHOTOS.kids,K002:PHOTOS.kids,L001:PHOTOS.ladies,M005:PHOTOS.shirt,J002:PHOTOS.jeans,K003:PHOTOS.kids,L002:PHOTOS.ladies};

function normalise(p,id){
  const x={id:String(p?.id||id||''),cat:p?.cat||'T-Shirt',group:p?.group||p?.cat||'Men',name:p?.name||'New Product',price:Number(p?.price)||0,old:Number(p?.old)||0,tag:p?.tag||'NEW',desc:p?.desc||'',sizes:Array.isArray(p?.sizes)&&p.sizes.length?p.sizes:['M','L','XL'],stock:Number.isFinite(Number(p?.stock))?Number(p.stock):10,image:p?.image||'',images:Array.isArray(p?.images)?p.images.filter(Boolean).slice(0,5):[]};
  if(!x.image&&x.images[0])x.image=x.images[0];
  if(!x.images.length&&x.image)x.images=[x.image];
  return x;
}

function applyRealPhotos(products){
  const mapped=products.map(p=>{const img=PRODUCT_PHOTOS[p.id];if(!img||p.image||p.images?.length)return p;return {...p,image:img,images:[img]}});
  localStorage.setItem(KEY,JSON.stringify(mapped));
  const slots=[...document.querySelectorAll('.photoSlot')];
  const items=[['Men’s Wear',PHOTOS.men],['Women’s Wear',PHOTOS.ladies],['Kids’ Wear',PHOTOS.kids],['Jeans',PHOTOS.jeans],['T-Shirts',PHOTOS.tshirt],['Shirts',PHOTOS.shirt],['Trousers',PHOTOS.trouser],['Jackets',PHOTOS.jacket],['Ethnic Wear',PHOTOS.ethnic],['Activewear',PHOTOS.active],['Innerwear',PHOTOS.inner],['Accessories',PHOTOS.accessories]];
  slots.forEach((slot,i)=>{const [label,src]=items[i%items.length];slot.innerHTML=`<img class="sfh-real-photo" src="${src}" alt="${label} — Santosh Fashion Hub" loading="lazy" referrerpolicy="no-referrer"><span class="photoCaption">${label}</span>`});
  if(!document.getElementById('sfh-real-photo-css')){const s=document.createElement('style');s.id='sfh-real-photo-css';s.textContent='.photoSlot{position:relative!important;overflow:hidden!important;padding:0!important;min-height:210px!important;border:0!important;background:#111827!important;box-shadow:0 12px 35px rgba(11,16,32,.14)}.sfh-real-photo{width:100%;height:100%;min-height:210px;object-fit:cover;display:block}.photoSlot .photoCaption{position:absolute;left:8px;right:8px;bottom:8px;padding:9px 10px;border-radius:10px;color:#fff;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.78));font-size:12px;font-weight:900;text-align:center}';document.head.appendChild(s)}
  return mapped;
}

function makeFingerprint(snap){return snap.docs.map(d=>{const p=d.data()||{};const t=p.updatedAt?.toMillis?.()||0;const images=Array.isArray(p.images)?p.images.join('|'):(p.image||'');return `${d.id}:${t}:${p.price||0}:${p.stock??'missing'}:${p.name||''}:${images}`}).sort().join('||')}

async function sync(){
  try{
    const snap=await getDocs(collection(db,'products'));
    const firebaseProducts=snap.docs.map(d=>normalise(d.data(),d.id));
    let cached=[];try{cached=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){cached=[]}

    // Never replace working storefront data with an empty Firebase collection.
    // This prevents the public store from becoming "No products found" when
    // the admin collection is temporarily empty or not yet populated.
    const products=firebaseProducts.length?applyRealPhotos(firebaseProducts):cached;
    if(firebaseProducts.length)localStorage.setItem(KEY,JSON.stringify(products));

    const fingerprint=makeFingerprint(snap);
    const previous=sessionStorage.getItem(FINGERPRINT_KEY);
    sessionStorage.setItem(FINGERPRINT_KEY,fingerprint);

    window.dispatchEvent(new CustomEvent('sfh-firebase-products-updated',{detail:{products,source:firebaseProducts.length?'firebase':'cache'}}));

    // If Firebase has real products and they changed, reload once so the main
    // storefront script picks up the new localStorage snapshot.
    if(firebaseProducts.length&&previous!==null&&previous!==fingerprint){location.reload();return}
    if(firebaseProducts.length&&previous===null){location.reload();return}
  }catch(error){
    console.warn('Santosh Fashion Hub Firebase product sync skipped:',error);
    let cached=[];try{cached=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){cached=[]}
    if(Array.isArray(cached)&&cached.length)applyRealPhotos(cached);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{let c=[];try{c=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}applyRealPhotos(Array.isArray(c)?c:[])},80));
else setTimeout(()=>{let c=[];try{c=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}applyRealPhotos(Array.isArray(c)?c:[])},80);
sync();
