/* Step 3 routing fix: handles duplicate subcategory names across departments. */
(function(){
  function departmentFrom(btn){
    const dep=btn.closest('.s2Department');
    if(!dep)return '';
    const t=(dep.querySelector('.s2Eyebrow')?.textContent||'').toLowerCase();
    if(t.includes("men"))return 'Men';
    if(t.includes("ladies")||t.includes('women'))return 'Ladies';
    if(t.includes('kids'))return 'Kids';
    return '';
  }
  function keywordMatch(item,p,group){
    if(p.group!==group||Number(p.stock)<=0)return false;
    const s=(p.name+' '+p.cat+' '+p.desc).toLowerCase();
    const rules={
      'Men|T-Shirts':['t-shirt','tshirt','tee'], 'Men|Polos':['polo'], 'Men|Casual Shirts':['casual shirt','everyday shirt'], 'Men|Formal Shirts':['formal shirt'], 'Men|Sweatshirts & Hoodies':['sweatshirt','hoodie'], 'Men|Jackets':['jacket'], 'Men|Blazers & Suits':['blazer','suit'], 'Men|Jeans':['jeans','denim'], 'Men|Trousers & Chinos':['trouser','chino','pant'], 'Men|Casual Shorts':['short'], 'Men|Track Pants & Joggers':['track','jogger'], 'Men|Kurtas & Kurta Sets':['kurta'], 'Men|Nehru Jackets':['nehru'], 'Men|Sherwanis':['sherwani'], 'Men|Sports T-Shirts':['sport','active','t-shirt'], 'Men|Gym Shorts':['gym','short'], 'Men|Tracksuits':['tracksuit'], 'Men|Vests':['vest'], 'Men|Briefs & Trunks':['brief','trunk'], 'Men|Boxers':['boxer'], 'Men|Pyjama Sets':['pyjama','pajama'], 'Men|Belts':['belt'], 'Men|Wallets':['wallet','purse'], 'Men|Ties & Pocket Squares':['tie','pocket square'], 'Men|Caps & Socks':['cap','sock'],
      'Ladies|Tops & Tees':['top','tee','t-shirt'], 'Ladies|Dresses & Jumpsuits':['dress','jumpsuit'], 'Ladies|Shirts & Blouses':['shirt','blouse'], 'Ladies|Jeans & Jeggings':['jean','jegging'], 'Ladies|Trousers & Pants':['trouser','pant'], 'Ladies|Skirts':['skirt'], 'Ladies|Jackets & Shrugs':['jacket','shrug'], 'Ladies|Blazers':['blazer'], 'Ladies|Sarees':['saree'], 'Ladies|Kurtas & Kurtis':['kurta','kurti'], 'Ladies|Suit Sets (Salwar/Anarkali)':['salwar','anarkali','suit set'], 'Ladies|Lehengas':['lehenga'], 'Ladies|Palazzos & Leggings':['palazzo','legging'], 'Ladies|Dupattas':['dupatta'], 'Ladies|Bras & Panties':['bra','panty'], 'Ladies|Nightwear & Robes':['nightwear','robe'], 'Ladies|Loungewear':['lounge'], 'Ladies|Shapewear':['shapewear'], 'Ladies|Sports Bras':['sports bra'], 'Ladies|Leggings & Tights':['legging','tights'], 'Ladies|Gym Tops':['gym','top'], 'Ladies|Handbags':['handbag','hand bag'], 'Ladies|Jewellery':['jewell'], 'Ladies|Scarves & Stoles':['scarf','stole'],
      'Kids|T-Shirts & Polos':['t-shirt','tshirt','tee','polo'], 'Kids|Shirts':['shirt'], 'Kids|Jeans & Trousers':['jean','trouser','denim'], 'Kids|Shorts':['short'], 'Kids|Ethnic Wear':['ethnic','kurta','lehenga'], 'Kids|Jackets & Sweaters':['jacket','sweater'], 'Kids|Dresses & Frocks':['dress','frock'], 'Kids|Tops & Tees':['top','tee','t-shirt'], 'Kids|Skirts':['skirt'], 'Kids|Jeans & Leggings':['jean','legging'], 'Kids|Ethnic Wear (Lehengas/Kurtis)':['lehenga','kurti','ethnic'], 'Kids|Jackets':['jacket'], 'Kids|Onesies & Bodysuits':['onesie','bodysuit'], 'Kids|Rompers':['romper'], 'Kids|Clothing Sets':['set'], 'Kids|Baby Sleepsuits':['sleepsuit','sleep suit'], 'Kids|Bibs & Mittens':['bib','mitten'], 'Kids|Pyjama Sets':['pyjama','pajama'], 'Kids|Vests & Underwear':['vest','underwear']
    };
    const arr=rules[group+'|'+item];
    if(!arr)return false;
    return arr.every(x=>x==='sport' || x==='active' || x==='t-shirt' ? s.includes(x) : s.includes(x));
  }
  function fallback(item,group){
    const p=window.products||[];
    return p.filter(x=>Number(x.stock)>0&&x.group===group&&(
      (item.includes('T-Shirt')&&x.cat==='T-Shirt') ||
      (item.includes('Jeans')&&x.cat==='Jeans') ||
      (item.includes('Jacket')&&x.cat==='Jacket')
    ));
  }
  function render(arr){
    const grid=document.getElementById('productGrid');
    if(!grid)return;
    if(typeof window.productCard==='function'){grid.innerHTML=arr.map(window.productCard).join('');return;}
    grid.innerHTML=arr.map(p=>`<article class="product"><div class="productVisual"><span class="tag">${p.tag||'AVAILABLE'}</span>${typeof window.productVisual==='function'?window.productVisual(p):`<div class="art">${p.art||'👕'}</div>`}</div><div class="productInfo"><div class="productMeta"><span>${String(p.group||'').toUpperCase()} • ${p.id}</span><span>★★★★★</span></div><h3>${p.name}</h3><p>${p.desc||''}</p><div class="priceRow"><strong>₹${Number(p.price||0).toLocaleString('en-IN')}</strong><button class="add" onclick="quickView('${p.id}')">View +</button></div></div></article>`).join('');
    document.getElementById('emptyState')?.classList.toggle('hidden',arr.length>0);
  }
  function go(btn,item){
    const group=departmentFrom(btn); if(!group)return;
    let hits=(window.products||[]).filter(p=>keywordMatch(item,p,group));
    if(!hits.length)hits=fallback(item,group);
    const banner=document.getElementById('sfhStep3Banner');
    if(banner){banner.classList.add('show');const t=document.getElementById('sfhStep3Title'),i=document.getElementById('sfhStep3Info');if(t)t.textContent=`${group} • ${item}`;if(i)i.textContent=`${hits.length} matching product${hits.length===1?'':'s'} • live stock`}
    window.__sfhStep3Filter={item,group,ids:hits.map(p=>p.id)};
    document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});
    render(hits);
  }
  function install(){
    document.querySelectorAll('[data-s2-item]').forEach(btn=>{const item=btn.getAttribute('data-s2-item');btn.onclick=function(){go(this,item)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));else setTimeout(install,120);
})();
