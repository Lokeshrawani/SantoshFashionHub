/* Santosh Fashion Hub — Step 3: subcategory → product/stock connection
 * Mobile-friendly product filtering driven by the existing browser product catalog.
 */
(function(){
  const RULES = {
    'T-Shirts':{group:'Men', test:p=>/t-?shirt|tee|polo/i.test(p.name+' '+p.cat)},
    'Polos':{group:'Men', test:p=>/polo/i.test(p.name+' '+p.desc)},
    'Casual Shirts':{group:'Men', test:p=>/casual shirt|everyday shirt/i.test(p.name+' '+p.desc)},
    'Formal Shirts':{group:'Men', test:p=>/formal shirt/i.test(p.name+' '+p.desc)},
    'Sweatshirts & Hoodies':{group:'Men', test:p=>/sweatshirt|hoodie/i.test(p.name+' '+p.desc)},
    'Jackets':{group:'Men', test:p=>/jacket/i.test(p.name+' '+p.cat)},
    'Blazers & Suits':{group:'Men', test:p=>/blazer|suit/i.test(p.name+' '+p.desc)},
    'Jeans':{group:'Men', test:p=>p.cat==='Jeans'||/jeans|denim/i.test(p.name+' '+p.desc)},
    'Trousers & Chinos':{group:'Men', test:p=>/trouser|chino|pant/i.test(p.name+' '+p.desc)},
    'Casual Shorts':{group:'Men', test:p=>/short/i.test(p.name+' '+p.desc)},
    'Track Pants & Joggers':{group:'Men', test:p=>/track|jogger/i.test(p.name+' '+p.desc)},
    'Kurtas & Kurta Sets':{group:'Men', test:p=>/kurta/i.test(p.name+' '+p.desc)},
    'Nehru Jackets':{group:'Men', test:p=>/nehru/i.test(p.name+' '+p.desc)},
    'Sherwanis':{group:'Men', test:p=>/sherwani/i.test(p.name+' '+p.desc)},
    'Sports T-Shirts':{group:'Men', test:p=>/sport|gym|active/i.test(p.name+' '+p.desc)&&/shirt|tee/i.test(p.name+' '+p.desc)},
    'Gym Shorts':{group:'Men', test:p=>/gym.*short|short.*gym/i.test(p.name+' '+p.desc)},
    'Tracksuits':{group:'Men', test:p=>/tracksuit/i.test(p.name+' '+p.desc)},
    'Vests':{group:'Men', test:p=>/vest/i.test(p.name+' '+p.desc)},
    'Briefs & Trunks':{group:'Men', test:p=>/brief|trunk/i.test(p.name+' '+p.desc)},
    'Boxers':{group:'Men', test:p=>/boxer/i.test(p.name+' '+p.desc)},
    'Pyjama Sets':{group:'Men', test:p=>/pyjama|pajama/i.test(p.name+' '+p.desc)},
    'Belts':{group:'Men', test:p=>/belt/i.test(p.name+' '+p.desc)},
    'Wallets':{group:'Men', test:p=>/wallet|purse/i.test(p.name+' '+p.desc)},
    'Ties & Pocket Squares':{group:'Men', test:p=>/tie|pocket square/i.test(p.name+' '+p.desc)},
    'Caps & Socks':{group:'Men', test:p=>/cap|sock/i.test(p.name+' '+p.desc)},
    'Tops & Tees':{group:'Ladies', test:p=>/top|tee/i.test(p.name+' '+p.desc)},
    'Dresses & Jumpsuits':{group:'Ladies', test:p=>/dress|jumpsuit/i.test(p.name+' '+p.desc)},
    'Shirts & Blouses':{group:'Ladies', test:p=>/blouse|shirt/i.test(p.name+' '+p.desc)},
    'Jeans & Jeggings':{group:'Ladies', test:p=>/jean|jegging/i.test(p.name+' '+p.desc)},
    'Trousers & Pants':{group:'Ladies', test:p=>/trouser|pant/i.test(p.name+' '+p.desc)},
    'Skirts':{group:'Ladies', test:p=>/skirt/i.test(p.name+' '+p.desc)},
    'Jackets & Shrugs':{group:'Ladies', test:p=>/jacket|shrug/i.test(p.name+' '+p.desc)},
    'Blazers':{group:'Ladies', test:p=>/blazer/i.test(p.name+' '+p.desc)},
    'Sarees':{group:'Ladies', test:p=>/saree/i.test(p.name+' '+p.desc)},
    'Kurtas & Kurtis':{group:'Ladies', test:p=>/kurta|kurti/i.test(p.name+' '+p.desc)},
    'Suit Sets (Salwar/Anarkali)':{group:'Ladies', test:p=>/salwar|anarkali|suit set/i.test(p.name+' '+p.desc)},
    'Lehengas':{group:'Ladies', test:p=>/lehenga/i.test(p.name+' '+p.desc)},
    'Palazzos & Leggings':{group:'Ladies', test:p=>/palazzo|legging/i.test(p.name+' '+p.desc)},
    'Dupattas':{group:'Ladies', test:p=>/dupatta/i.test(p.name+' '+p.desc)},
    'Bras & Panties':{group:'Ladies', test:p=>/bra|panty|panties/i.test(p.name+' '+p.desc)},
    'Nightwear & Robes':{group:'Ladies', test:p=>/nightwear|robe/i.test(p.name+' '+p.desc)},
    'Loungewear':{group:'Ladies', test:p=>/lounge/i.test(p.name+' '+p.desc)},
    'Shapewear':{group:'Ladies', test:p=>/shapewear/i.test(p.name+' '+p.desc)},
    'Sports Bras':{group:'Ladies', test:p=>/sports? bra/i.test(p.name+' '+p.desc)},
    'Leggings & Tights':{group:'Ladies', test:p=>/legging|tights/i.test(p.name+' '+p.desc)},
    'Gym Tops':{group:'Ladies', test:p=>/gym.*top|top.*gym/i.test(p.name+' '+p.desc)},
    'Handbags':{group:'Ladies', test:p=>/handbag|hand bag/i.test(p.name+' '+p.desc)},
    'Jewellery':{group:'Ladies', test:p=>/jewell/i.test(p.name+' '+p.desc)},
    'Scarves & Stoles':{group:'Ladies', test:p=>/scarf|stole/i.test(p.name+' '+p.desc)},
    'T-Shirts & Polos':{group:'Kids', test:p=>/t-?shirt|tee|polo/i.test(p.name+' '+p.desc)},
    'Shirts':{group:'Kids', test:p=>/shirt/i.test(p.name+' '+p.desc)},
    'Jeans & Trousers':{group:'Kids', test:p=>/jeans|trouser|denim/i.test(p.name+' '+p.desc)},
    'Shorts':{group:'Kids', test:p=>/short/i.test(p.name+' '+p.desc)},
    'Ethnic Wear':{group:'Kids', test:p=>/ethnic|kurta|lehenga/i.test(p.name+' '+p.desc)},
    'Jackets & Sweaters':{group:'Kids', test:p=>/jacket|sweater/i.test(p.name+' '+p.desc)},
    'Dresses & Frocks':{group:'Kids', test:p=>/dress|frock/i.test(p.name+' '+p.desc)},
    'Tops & Tees (Kids)':{group:'Kids', test:p=>/top|tee|t-shirt/i.test(p.name+' '+p.desc)},
    'Skirts (Kids)':{group:'Kids', test:p=>/skirt/i.test(p.name+' '+p.desc)},
    'Jeans & Leggings':{group:'Kids', test:p=>/jeans|leggings?/i.test(p.name+' '+p.desc)},
    'Ethnic Wear (Lehengas/Kurtis)':{group:'Kids', test:p=>/lehenga|kurti|ethnic/i.test(p.name+' '+p.desc)},
    'Jackets':{group:'Kids', test:p=>/jacket/i.test(p.name+' '+p.desc)},
    'Onesies & Bodysuits':{group:'Kids', test:p=>/onesie|bodysuit/i.test(p.name+' '+p.desc)},
    'Rompers':{group:'Kids', test:p=>/romper/i.test(p.name+' '+p.desc)},
    'Clothing Sets':{group:'Kids', test:p=>/set/i.test(p.name+' '+p.desc)},
    'Baby Sleepsuits':{group:'Kids', test:p=>/sleepsuit|sleep suit/i.test(p.name+' '+p.desc)},
    'Bibs & Mittens':{group:'Kids', test:p=>/bib|mitten/i.test(p.name+' '+p.desc)},
    'Pyjama Sets (Kids)':{group:'Kids', test:p=>/pyjama|pajama/i.test(p.name+' '+p.desc)},
    'Vests & Underwear':{group:'Kids', test:p=>/vest|underwear/i.test(p.name+' '+p.desc)}
  };
  const parent={
    men:['Men','T-Shirt','Jeans','Jacket'], women:['Ladies','Jeans','Jacket'], kids:['Kids','T-Shirt','Jeans','Jacket']
  };
  function ensureBanner(){
    if(document.getElementById('sfhStep3Banner'))return;
    const style=document.createElement('style');style.id='sfh-step3-style';style.textContent=`
      #sfhStep3Banner{display:none;margin:0 0 14px;padding:12px 14px;border:1px solid rgba(244,201,93,.35);background:rgba(244,201,93,.08);border-radius:14px}
      #sfhStep3Banner.show{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      #sfhStep3Banner b{font-size:13px}#sfhStep3Banner span{font-size:10px;opacity:.7}
      #sfhStep3Banner button{border:1px solid rgba(255,255,255,.15);background:transparent;color:inherit;border-radius:999px;padding:7px 10px;font-weight:900;font-size:10px;cursor:pointer}
    `;document.head.appendChild(style);
    const grid=document.getElementById('productGrid'); if(grid){const b=document.createElement('div');b.id='sfhStep3Banner';b.innerHTML='<div><b id="sfhStep3Title"></b><br><span id="sfhStep3Info"></span></div><button onclick="sfhStep3Clear()">Show all products</button>';grid.parentElement.insertBefore(b,grid)}
  }
  function match(item,p){
    const r=RULES[item];
    if(!r)return false;
    if(p.group!==r.group)return false;
    return r.test(p);
  }
  window.sfhStep3Go=function(item){
    ensureBanner();
    const all=window.products||[];let hits=all.filter(p=>Number(p.stock)>0&&match(item,p));
    const parentCat= item.includes('Jeans')?'Jeans':item.includes('Jacket')?'Jacket':item.includes('T-Shirt')||item==='Polos'?'T-Shirt':(item.includes('Ladies')?'Ladies':'');
    if(!hits.length&&parentCat){
      hits=all.filter(p=>Number(p.stock)>0&&(p.cat===parentCat||p.group===parentCat));
    }
    window.__sfhStep3Filter={item,hits:hits.map(p=>p.id)};
    const title=document.getElementById('sfhStep3Title'),info=document.getElementById('sfhStep3Info'),banner=document.getElementById('sfhStep3Banner');
    if(title)title.textContent=item;
    if(info)info.textContent=`${hits.length} matching product${hits.length===1?'':'s'} • live stock`;
    banner.classList.add('show');
    document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});
    const grid=document.getElementById('productGrid');if(!grid)return;
    const original=all;
    const oldSearch=window.__sfhOriginalSearch||'';window.__sfhOriginalSearch=oldSearch;
    renderFiltered(hits);
  };
  function renderFiltered(arr){
    const grid=document.getElementById('productGrid'); if(!grid)return;
    if(typeof window.productCard==='function'){grid.innerHTML=arr.map(p=>window.productCard(p)).join('');return}
    const html=arr.map(p=>`<article class="product"><div class="productVisual"><span class="tag">${p.tag||'AVAILABLE'}</span><button class="wish" onclick="toggleWish('${p.id}')">♡</button>${typeof window.productVisual==='function'?window.productVisual(p):`<div class="art">${p.art||'👕'}</div>`}</div><div class="productInfo"><div class="productMeta"><span>${(p.group||'').toUpperCase()} • ${p.id}</span><span>★★★★★</span></div><h3>${p.name||'Product'}</h3><p>${p.desc||''}</p><div class="priceRow"><div><strong>₹${Number(p.price||0).toLocaleString('en-IN')}</strong><span class="old">₹${Number(p.old||0).toLocaleString('en-IN')}</span></div><button class="add" onclick="quickView('${p.id}')">View +</button></div></div></article>`).join('');
    grid.innerHTML=html;
    document.getElementById('emptyState')?.classList.toggle('hidden',arr.length>0);
  }
  window.sfhStep3Clear=function(){
    const b=document.getElementById('sfhStep3Banner');if(b)b.classList.remove('show');
    window.__sfhStep3Filter=null;
    if(typeof window.renderProducts==='function')window.renderProducts();
  };
  function install(){
    ensureBanner();
    document.querySelectorAll('[data-s2-item]').forEach(btn=>{
      const item=btn.getAttribute('data-s2-item');btn.onclick=function(){sfhStep3Go(item)};
    });
    const old=window.renderProducts;
    window.renderProducts=function(){
      if(window.__sfhStep3Filter?.item){const item=window.__sfhStep3Filter.item;const hits=(window.products||[]).filter(p=>Number(p.stock)>0&&match(item,p));if(hits.length)return renderFiltered(hits)}
      return old?.();
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));else setTimeout(install,50);
})();
