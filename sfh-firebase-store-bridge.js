if(!window.SFH_FIREBASE_CONFIG)await import('./firebase-config.js');
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const app=getApps().find(a=>a.name==='sfh-store-bridge-v7')||initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-store-bridge-v7'});
const db=getFirestore(app);
const KEY='sfh-products';
const COLLECTION_KEY='sfh-collection-photos-v1';
const FINGERPRINT_KEY='sfh-products-firebase-fingerprint-v7';
const PHOTOS={
  men:'assets/products/mens-casual-shirt.svg',
  ladies:'assets/products/ladies-comfort-collection.svg',
  kids:'assets/products/kids-trendy-wear.svg',
  jeans:'assets/products/mens-denim-jeans.svg',
  tshirt:'assets/products/mens-premium-tshirt.svg',
  shirt:'assets/products/mens-everyday-shirt.svg',
  trouser:'assets/products/mens-formal-trouser.svg',
  jacket:'assets/products/mens-stylish-jacket.svg'
};
const PRODUCT_PHOTOS={M001:PHOTOS.tshirt,M002:PHOTOS.shirt,J001:PHOTOS.jeans,M003:PHOTOS.trouser,M004:PHOTOS.jacket,K001:PHOTOS.kids,K002:PHOTOS.kids,L001:PHOTOS.ladies,M005:PHOTOS.shirt,J002:PHOTOS.jeans,K003:'assets/products/kids-casual-set.svg',L002:'assets/products/ladies-comfort-pack.svg'};
const COLLECTION_PHOTOS={
  men:[[PHOTOS.men,'Smart casual'],[PHOTOS.jeans,'Everyday denim'],[PHOTOS.trouser,'Formal trousers'],[PHOTOS.jacket,'Modern layers']],
  women:[[PHOTOS.ladies,'Western styles'],['assets/products/ladies-comfort-pack.svg','Comfort essentials'],[PHOTOS.ladies,'Everyday collection'],['assets/products/ladies-comfort-pack.svg','Lifestyle & comfort']],
  kids:[[PHOTOS.kids,'Boys & girls'],['assets/products/kids-casual-set.svg','Playful styles'],['assets/products/kids-tshirt.svg','Little fashion'],[PHOTOS.kids,'Cute & comfy']],
  jeans:[[PHOTOS.jeans,'Classic denim'],['assets/products/mens-comfort-denim.svg','Relaxed fit'],[PHOTOS.jeans,'Casual street'],['assets/products/mens-denim-jeans.svg','Everyday denim']],
  tshirt:[[PHOTOS.tshirt,'Everyday tees'],[PHOTOS.tshirt,'Premium basics'],['assets/products/kids-tshirt.svg','Graphic styles'],[PHOTOS.tshirt,'Comfort fits']],
  shirt:[[PHOTOS.shirt,'Smart shirts'],[PHOTOS.shirt,'Formal edits'],[PHOTOS.shirt,'Casual checks'],[PHOTOS.shirt,'Weekend style']],
  trouser:[[PHOTOS.trouser,'Classic trousers'],[PHOTOS.trouser,'Chinos'],[PHOTOS.trouser,'Smart fits'],[PHOTOS.trouser,'Office ready']],
  jacket:[[PHOTOS.jacket,'Layering season'],[PHOTOS.jacket,'Modern jackets'],[PHOTOS.jacket,'Urban outerwear'],[PHOTOS.jacket,'Winter essentials']],
  ethnic:[[PHOTOS.men,'Festive styles'],[PHOTOS.men,'Traditional looks'],[PHOTOS.men,'Wedding edits'],[PHOTOS.men,'Elegant ethnic']],
  activewear:[[PHOTOS.tshirt,'Move easy'],[PHOTOS.tshirt,'Gym essentials'],[PHOTOS.tshirt,'Training wear'],[PHOTOS.tshirt,'Performance styles']],
  innerwear:[[PHOTOS.ladies,'Everyday comfort'],[PHOTOS.ladies,'Soft essentials'],[PHOTOS.ladies,'Loungewear'],[PHOTOS.ladies,'Relaxed basics']],
  accessories:[[PHOTOS.jacket,'Bags & wallets'],[PHOTOS.trouser,'Belts & small goods'],[PHOTOS.shirt,'Fashion accents'],[PHOTOS.jacket,'Finishing touches']]
};
const PORTALS={
  men:{label:"Men",key:'men',cat:'Men',icon:'👔',kicker:"01 • MEN'S WEAR",title:"Men's Fashion Portal",tag:'SHIRTS • T-SHIRTS • JEANS • JACKETS',items:['T-Shirts','Polos','Casual Shirts','Formal Shirts','Jeans','Trousers & Chinos','Jackets','Ethnic Wear','Activewear','Innerwear','Belts & Wallets']},
  women:{label:'Ladies / Women',key:'women',cat:'Ladies',icon:'👗',kicker:"02 • LADIES' / WOMEN'S WEAR",title:"Women's Fashion Portal",tag:'WESTERN • ETHNIC • LINGERIE • ACTIVEWEAR',items:['Tops & Tees','Dresses','Shirts & Blouses','Jeans & Jeggings','Sarees','Kurtas & Kurtis','Suit Sets','Lehengas','Activewear','Nightwear','Handbags & Jewellery']},
  kids:{label:'Kids',key:'kids',cat:'Kids',icon:'🧒',kicker:"03 • KIDS' WEAR",title:"Kids Fashion Portal",tag:'BOYS • GIRLS • INFANTS • NIGHTWEAR',items:['Boys T-Shirts','Girls Dresses','Shirts','Jeans & Trousers','Shorts','Ethnic Wear','Jackets & Sweaters','Infant Rompers','Clothing Sets','Nightwear']},
  jeans:{label:'Jeans',key:'jeans',cat:'Jeans',icon:'👖',kicker:'04 • JEANS',title:'Denim & Jeans Portal',tag:'SLIM • REGULAR • RELAXED • CARGO',items:['Slim Fit','Regular Fit','Relaxed Fit','Straight Fit','Cargo Jeans','Denim Shorts','Stretch Denim']},
  tshirt:{label:'T-Shirts',key:'tshirt',cat:'T-Shirt',icon:'👕',kicker:'05 • T-SHIRTS',title:'T-Shirt Portal',tag:'ROUND NECK • POLO • GRAPHIC • OVERSIZED',items:['Round Neck','Polo T-Shirts','Graphic T-Shirts','Oversized','Full Sleeve','Sports T-Shirts','Kids T-Shirts']},
  shirt:{label:'Shirts',key:'shirt',cat:'Shirt',icon:'👔',kicker:'06 • SHIRTS',title:'Shirt Portal',tag:'FORMAL • CASUAL • CHECKS • DENIM',items:['Formal Shirts','Casual Shirts','Check Shirts','Striped Shirts','Denim Shirts','Printed Shirts','Half Sleeve']},
  trouser:{label:'Trousers',key:'trouser',cat:'Trouser',icon:'👖',kicker:'07 • TROUSERS',title:'Trouser & Bottomwear Portal',tag:'FORMAL • CHINOS • CARGO • JOGGERS',items:['Formal Trousers','Chinos','Cargo Pants','Joggers','Track Pants','Shorts','Cotton Pants']},
  jacket:{label:'Jackets',key:'jacket',cat:'Jacket',icon:'🧥',kicker:'08 • JACKETS',title:'Jackets & Outerwear Portal',tag:'CASUAL • BOMBER • WINTER • BLAZERS',items:['Casual Jackets','Bomber Jackets','Denim Jackets','Winter Jackets','Blazers','Sweatshirts','Hoodies']},
  ethnic:{label:'Ethnic Wear',key:'ethnic',cat:'Ethnic',icon:'✨',kicker:'09 • ETHNIC WEAR',title:'Ethnic & Traditional Portal',tag:'KURTA • FESTIVE • WEDDING • TRADITIONAL',items:['Kurtas','Kurta Sets','Nehru Jackets','Sherwanis','Festive Wear','Wedding Wear','Traditional Styles']},
  activewear:{label:'Activewear',key:'activewear',cat:'Activewear',icon:'🏃',kicker:'10 • ACTIVEWEAR',title:'Activewear & Sports Portal',tag:'GYM • SPORTS • TRAINING • COMFORT',items:['Gym T-Shirts','Sports T-Shirts','Training Wear','Gym Shorts','Track Pants','Leggings','Tracksuits']},
  innerwear:{label:'Innerwear',key:'innerwear',cat:'Innerwear',icon:'🩳',kicker:'11 • INNERWEAR',title:'Innerwear & Loungewear Portal',tag:'VESTS • BOXERS • BRIEFS • PYJAMAS',items:['Vests','Briefs','Trunks','Boxers','Pyjamas','Nightwear','Loungewear']},
  accessories:{label:'Accessories',key:'accessories',cat:'Accessories',icon:'👜',kicker:'12 • ACCESSORIES',title:'Fashion Accessories Portal',tag:'BELTS • WALLETS • BAGS • ACCENTS',items:['Belts','Wallets','Bags','Caps','Socks','Jewellery','Scarves & Stoles']}
};
const PORTAL_KEYS=Object.keys(PORTALS);
function normalise(p,id){const images=Array.isArray(p.images)?p.images.filter(Boolean).slice(0,5):[];const image=p.image||images[0]||'';return {...p,id:String(p.id||id),group:p.group||p.cat||'Men',name:p.name||'New Product',price:Number(p.price)||0,old:Number(p.old)||0,stock:Number.isFinite(Number(p.stock))?Number(p.stock):0,sizes:Array.isArray(p.sizes)?p.sizes:[],images:image?[image,...images.filter(x=>x!==image)].slice(0,5):images,image};}
function applyRealPhotos(products){return products.map(p=>{const img=PRODUCT_PHOTOS[p.id];return img&&!p.image?{...p,image:img,images:[img,...(p.images||[]).filter(x=>x!==img)].slice(0,5)}:p})}
function readCustomPhotos(){try{return JSON.parse(localStorage.getItem(COLLECTION_KEY)||'{}')||{}}catch(e){return {}}}
function asFour(key,custom){const demos=COLLECTION_PHOTOS[key]||[];const raw=custom?.[key];const arr=Array.isArray(raw)?raw.filter(Boolean).slice(0,4):(raw?[raw]:[]);const out=[];for(let i=0;i<4;i++){const src=arr[i]||demos[i]?.[0];if(!src)continue;out.push([src,arr[i]?`Your uploaded photo • Photo ${i+1}`:(demos[i]?.[1]||`${key} fashion`)]);}return out.length?out:demos;}
function esc(s){return String(s??'').replace(/[&<>\\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','\"':'&quot;',"'":'&#39;'}[m]));}
function installStorePortalStyle(){if(document.getElementById('sfh-portal-style-v1'))return;const st=document.createElement('style');st.id='sfh-portal-style-v1';st.textContent=`
 #sfh-fashion-portals{margin:0 auto;padding:36px 24px 42px;max-width:1240px;scroll-margin-top:76px}
 .sfh-portal-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;margin-bottom:22px}
 .sfh-portal-head .eyebrow{display:inline-block;margin-bottom:5px}.sfh-portal-head h2{margin:0}.sfh-portal-head p{max-width:760px;margin:7px 0 0;line-height:1.65}
 .sfh-portal-menu{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:0 0 28px}
 .sfh-portal-menu button{appearance:none;border:1px solid #dfe3ea;background:#fff;border-radius:16px;padding:13px 10px;text-align:left;min-height:88px;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s;background-image:linear-gradient(145deg,#fff,#f8f9fb);font:inherit}
 .sfh-portal-menu button:hover,.sfh-portal-menu button.active{transform:translateY(-3px);border-color:#bcaaf4;box-shadow:0 12px 26px rgba(11,16,32,.10)}
 .sfh-portal-menu .picon{font-size:24px;display:block;margin-bottom:6px}.sfh-portal-menu b{display:block;font-size:12px}.sfh-portal-menu small{display:block;margin-top:3px;color:#667085;font-size:9px}
 .sfh-portal-card{border:1px solid #dfe3ea;border-radius:24px;background:linear-gradient(145deg,#ffffff,#f8f9fc);padding:18px;margin-top:18px;box-shadow:0 14px 38px rgba(11,16,32,.07);scroll-margin-top:88px}
 .sfh-portal-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.sfh-portal-card-head h3{margin:3px 0;font-size:23px}.sfh-portal-card-head .sfh-tag{padding:7px 10px;border-radius:999px;background:#f0edff;color:#4f36b7;font-size:9px;font-weight:950;letter-spacing:.5px}
 .sfh-portal-photos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-top:16px}.sfh-portal-photo{height:300px;position:relative;overflow:hidden;border:1px solid #dfe3ea;border-radius:17px;background:#eef1f6;box-shadow:0 10px 24px rgba(11,16,32,.08)}.sfh-portal-photo img.sfh-pp{width:100%;height:100%;display:block;object-fit:contain;padding:8px;transition:transform .35s}.sfh-portal-photo:hover img.sfh-pp{transform:scale(1.025)}.sfh-portal-photo:after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(11,16,32,0) 56%,rgba(11,16,32,.78) 100%)}.sfh-portal-photo .sfh-pp-caption{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;color:#fff;font-size:11px;font-weight:900;line-height:1.25}.sfh-portal-photo .sfh-pp-logo{position:absolute;z-index:3;top:10px;right:10px;width:72px;max-height:28px;object-fit:contain;padding:5px 7px;border-radius:8px;background:rgba(11,16,32,.72);backdrop-filter:blur(8px)}
 .sfh-portal-items{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.sfh-portal-items button{appearance:none;border:1px solid #dfe3ea;background:#fff;border-radius:999px;padding:8px 11px;font:inherit;font-size:10px;font-weight:800;cursor:pointer;color:#0b1020}.sfh-portal-items button:hover{border-color:#6548d8;background:#f6f3ff}.sfh-portal-cta{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:17px;padding-top:14px;border-top:1px solid #e6e8ee}.sfh-portal-cta span{font-size:10px;color:#667085}.sfh-portal-cta button{border:0;border-radius:10px;padding:9px 12px;background:#0b1020;color:#fff;font-weight:900;cursor:pointer}
 @media(max-width:980px){.sfh-portal-menu{grid-template-columns:repeat(4,1fr)}.sfh-portal-photos{grid-template-columns:repeat(2,1fr)}}
 @media(max-width:600px){#sfh-fashion-portals{padding:28px 14px 34px}.sfh-portal-menu{grid-template-columns:repeat(2,1fr)}.sfh-portal-photos{grid-template-columns:1fr}.sfh-portal-photo{height:390px}.sfh-portal-card-head h3{font-size:20px}}
 `;document.head.appendChild(st)}
function enhanceCollectionPhotos(){const blocks=[...document.querySelectorAll('.collectionBlock')],custom=readCustomPhotos();[['men',blocks[0]],['women',blocks[1]],['kids',blocks[2]]].forEach(([key,block])=>{if(!block)return;const slots=[...block.querySelectorAll('.photoSlot')];asFour(key,custom).forEach((item,i)=>{const slot=slots[i];if(!slot)return;const src=item[0],caption=item[1];const fallback=COLLECTION_PHOTOS[key]?.[i]?.[0]||'assets/logo.svg';slot.innerHTML=`<img class="sfh-photo" src="${esc(src)}" data-fallback-src="${esc(fallback)}" alt="${esc(caption)}" loading="lazy" decoding="async"><span class="photoCaption">${esc(caption)}</span><img class="sfh-brand-stamp" src="./assets/logo.svg" alt="Santosh Fashion Hub" loading="lazy" decoding="async">`;});});}
function enhanceCategoryRail(){const buttons=[...document.querySelectorAll('.categoryRail button')],custom=readCustomPhotos(),first=v=>Array.isArray(v)?v[0]:v;buttons.forEach(btn=>{const label=btn.querySelector('b')?.textContent?.trim();let key=label==='Ladies'?'women':label?.toLowerCase()==='t-shirts'?'tshirt':label?.toLowerCase()==='jackets'?'jacket':label?.toLowerCase();const srcKey=key==='women'?'women':key;let src=key&&COLLECTION_PHOTOS[srcKey]?.[0]?.[0];if(label==='Men'&&first(custom.men))src=first(custom.men);if(label==='Ladies'&&first(custom.women))src=first(custom.women);if(label==='Kids'&&first(custom.kids))src=first(custom.kids);if(!src||btn.querySelector('.sfh-cat-photo'))return;const img=document.createElement('img');img.className='sfh-cat-photo';img.src=src;img.dataset.fallbackSrc=COLLECTION_PHOTOS[srcKey]?.[0]?.[0]||'assets/logo.svg';img.alt=label+' fashion';img.loading='lazy';img.decoding='async';btn.insertBefore(img,btn.firstChild);btn.classList.add('sfh-live-category');});}
function renderPortalCard(portal,custom){const photos=asFour(portal.key,custom);return `<article class="sfh-portal-card" id="sfh-portal-${portal.key}"><div class="sfh-portal-card-head"><div><span class="eyebrow">${esc(portal.kicker)}</span><h3>${esc(portal.icon+' '+portal.title)}</h3></div><span class="sfh-tag">${esc(portal.tag)}</span></div><div class="sfh-portal-photos">${photos.map((p,i)=>`<div class="sfh-portal-photo"><img class="sfh-pp" src="${esc(p[0])}" alt="${esc(portal.label+' '+(i+1))}" loading="lazy"><img class="sfh-pp-logo" src="./assets/logo.svg" alt="Santosh Fashion Hub"><span class="sfh-pp-caption">${esc(p[1])}</span></div>`).join('')}</div><div class="sfh-portal-items">${portal.items.map(item=>`<button type="button" data-portal-cat="${esc(portal.cat)}">${esc(item)}</button>`).join('')}</div><div class="sfh-portal-cta"><span>📸 Photo Studio connected • Uploads from Admin appear here automatically</span><button type="button" data-portal-shop="${esc(portal.cat)}">Shop ${esc(portal.label)} →</button></div></article>`}
function installPortalHub(){if(document.getElementById('sfh-fashion-portals'))return;const categories=document.getElementById('categories');if(!categories)return;const sec=document.createElement('section');sec.id='sfh-fashion-portals';sec.innerHTML=`<div class="sfh-portal-head"><div><span class="eyebrow">ACTIVE FASHION PORTALS</span><h2>Choose Your Fashion Department</h2><p>Every department is now a live portal. Click a portal, browse its photo showcase, then jump straight to matching products.</p></div></div><div class="sfh-portal-menu">${PORTAL_KEYS.map(k=>{const p=PORTALS[k];return `<button type="button" data-open-portal="${k}"><span class="picon">${p.icon}</span><b>${esc(p.label)}</b><small>Open portal →</small></button>`}).join('')}</div><div class="sfh-portal-list">${PORTAL_KEYS.map(k=>renderPortalCard(PORTALS[k],readCustomPhotos())).join('')}</div>`;categories.parentNode.insertBefore(sec,categories.nextSibling);bindPortalHub(sec)}
function bindPortalHub(sec){const go=k=>{const target=document.getElementById('sfh-portal-'+k);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});sec.querySelectorAll('[data-open-portal]').forEach(x=>x.classList.toggle('active',x.dataset.openPortal===k))};sec.querySelectorAll('[data-open-portal]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.openPortal)));sec.querySelectorAll('[data-portal-shop],[data-portal-cat]').forEach(b=>b.addEventListener('click',()=>{const cat=b.dataset.portalShop||b.dataset.portalCat;try{if(typeof window.setCategory==='function')window.setCategory(cat)}catch(e){};document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'})}));}
function wireMainCategoryButtons(){
  const map={Men:'Men',Jeans:'Jeans',Kids:'Kids',Ladies:'Ladies',Jackets:'Jacket','T-Shirts':'T-Shirt'};
  document.querySelectorAll('.categoryRail button').forEach(btn=>{
    if(btn.dataset.sfhFilterWired)return;
    btn.dataset.sfhFilterWired='1';
    btn.addEventListener('click',()=>{
      const label=btn.querySelector('b')?.textContent?.trim();
      if(map[label]&&typeof window.setCategory==='function')window.setCategory(map[label]);
    });
  });
}
function renderFirebaseProducts(){
  const grid=document.getElementById('productGrid');if(!grid)return;
  let synced=[];try{synced=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){}
  if(!Array.isArray(synced)||!synced.length)return;
  if(Array.isArray(window.products))window.products=synced;
  if(typeof window.renderProducts==='function')window.renderProducts();
}
function makeFingerprint(snap){return snap.docs.map(d=>{const p=d.data()||{},images=Array.isArray(p.images)?p.images.join('|'):(p.image||'');return `${d.id}:${p.updatedAt?.toMillis?.()||0}:${p.price||0}:${p.stock||0}:${p.name||''}:${images}`}).sort().join('||')}
async function sync(){try{const snap=await getDocs(collection(db,'products'));let products=snap.docs.map(d=>normalise(d.data()||{},d.id));products=applyRealPhotos(products);localStorage.setItem(KEY,JSON.stringify(products));const fp=makeFingerprint(snap),old=sessionStorage.getItem(FINGERPRINT_KEY);sessionStorage.setItem(FINGERPRINT_KEY,fp);if(old!==null&&old!==fp){location.reload();return}renderFirebaseProducts()}catch(error){console.warn('Santosh Fashion Hub Firebase sync:',error);renderFirebaseProducts()}}
function start(){
  enhanceCollectionPhotos();
  enhanceCategoryRail();
  applyRealPhotosFromCache();
  renderFirebaseProducts();
  sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();