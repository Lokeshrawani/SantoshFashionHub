import './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const app=initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-store-bridge'});
const db=getFirestore(app);
const KEY='sfh-products';
const SYNC_KEY='sfh-products-firebase-synced';
const U='https://images.unsplash.com/';
const PHOTOS={
  men:U+'photo-1768696082704-c4e5593d9f27?auto=format&fit=crop&w=1200&q=85',
  ladies:U+'photo-1692992193981-d3d92fabd9cb?auto=format&fit=crop&w=1200&q=85',
  kids:U+'photo-1744807561461-00bbe2419a65?auto=format&fit=crop&w=1200&q=85',
  jeans:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85',
  tshirt:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',
  shirt:U+'photo-1715865717728-298d1925e4c6?auto=format&fit=crop&w=1200&q=85',
  trouser:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
  jacket:U+'photo-1604534609306-00cdac972ad2?auto=format&fit=crop&w=1200&q=85',
  ethnic:U+'photo-1572470176170-98fa8abcb741?auto=format&fit=crop&w=1200&q=85',
  active:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
  inner:U+'photo-1774414489671-9f33b8dff0a9?auto=format&fit=crop&w=1200&q=85',
  accessories:U+'photo-1707400131124-a688ed508a95?auto=format&fit=crop&w=1200&q=85'
};
const PRODUCT_PHOTOS={M001:PHOTOS.tshirt,M002:PHOTOS.shirt,J001:PHOTOS.jeans,M003:PHOTOS.trouser,M004:PHOTOS.jacket,K001:PHOTOS.kids,K002:PHOTOS.kids,L001:PHOTOS.ladies,M005:PHOTOS.shirt,J002:PHOTOS.jeans,K003:PHOTOS.kids,L002:PHOTOS.ladies};
function applyRealPhotos(){
  let products=[];try{products=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){products=[]}
  if(Array.isArray(products)&&products.length){
    products=products.map(p=>{const img=PRODUCT_PHOTOS[p.id];if(!img)return p;return {...p,image:img,images:[img,...(Array.isArray(p.images)?p.images.filter(x=>x&&x!==img):[])].slice(0,5)}});
    localStorage.setItem(KEY,JSON.stringify(products));
  }
  const slots=[...document.querySelectorAll('.photoSlot')];
  const items=[
    ['Men’s Wear',PHOTOS.men],['Women’s Wear',PHOTOS.ladies],['Kids’ Wear',PHOTOS.kids],['Jeans',PHOTOS.jeans],
    ['T-Shirts',PHOTOS.tshirt],['Shirts',PHOTOS.shirt],['Trousers',PHOTOS.trouser],['Jackets',PHOTOS.jacket],
    ['Ethnic Wear',PHOTOS.ethnic],['Activewear',PHOTOS.active],['Innerwear',PHOTOS.inner],['Accessories',PHOTOS.accessories]
  ];
  slots.forEach((slot,i)=>{const [label,src]=items[i%items.length];slot.innerHTML=`<img class="sfh-real-photo" src="${src}" alt="${label} — Santosh Fashion Hub" loading="lazy" referrerpolicy="no-referrer"><span class="photoCaption">${label}</span>`});
  if(!document.getElementById('sfh-real-photo-css')){const s=document.createElement('style');s.id='sfh-real-photo-css';s.textContent='.photoSlot{position:relative!important;overflow:hidden!important;padding:0!important;min-height:210px!important;border:0!important;background:#111827!important;box-shadow:0 12px 35px rgba(11,16,32,.14)}.sfh-real-photo{width:100%;height:100%;min-height:210px;object-fit:cover;display:block;transition:transform .45s ease,filter .45s ease}.photoSlot:hover .sfh-real-photo{transform:scale(1.05);filter:saturate(1.08)}.photoSlot .photoCaption{position:absolute;left:8px;right:8px;bottom:8px;padding:9px 10px;border-radius:10px;color:#fff;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.78));font-size:12px;font-weight:900;text-align:center;backdrop-filter:blur(5px)}';document.head.appendChild(s)}
}
async function sync(){try{const snap=await getDocs(collection(db,'products'));if(snap.size){const products=snap.docs.map(d=>({id:d.id,...d.data()}));localStorage.setItem(KEY,JSON.stringify(products));if(sessionStorage.getItem(SYNC_KEY)!=='1'){sessionStorage.setItem(SYNC_KEY,'1');location.reload();return}}}catch(error){console.warn('Santosh Fashion Hub Firebase product sync skipped:',error)}applyRealPhotos();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(applyRealPhotos,80));else setTimeout(applyRealPhotos,80);
sync();
