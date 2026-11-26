/* SFH_MAIN_SCRIPT_SINGLETON_V1 */
if(window.__SFH_MAIN_SCRIPT_LOADED__){throw new Error('SFH main script already loaded; duplicate script tag ignored.');}
window.__SFH_MAIN_SCRIPT_LOADED__=true;

const PHONE='919835567894';
const DEFAULT_PRODUCTS=[
{id:'M001',cat:'T-Shirt',group:'Men',name:"Men's Premium T-Shirt",price:499,old:699,art:'👕',tag:'BESTSELLER',desc:'Soft everyday style with multiple sizes & varieties.',sizes:['M','L','XL','XXL'],stock:10,image:'assets/products/mens-premium-tshirt.svg'},
{id:'M002',cat:'Men',group:'Men',name:"Men's Casual Shirt",price:699,old:899,art:'👔',tag:'POPULAR',desc:'Smart casual shirt for daily and weekend wear.',sizes:['M','L','XL','XXL'],stock:10,image:'assets/products/mens-casual-shirt.svg'},
{id:'J001',cat:'Jeans',group:'Men',name:"Men's Denim Jeans",price:999,old:1299,art:'👖',tag:'TRENDING',desc:'Everyday denim with comfortable, stylish fits.',sizes:['30','32','34','36','38'],stock:10,image:'assets/products/mens-denim-jeans.svg'},
{id:'M003',cat:'Men',group:'Men',name:"Men's Formal Trouser",price:799,old:999,art:'👖',tag:'SMART',desc:'Clean formal look for office and occasions.',sizes:['30','32','34','36','38'],stock:10,image:'assets/products/mens-formal-trouser.svg'},
{id:'M004',cat:'Jacket',group:'Men',name:"Men's Stylish Jacket",price:1299,old:1699,art:'🧥',tag:'NEW',desc:'Season-ready outer layer with a modern look.',sizes:['M','L','XL','XXL'],stock:10,image:'assets/products/mens-stylish-jacket.svg'},
{id:'K001',cat:'Kids',group:'Kids',name:'Kids Trendy Wear',price:599,old:799,art:'🧒',tag:'KIDS PICK',desc:'Comfortable and fun styles for growing kids.',sizes:['24','26','28','30'],stock:10,image:'assets/products/kids-trendy-wear.svg'},
{id:'K002',cat:'T-Shirt',group:'Kids',name:"Kids T-Shirt",price:399,old:549,art:'👕',tag:'VALUE',desc:'Easy everyday T-shirt in multiple sizes.',sizes:['24','26','28','30'],stock:10,image:'assets/products/kids-tshirt.svg'},
{id:'L001',cat:'Ladies',group:'Ladies',name:'Ladies Innerwear Collection',price:299,old:399,art:'🩷',tag:'COMFORT',desc:'Comfort-focused collection with size options.',sizes:['S','M','L','XL','XXL'],stock:10,image:'assets/products/ladies-comfort-collection.svg'},
{id:'M005',cat:'Men',group:'Men',name:"Men's Everyday Shirt",price:649,old:849,art:'👔',tag:'VALUE',desc:'Versatile shirt for work and everyday wear.',sizes:['M','L','XL','XXL'],stock:10,image:'assets/products/mens-everyday-shirt.svg'},
{id:'J002',cat:'Jeans',group:'Men',name:"Men's Comfort Denim",price:1099,old:1399,art:'👖',tag:'NEW',desc:'Comfort fit denim for long days.',sizes:['30','32','34','36','38'],stock:10,image:'assets/products/mens-comfort-denim.svg'},
{id:'K003',cat:'Kids',group:'Kids',name:'Kids Casual Set',price:749,old:999,art:'🧒',tag:'POPULAR',desc:'Easy casual set for play and outings.',sizes:['24','26','28','30'],stock:10,image:'assets/products/kids-casual-set.svg'},
{id:'L002',cat:'Ladies',group:'Ladies',name:'Ladies Comfort Pack',price:349,old:449,art:'🩷',tag:'VALUE',desc:'Comfort-focused everyday innerwear selection.',sizes:['S','M','L','XL','XXL'],stock:10,image:'assets/products/ladies-comfort-pack.svg'}
];
function readStoredJSON(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value===null?fallback:value}catch(_){return fallback}}
let products=readStoredJSON('sfh-products',null);
if(!Array.isArray(products)||!products.length){products=DEFAULT_PRODUCTS;try{localStorage.setItem('sfh-products',JSON.stringify(products))}catch(_){}}
const defaultById=new Map(DEFAULT_PRODUCTS.map(p=>[p.id,p]));
products=products.map((p,i)=>{const base=defaultById.get(p.id)||{};return {stock:10,image:'',...base,...p,id:p.id||base.id||`P${i+1}`,image:(typeof p.image==='string'&&p.image.trim())?p.image:(base.image||'')}});
let cart=readStoredJSON('sfh-cart',[]);if(!Array.isArray(cart))cart=[];
let wishlist=readStoredJSON('sfh-wishlist',[]);if(!Array.isArray(wishlist))wishlist=[];
let category='All',search='';let discount=0;
Object.defineProperties(window,{
  products:{configurable:true,get:()=>products,set:value=>{if(Array.isArray(value))products=value}},
  cart:{configurable:true,get:()=>cart,set:value=>{if(Array.isArray(value))cart=value}},
  wishlist:{configurable:true,get:()=>wishlist,set:value=>{if(Array.isArray(value))wishlist=value}},
  discount:{configurable:true,get:()=>discount,set:value=>{discount=Number(value)||0}}
});
window.PHONE=PHONE;
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
function save(){localStorage.setItem('sfh-products',JSON.stringify(products));localStorage.setItem('sfh-cart',JSON.stringify(cart));localStorage.setItem('sfh-wishlist',JSON.stringify(wishlist));updateCounts()}
function updateCounts(){const n=cart.reduce((a,x)=>a+Number(x.qty||0),0),w=wishlist.length;document.querySelectorAll('#cartCount,#cartTitleCount,#mobileCartCount,#drawerCount').forEach(e=>e.textContent=n);document.querySelectorAll('#wishCount,#wishTitleCount,#wishDrawerCount').forEach(e=>e.textContent=w)}
const LOCAL_PRODUCT_IMAGES={M001:'assets/products/mens-premium-tshirt.svg',M002:'assets/products/mens-casual-shirt.svg',J001:'assets/products/mens-denim-jeans.svg',M003:'assets/products/mens-formal-trouser.svg',M004:'assets/products/mens-stylish-jacket.svg',K001:'assets/products/kids-trendy-wear.svg',K002:'assets/products/kids-tshirt.svg',L001:'assets/products/ladies-comfort-collection.svg',M005:'assets/products/mens-everyday-shirt.svg',J002:'assets/products/mens-comfort-denim.svg',K003:'assets/products/kids-casual-set.svg',L002:'assets/products/ladies-comfort-pack.svg'};
function escapeAttr(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function productVisual(p){const fallback=LOCAL_PRODUCT_IMAGES[p.id]||'';const src=p.image||fallback;if(!src)return `<div class="art">${p.art||'👕'}</div>`;return `<img class="productPhoto" src="${escapeAttr(src)}" data-fallback-src="${escapeAttr(fallback)}" alt="${escapeAttr(p.name||'Fashion product')}" loading="lazy" decoding="async">`}
function renderProducts(){
  const list=products.filter(p=>
    Number(p.stock)>0&&
    (category==='All'||p.cat===category||p.group===category)&&
    ((p.name+' '+p.id+' '+p.cat+' '+p.group).toLowerCase().includes(search))
  );
  const sort=document.getElementById('sortSelect')?.value;
  if(sort==='low')list.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  if(sort==='high')list.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
  if(sort==='name')list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  const grid=document.getElementById('productGrid');
  if(!grid)return;
  grid.innerHTML=list.map(p=>{
    const id=String(p.id||'').replace(/[^A-Za-z0-9_-]/g,'');
    const price=Number(p.price)||0;
    const old=Number(p.old)||0;
    const discountPct=old>price&&old>0?Math.round((old-price)*100/old):0;
    const categoryLabel=String(p.cat||p.group||'FASHION');
    return `<article class="product" data-product-id="${escapeAttr(id)}">
      <div class="productVisual">
        <span class="tag">${escapeAttr(p.tag||'STYLE PICK')}</span>
        <button class="wish ${wishlist.includes(p.id)?'active':''}" type="button" aria-label="${wishlist.includes(p.id)?'Remove from':'Add to'} wishlist: ${escapeAttr(p.name)}" onclick="toggleWish('${id}')">${wishlist.includes(p.id)?'♥':'♡'}</button>
        ${productVisual(p)}
      </div>
      <div class="productInfo">
        <div class="productMeta"><span>${escapeAttr(categoryLabel)}</span><span>${escapeAttr(id)}</span></div>
        <h3>${escapeAttr(p.name||'Fashion favourite')}</h3>
        <p>${escapeAttr(p.desc||'A thoughtful pick from Santosh Fashion Hub.')}</p>
        <div class="priceRow">
          <div><strong>${money(price)}</strong>${old>price?`<span class="old">${money(old)}</span>`:''}${discountPct?`<span class="sfh-discount">${discountPct}% OFF</span>`:''}</div>
          <button class="add" type="button" aria-label="View details for ${escapeAttr(p.name)}" onclick="quickView('${id}')">Quick view <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </article>`;
  }).join('');
  const count=document.getElementById('sfhProductCount');
  if(count)count.textContent=`${list.length} ${list.length===1?'style':'styles'} to explore`;
  const empty=document.getElementById('emptyState');
  if(empty)empty.classList.toggle('hidden',list.length>0);
}
function setCategory(c){
  category=c;
  document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.cat===c));
  document.querySelectorAll('[data-sfh-category]').forEach(x=>x.classList.toggle('active',x.dataset.sfhCategory===c));
  document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});
  renderProducts();
}
window.renderProducts=renderProducts;
window.setCategory=setCategory;
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>setCategory(b.dataset.cat)));
document.querySelectorAll('[data-sfh-category]').forEach(b=>b.addEventListener('click',()=>setCategory(b.dataset.sfhCategory)));
document.getElementById('searchInput').addEventListener('input',e=>{search=e.target.value.toLowerCase().trim();renderProducts()});
document.getElementById('clearSearch').addEventListener('click',()=>{document.getElementById('searchInput').value='';search='';renderProducts()});
document.getElementById('sortSelect').addEventListener('change',renderProducts);
function resetFilters(){
  category='All';search='';
  document.getElementById('searchInput').value='';
  document.getElementById('sortSelect').value='featured';
  document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset.cat==='All'));
  document.querySelectorAll('[data-sfh-category]').forEach(x=>x.classList.remove('active'));
  renderProducts();
}
function toggleWish(id){wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];save();renderProducts();renderWishlist();toast(wishlist.includes(id)?'Added to wishlist ♥':'Removed from wishlist')}
function openWishlist(){renderWishlist();document.getElementById('wishlistDrawer')?.classList.add('open');document.getElementById('overlay')?.classList.add('open')}
function closeWishlist(){document.getElementById('wishlistDrawer')?.classList.remove('open');if(!document.getElementById('cartDrawer')?.classList.contains('open'))document.getElementById('overlay')?.classList.remove('open')}
function renderWishlist(){const box=document.getElementById('wishItems');if(!box)return;const arr=products.filter(p=>wishlist.includes(p.id)&&Number(p.stock)>0);box.innerHTML=arr.length?arr.map(p=>`<div class="wishCard"><div class="miniArt">${productVisual(p)}</div><div><h4>${p.name}</h4><small>${money(p.price)} • ${p.id}</small><br><button onclick="quickView('${p.id}')">View product</button></div><button onclick="toggleWish('${p.id}')">Remove</button></div>`).join(''):'<div class="empty"><div>♡</div><h3>Your wishlist is empty</h3><p>Tap ♡ on any product to save it.</p></div>'}
function addToCart(id,size='M',qty=1){const p=products.find(x=>x.id===id);if(!p)return;if(Number(p.stock)<=0){toast('Out of stock');return}let item=cart.find(x=>x.id===id&&x.size===size);if(item){if(item.qty+qty>Number(p.stock)){toast(`Only ${p.stock} available`);return}item.qty+=qty}else cart.push({id,size,qty:Math.min(qty,Number(p.stock))});save();renderCart();toast(p.name+' added to cart');}
function changeQty(id,size,delta){const i=cart.findIndex(x=>x.id===id&&x.size===size);if(i<0)return;const p=products.find(y=>y.id===id);if(!p||Number(p.stock)<=0){cart.splice(i,1);save();renderCart();return}cart[i].qty=Math.min(Number(p.stock),cart[i].qty+delta);if(cart[i].qty<=0)cart.splice(i,1);save();renderCart()}
function removeItem(id,size){cart=cart.filter(x=>!(x.id===id&&x.size===size));save();renderCart();toast('Item removed')}
function renderCart(){const box=document.getElementById('cartItems');if(!box)return;cart=cart.filter(x=>{const p=products.find(y=>y.id===x.id);return p&&Number(p.stock)>0});if(!cart.length){box.innerHTML='<div class="empty"><div>🛒</div><h3>Your cart is empty</h3><p>Add a few products and come back here.</p></div>';document.getElementById('cartTotal').textContent='₹0';save();return}let sub=0;box.innerHTML=cart.map(x=>{const p=products.find(y=>y.id===x.id);x.qty=Math.min(x.qty,Number(p.stock));sub+=p.price*x.qty;return `<div class="cartItem"><div class="miniArt">${productVisual(p)}</div><div><h4>${p.name}</h4><small>${p.id} • Size ${x.size} • ${money(p.price)} • Stock ${p.stock}</small><div class="qty"><button onclick="changeQty('${x.id}','${x.size}',-1)">−</button><b>${x.qty}</b><button onclick="changeQty('${x.id}','${x.size}',1)">+</button><button class="remove" onclick="removeItem('${x.id}','${x.size}')">Remove</button></div></div><b>${money(p.price*x.qty)}</b></div>`}).join('');const total=Math.max(0,sub-discount);document.getElementById('cartTotal').textContent=money(total);save()}
function openCart(){renderCart();document.getElementById('cartDrawer').classList.add('open');document.getElementById('overlay').classList.add('open')};function closeCart(){document.getElementById('cartDrawer').classList.remove('open');if(!document.getElementById('wishlistDrawer').classList.contains('open'))document.getElementById('overlay').classList.remove('open')};function closeAllPanels(){closeCart();closeWishlist();closeQuickView()}
function quickView(id){const p=products.find(x=>x.id===id);if(!p)return;const out=Number(p.stock)<=0;document.getElementById('quickViewContent').innerHTML=`<div class="quickGrid"><div class="quickArt">${productVisual(p,true)}</div><div class="quickInfo"><div class="productMeta"><span>${p.group.toUpperCase()} • ${p.id}</span><span>★★★★★</span></div><h2>${p.name}</h2><p>${p.desc}</p><h3>${money(p.price)} <span class="old">${money(p.old)}</span></h3>${out?'<p><strong>🔴 Out of Stock</strong></p>':'<><b>Choose size</b><div class="sizeBtns">'+p.sizes.map((s,i)=>`<button class="${i===0?'selected':''}" data-size="${s}" onclick="selectSize(this)">${s}</button>`).join('')+'</div></>'}<button class="btn primary full" ${out?'disabled':''} onclick="addQuickToCart('${p.id}')">${out?'Out of Stock':'Add to Cart'}</button><a class="btn outline full" style="margin-top:8px" target="_blank" href="https://wa.me/${PHONE}?text=${encodeURIComponent('Hello Santosh Fashion Hub, I am interested in '+p.name+' ('+p.id+'). Please share available sizes, price and delivery details.')}">💬 Ask on WhatsApp</a></div></div>`;document.getElementById('quickView').classList.add('open')}
function selectSize(el){el.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));el.classList.add('selected')};function addQuickToCart(id){const s=document.querySelector('#quickView .sizeBtns .selected')?.dataset.size||'M';addToCart(id,s,1);closeQuickView();openCart()};function closeQuickView(){document.getElementById('quickView')?.classList.remove('open')}function closeQuick(){closeQuickView()}
function applyCoupon(){const c=document.getElementById('coupon').value.trim().toUpperCase();if(c==='WELCOME10'){discount=50;toast('WELCOME10 applied: ₹50 demo discount');renderCart()}else{discount=0;toast('Demo coupon: try WELCOME10')}}
function checkoutWhatsApp(){if(!cart.length){toast('Your cart is empty');return}let lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `${p.id} - ${p.name} | Size: ${x.size} | Qty: ${x.qty} | ${money(p.price*x.qty)}`});let total=cart.reduce((a,x)=>a+products.find(p=>p.id===x.id).price*x.qty,0)-discount;const text=`Hello Santosh Fashion Hub 👋%0A%0A*New Shopping Order*%0A${encodeURIComponent(lines.join('\\n'))}%0A%0A*Estimated Total:* ${encodeURIComponent(money(total))}%0A%0APlease confirm stock, final price, shipping charge and payment/COD availability.`;window.open(`https://wa.me/${PHONE}?text=${text}`,'_blank')}
function sendEnquiry(e){e.preventDefault();const n=document.getElementById('enqName').value.trim(),p=document.getElementById('enqPhone').value.trim(),pin=document.getElementById('enqPin').value.trim()||'Not provided',m=document.getElementById('enqMessage').value.trim();const text=`Hello Santosh Fashion Hub 👋%0A%0A*Shopping Enquiry*%0AName: ${encodeURIComponent(n)}%0AMobile: ${encodeURIComponent(p)}%0APIN: ${encodeURIComponent(pin)}%0ARequirement: ${encodeURIComponent(m)}`;window.open(`https://wa.me/${PHONE}?text=${text}`,'_blank')}
function toast(t){const e=document.getElementById('toast');if(!e){console.info(t);return}e.textContent=t;e.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('show'),2200)}
updateCounts();renderProducts();renderCart();

(function injectCollectionReadabilityFix(){const css=`
.collectionHead{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;overflow:visible}
.collectionHead>div{min-width:0;flex:1 1 300px}
.collectionHead .tag{position:static;display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere;word-break:normal;line-height:1.5;flex:0 1 360px;text-align:center}
.collectionBlock{position:relative;overflow:visible}
.collectionBlock .collectionHead{padding:0 2px}
.collectionBlock .eyebrow,.collectionBlock h3,.collectionBlock .tag,.collectionGroup h4,.collectionGroup li{opacity:1!important;filter:none!important;text-shadow:none!important}
@media(max-width:800px){.collectionHead>div{flex-basis:100%}.collectionHead .tag{width:100%;flex-basis:100%;text-align:left;margin-top:4px}}
@media(max-width:520px){.collectionHead{display:block}.collectionHead .tag{margin-top:9px;font-size:11px;padding:7px 9px}.collectionBlock{padding:18px}.collectionBlock .collectionHead h3{font-size:22px}}
`;const style=document.createElement('style');style.id='sfh-readability-fix';style.textContent=css;document.head.appendChild(style)})();

(function initSubcategoryProductLinks(){
  const groups=[...document.querySelectorAll('.collectionGroup')];
  const clean=s=>s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const rules=[
    [/t shirts?|tees?|polos?/,'T-Shirt'],[/jeans|jegging/,'Jeans'],[/jackets?|blazers?|sweaters?|hoodies?|sweatshirts?/,'Jacket'],[/shirts?/,'Men'],[/trousers?|chinos?|pants?|shorts?|joggers?/,'Men'],[/innerwear|vests?|briefs?|trunks?|boxers?|panties|bras|lingerie|nightwear|loungewear|underwear/,'Ladies'],[/dresses?|frocks?|tops?/,'Ladies'],[/kids|boys|girls|infants|toddlers|baby/,'Kids'],[/ethnic|kurta|kurtis|sarees?|lehengas?|sherwanis?|nehru/,'Men'],[/sports|activewear|gym|tracksuits?|leggings?|tights?/,'Kids'],[/accessories|belts?|wallets?|ties?|caps?|socks?|handbags?|jewellery|scarves?/,'All']
  ];
  function targetFor(label,groupName){
    const t=clean(label);
    for(const [rx,val] of rules){if(rx.test(t)) return val==='All'?(clean(groupName)==='womens collection'?'Ladies':clean(groupName)==='kids collection'?'Kids':'Men'):val}
    const g=clean(groupName);return g.includes('women')||g.includes('ladies')?'Ladies':g.includes('kids')?'Kids':'Men';
  }
  groups.forEach(g=>{
    const groupName=g.closest('.collectionBlock')?.querySelector('h3')?.textContent||'Men';
    g.querySelectorAll('li').forEach(li=>{
      li.setAttribute('role','button');li.tabIndex=0;li.dataset.subcategory=li.textContent.trim();li.title='View matching products and stock';
      const go=()=>{const val=targetFor(li.dataset.subcategory,groupName);setCategory(val);document.querySelectorAll('.collectionGroup li').forEach(x=>x.classList.remove('sfh-sub-active'));li.classList.add('sfh-sub-active');toast('Showing '+li.dataset.subcategory+' • '+val+' products')};
      li.addEventListener('click',go);li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})
    });
  });
  const css=document.createElement('style');css.textContent=`.collectionGroup li{cursor:pointer;transition:transform .15s,opacity .15s}.collectionGroup li:hover,.collectionGroup li:focus{opacity:1;transform:translateX(3px)}.collectionGroup li.sfh-sub-active{font-weight:900;text-decoration:underline;text-underline-offset:4px}`;document.head.appendChild(css);
})();

/* SFH_MULTI_PHOTO_GALLERY_V1 */
(function initSfhMultiPhotoGallery(){
  const maxPhotos=5;
  const sfhImages=p=>{const a=Array.isArray(p?.images)?p.images.filter(Boolean).slice(0,maxPhotos):[];if(!a.length&&p?.image)a.push(p.image);return a};
  const esc=s=>String(s??'').replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[m]));
  const css=`.sfhGallery{display:flex;flex-direction:column;gap:10px;height:100%;min-height:360px}.sfhGalleryMain{position:relative;flex:1;min-height:300px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.035);display:flex;align-items:center;justify-content:center}.sfhGalleryMain img{width:100%;height:100%;object-fit:contain;display:block}.sfhGalleryNav{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 10px;pointer-events:none}.sfhGalleryNav button{pointer-events:auto;width:42px;height:42px;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(8,12,24,.78);color:#fff;font-size:24px;cursor:pointer;backdrop-filter:blur(5px)}.sfhGalleryCounter{position:absolute;right:12px;top:12px;padding:6px 10px;border-radius:999px;background:rgba(8,12,24,.78);font-size:12px;font-weight:800}.sfhGalleryThumbs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.sfhGalleryThumb{aspect-ratio:1/1;border:1px solid rgba(255,255,255,.12);border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);cursor:pointer;padding:0}.sfhGalleryThumb img{width:100%;height:100%;object-fit:cover;display:block}.sfhGalleryThumb.active{outline:2px solid currentColor;outline-offset:1px}.sfhGalleryHint{font-size:11px;opacity:.72;text-align:center;margin-top:-2px}@media(max-width:700px){.sfhGallery{min-height:260px}.sfhGalleryMain{min-height:230px}.sfhGalleryNav button{width:38px;height:38px;font-size:21px}}`;
  if(!document.getElementById('sfh-multi-photo-css')){const st=document.createElement('style');st.id='sfh-multi-photo-css';st.textContent=css;document.head.appendChild(st)}
  function renderGallery(p){const imgs=sfhImages(p);if(!imgs.length)return `<div class="sfhGallery"><div class="sfhGalleryMain"><div class="art">${p.art||'👕'}</div></div></div>`;return `<div class="sfhGallery" data-gallery-id="${esc(p.id)}" data-gallery-index="0"><div class="sfhGalleryMain"><img id="sfhGalleryMainImg" src="${esc(imgs[0])}" alt="${esc(p.name)} - Front view" loading="eager">${imgs.length>1?`<div class="sfhGalleryNav"><button aria-label="Previous photo" onclick="sfhGalleryPrev()">‹</button><button aria-label="Next photo" onclick="sfhGalleryNext()">›</button></div>`:''}<div class="sfhGalleryCounter"><span id="sfhGalleryPos">1</span> / ${imgs.length}</div></div>${imgs.length>1?`<div class="sfhGalleryThumbs">${imgs.map((src,i)=>`<button class="sfhGalleryThumb ${i===0?'active':''}" data-idx="${i}" onclick="sfhGalleryGo(${i})"><img src="${esc(src)}" alt="${esc(p.name)} photo ${i+1}" loading="lazy"></button>`).join('')}</div><div class="sfhGalleryHint">Front • Left • Right • Back • Detail</div>`:''}</div>`}
  window.sfhGalleryGo=function(index){const g=document.querySelector('#quickView .sfhGallery');if(!g)return;const p=products.find(x=>x.id===g.dataset.galleryId);const imgs=sfhImages(p);if(!imgs.length)return;const i=Math.max(0,Math.min(Number(index)||0,imgs.length-1));g.dataset.galleryIndex=i;const img=g.querySelector('#sfhGalleryMainImg');if(img){img.src=imgs[i];img.alt=`${p.name} - Photo ${i+1}`}const pos=g.querySelector('#sfhGalleryPos');if(pos)pos.textContent=String(i+1);g.querySelectorAll('.sfhGalleryThumb').forEach((b,n)=>b.classList.toggle('active',n===i))};
  window.sfhGalleryPrev=function(){const g=document.querySelector('#quickView .sfhGallery');if(!g)return;const p=products.find(x=>x.id===g.dataset.galleryId);const n=sfhImages(p).length;const cur=Number(g.dataset.galleryIndex)||0;if(n)sfhGalleryGo(cur<=0?n-1:cur-1)};
  window.sfhGalleryNext=function(){const g=document.querySelector('#quickView .sfhGallery');if(!g)return;const p=products.find(x=>x.id===g.dataset.galleryId);const n=sfhImages(p).length;const cur=Number(g.dataset.galleryIndex)||0;if(n)sfhGalleryGo((cur+1)%n)};
  window.quickView=function(id){const p=products.find(x=>x.id===id);if(!p)return;const out=Number(p.stock)<=0;document.getElementById('quickViewContent').innerHTML=`<div class="quickGrid"><div class="quickArt">${renderGallery(p)}</div><div class="quickInfo"><div class="productMeta"><span>${p.group.toUpperCase()} • ${p.id}</span><span>★★★★★</span></div><h2>${p.name}</h2><p>${p.desc}</p><h3>${money(p.price)} <span class="old">${money(p.old)}</span></h3>${out?'<p><strong>🔴 Out of Stock</strong></p>':'<><b>Choose size</b><div class="sizeBtns">'+p.sizes.map((s,i)=>`<button class="${i===0?'selected':''}" data-size="${s}" onclick="selectSize(this)">${s}</button>`).join('')+'</div></>'}<button class="btn primary full" ${out?'disabled':''} onclick="addQuickToCart('${p.id}')">${out?'Out of Stock':'Add to Cart'}</button><a class="btn outline full" style="margin-top:8px" target="_blank" href="https://wa.me/${PHONE}?text=${encodeURIComponent('Hello Santosh Fashion Hub, I am interested in '+p.name+' ('+p.id+'). Please share available sizes, price and delivery details.')}">💬 Ask on WhatsApp</a></div></div>`;document.getElementById('quickView').classList.add('open')};
})();
/* SFH_FIREBASE_STORE_BRIDGE */
// Firebase storefront sync is loaded lazily after the first page paint from index.html.
