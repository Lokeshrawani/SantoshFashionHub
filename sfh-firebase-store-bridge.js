import './firebase-config.js';
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const app=getApps().find(a=>a.name==='sfh-store-bridge-v4')||initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-store-bridge-v4'});
const db=getFirestore(app);
const KEY='sfh-products';
const FINGERPRINT_KEY='sfh-products-firebase-fingerprint-v4';
const U='https://images.unsplash.com/';
const PHOTOS={men:U+'photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1200&q=88',ladies:U+'photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=88',kids:U+'photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=1200&q=88',jeans:U+'photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=88',tshirt:U+'photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=88',shirt:U+'photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=88',jacket:U+'photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=88'};
const PRODUCT_PHOTOS={M001:PHOTOS.tshirt,M002:PHOTOS.shirt,J001:PHOTOS.jeans,M003:PHOTOS.trouser||PHOTOS.men,M004:PHOTOS.jacket,K001:PHOTOS.kids,K002:PHOTOS.kids,L001:PHOTOS.ladies,M005:PHOTOS.shirt,J002:PHOTOS.jeans,K003:PHOTOS.kids,L002:PHOTOS.ladies};

const COLLECTION_PHOTOS={
  men:[
    [U+'photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1200&q=88','Smart casual'],
    [U+'photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1200&q=88','Everyday shirts'],
    [U+'photo-1488161628813-04466f872be2?auto=format&fit=crop&w=1200&q=88','Modern layers'],
    [U+'photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=88','Street & active']
  ],
  women:[
    [U+'photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=88','Western styles'],
    [U+'photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=88','Elegant looks'],
    [U+'photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=88','Everyday fashion'],
    [U+'photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=88','Comfort & activewear']
  ],
  kids:[
    [U+'photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=88','Boys & girls'],
    [U+'photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=1200&q=88','Playful styles'],
    [U+'photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=88','Little fashion'],
    [U+'photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1200&q=88','Cute & comfy']
  ]
};

const CATEGORY_PHOTOS={
  Men:PHOTOS.men,
  Jeans:PHOTOS.jeans,
  Kids:COLLECTION_PHOTOS.kids[1][0],
  Ladies:PHOTOS.ladies,
  Jacket:PHOTOS.jacket,
  'T-Shirt':PHOTOS.tshirt
};

function normalise(p,id){const images=Array.isArray(p.images)?p.images.filter(Boolean).slice(0,5):[];const image=p.image||images[0]||'';return {...p,id:String(p.id||id),group:p.group||p.cat||'Men',name:p.name||'New Product',price:Number(p.price)||0,old:Number(p.old)||0,stock:Number.isFinite(Number(p.stock))?Number(p.stock):0,sizes:Array.isArray(p.sizes)?p.sizes:[],images:image?[image,...images.filter(x=>x!==image)].slice(0,5):images,image};}
function applyRealPhotos(products){return products.map(p=>{const img=PRODUCT_PHOTOS[p.id];return img&&!p.image?{...p,image:img,images:[img,...(p.images||[]).filter(x=>x!==img)].slice(0,5)}:p})}
function esc(s){return String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}

function enhanceCollectionPhotos(){
  const blocks=[...document.querySelectorAll('.collectionBlock')];
  const groups=[['men',blocks[0]],['women',blocks[1]],['kids',blocks[2]]];
  groups.forEach(([key,block])=>{
    if(!block)return;
    const slots=[...block.querySelectorAll('.photoSlot')];
    (COLLECTION_PHOTOS[key]||[]).forEach(([src,caption],i)=>{
      const slot=slots[i];
      if(!slot)return;
      slot.dataset.enhanced='true';
      slot.innerHTML=`<img class="sfh-photo" src="${src}" alt="${caption}" loading="lazy"><span class="photoCaption">${caption}</span>`;
    });
  });
}

function enhanceCategoryRail(){
  const buttons=[...document.querySelectorAll('.categoryRail button')];
  buttons.forEach(btn=>{
    const label=btn.querySelector('b')?.textContent?.trim();
    const src=CATEGORY_PHOTOS[label];
    if(!src||btn.querySelector('.sfh-cat-photo'))return;
    const img=document.createElement('img');
    img.className='sfh-cat-photo';
    img.src=src;
    img.alt=label+' fashion';
    img.loading='lazy';
    btn.insertBefore(img,btn.firstChild);
  });
}

function renderFirebaseProducts(){
  const grid=document.getElementById('productGrid');if(!grid)return;
  let products=[];try{products=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){products=[]}
  if(!Array.isArray(products)||!products.length)return;
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  const chips=[...document.querySelectorAll('.chip')];const active=chips.find(x=>x.classList.contains('active'));const cat=active?.dataset.cat||'All';
  const list=products.filter(p=>(cat==='All'||p.cat===cat||p.group===cat)&&(!q||`${p.name||''} ${p.id||''} ${p.cat||''} ${p.group||''}`.toLowerCase().includes(q)));
  grid.innerHTML=list.map(p=>{const out=Number(p.stock)<=0;const img=p.image||(p.images||[])[0]||'';return `<article class="product"><div class="productVisual"><span class="tag">${esc(p.tag||'NEW')}</span><button class="wish" onclick="toggleWish('${esc(p.id)}')">♡</button>${img?`<img class="productPhoto" src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="art">👕</div>`}</div><div class="productInfo"><div class="productMeta"><span>${esc(String(p.group||p.cat||'FASHION').toUpperCase())} • ${esc(p.id)}</span><span>${out?'OUT OF STOCK':'★★★★★'}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.desc||'Santosh Fashion Hub product.')}</p><div class="priceRow"><div><strong>₹${Number(p.price||0).toLocaleString('en-IN')}</strong>${Number(p.old)>0?`<span class="old">₹${Number(p.old).toLocaleString('en-IN')}</span>`:''}</div><button class="add" onclick="quickView('${esc(p.id)}')">View +</button></div></div></article>`}).join('');
  const empty=document.getElementById('emptyState');if(empty)empty.classList.toggle('hidden',list.length>0);
}

function makeFingerprint(snap){return snap.docs.map(d=>{const p=d.data()||{};const images=Array.isArray(p.images)?p.images.join('|'):(p.image||'');return `${d.id}:${p.updatedAt?.toMillis?.()||0}:${p.price||0}:${p.stock||0}:${p.name||''}:${images}`}).sort().join('||')}
async function sync(){
  try{
    const snap=await getDocs(collection(db,'products'));
    let products=snap.docs.map(d=>normalise(d.data()||{},d.id));
    products=applyRealPhotos(products);
    localStorage.setItem(KEY,JSON.stringify(products));
    const fp=makeFingerprint(snap);const old=sessionStorage.getItem(FINGERPRINT_KEY);sessionStorage.setItem(FINGERPRINT_KEY,fp);
    if(old!==null&&old!==fp){location.reload();return;}
    renderFirebaseProducts();
  }catch(error){console.warn('Santosh Fashion Hub Firebase sync:',error);renderFirebaseProducts();}
}

function start(){
  setTimeout(()=>{
    enhanceCollectionPhotos();
    enhanceCategoryRail();
    applyRealPhotosFromCache();
    renderFirebaseProducts();
    sync();
  },150);
}
function applyRealPhotosFromCache(){try{const p=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(p)&&p.length)localStorage.setItem(KEY,JSON.stringify(applyRealPhotos(p)))}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();