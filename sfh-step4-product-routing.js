/* Santosh Fashion Hub — Step 4 exact product routing
 * Products created/edited in admin-product-manager.html store an explicit
 * `subcategory`. This file makes the portal use that field first, with a
 * safe text fallback for older products.
 */
(function(){
  function department(btn){
    const dep=btn.closest('.s2Department');
    const text=(dep?.querySelector('.s2Eyebrow')?.textContent||'').toLowerCase();
    if(text.includes('kids'))return 'Kids';
    if(text.includes('ladies')||text.includes('women'))return 'Ladies';
    if(text.includes('men'))return 'Men';
    return '';
  }
  function fallback(item,p,group){
    if(p.group!==group||Number(p.stock)<=0)return false;
    const s=(p.name+' '+p.cat+' '+p.desc).toLowerCase();
    const x=item.toLowerCase();
    const checks=[
      [['t-shirt','tee','polo'],/t-?shirt|tee|polo/],
      [['jeans','jeggings','denim'],/jean|jegg|denim/],
      [['jacket','shrug','sweater'],/jacket|shrug|sweater/],
      [['shirt'],/shirt/],
      [['trouser','pants','chinos'],/trouser|pant|chino/],
      [['shorts'],/short/],
      [['tracksuit'],/tracksuit/],
      [['track pants','joggers'],/track|jogger/],
      [['dress','frocks'],/dress|frock/],
      [['skirt'],/skirt/],
      [['saree'],/saree/],
      [['kurta','kurtis'],/kurta|kurti/],
      [['lehenga'],/lehenga/],
      [['dupatta'],/dupatta/],
      [['bra','panties'],/bra|panty/],
      [['nightwear','robe'],/nightwear|robe/],
      [['leggings','tights'],/legging|tights/],
      [['handbags'],/handbag/],
      [['jewellery'],/jewell/]
    ];
    for(const [keys,re] of checks)if(keys.some(k=>x.includes(k)))return re.test(s);
    return s.includes(x.split(' ')[0]);
  }
  function go(btn,item){
    const group=department(btn), all=window.products||[];
    if(!group)return;
    let hits=all.filter(p=>Number(p.stock)>0&&p.group===group&&String(p.subcategory||'').toLowerCase()===item.toLowerCase());
    if(!hits.length)hits=all.filter(p=>fallback(item,p,group));
    const grid=document.getElementById('productGrid');
    const banner=document.getElementById('sfhStep3Banner');
    if(banner){banner.classList.add('show');const t=document.getElementById('sfhStep3Title'),i=document.getElementById('sfhStep3Info');if(t)t.textContent=group+' • '+item;if(i)i.textContent=hits.length+' matching product'+(hits.length===1?'':'s')+' • live stock'}
    if(grid){
      grid.innerHTML=hits.map(p=>`<article class="product"><div class="productVisual"><span class="tag">${p.tag||'AVAILABLE'}</span><button class="wish" onclick="toggleWish('${p.id}')">♡</button>${typeof window.productVisual==='function'?window.productVisual(p):`<div class="art">${p.art||'👕'}</div>`}</div><div class="productInfo"><div class="productMeta"><span>${String(p.group||'').toUpperCase()} • ${p.id}</span><span>★★★★★</span></div><h3>${p.name||'Product'}</h3><p>${p.desc||''}</p><div class="priceRow"><div><strong>₹${Number(p.price||0).toLocaleString('en-IN')}</strong><span class="old">₹${Number(p.old||0).toLocaleString('en-IN')}</span></div><button class="add" onclick="quickView('${p.id}')">View +</button></div></div></article>`).join('');
      document.getElementById('emptyState')?.classList.toggle('hidden',hits.length>0);
    }
    document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function install(){document.querySelectorAll('[data-s2-item]').forEach(b=>{const item=b.getAttribute('data-s2-item');b.onclick=function(){go(this,item)}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
})();
