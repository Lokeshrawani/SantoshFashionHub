/* Santosh Fashion Hub — Step 2 complete fashion portal
 * Replaces the old placeholder-heavy collection section with a premium,
 * mobile-friendly, clickable portal linked to the existing product filters.
 */
(function(){
  const MAP={
    'T-Shirts':'T-Shirt','Polos':'T-Shirt','Casual Shirts':'Men','Formal Shirts':'Men','Sweatshirts & Hoodies':'Jacket','Jackets':'Jacket','Blazers & Suits':'Men',
    'Jeans':'Jeans','Trousers & Chinos':'Men','Casual Shorts':'Men','Track Pants & Joggers':'Men',
    'Kurtas & Kurta Sets':'Men','Nehru Jackets':'Jacket','Sherwanis':'Men',
    'Sports T-Shirts':'T-Shirt','Gym Shorts':'Men','Tracksuits':'Men','Vests':'Men','Briefs & Trunks':'Men','Boxers':'Men','Pyjama Sets':'Men',
    'Belts':'Men','Wallets':'Men','Ties & Pocket Squares':'Men','Caps & Socks':'Men',
    'Tops & Tees':'Ladies','Dresses & Jumpsuits':'Ladies','Shirts & Blouses':'Ladies','Jeans & Jeggings':'Jeans','Trousers & Pants':'Ladies','Skirts':'Ladies','Jackets & Shrugs':'Jacket','Blazers':'Ladies',
    'Sarees':'Ladies','Kurtas & Kurtis':'Ladies','Suit Sets (Salwar/Anarkali)':'Ladies','Lehengas':'Ladies','Palazzos & Leggings':'Ladies','Dupattas':'Ladies',
    'Bras & Panties':'Ladies','Nightwear & Robes':'Ladies','Loungewear':'Ladies','Shapewear':'Ladies','Sports Bras':'Ladies','Leggings & Tights':'Ladies','Gym Tops':'Ladies',
    'Handbags':'Ladies','Jewellery':'Ladies','Scarves & Stoles':'Ladies',
    'T-Shirts & Polos':'Kids','Shirts':'Kids','Jeans & Trousers':'Kids','Shorts':'Kids','Ethnic Wear':'Kids','Jackets & Sweaters':'Jacket',
    'Dresses & Frocks':'Kids','Tops & Tees':'Kids','Skirts':'Kids','Jeans & Leggings':'Kids','Ethnic Wear (Lehengas/Kurtis)':'Kids','Jackets':'Jacket',
    'Onesies & Bodysuits':'Kids','Rompers':'Kids','Clothing Sets':'Kids','Baby Sleepsuits':'Kids','Bibs & Mittens':'Kids','Vests & Underwear':'Kids'
  };
  const groups={
    Men:{eyebrow:'01 • MEN\'S WEAR',title:'Complete Men\'s Collection',tag:'TOPWEAR • BOTTOMWEAR • ETHNIC • ACTIVEWEAR',desc:'Everyday essentials, smart looks and seasonal layers — organized for quick shopping.',icon:'👔',visual:'MEN'},
    Women:{eyebrow:'02 • LADIES\' / WOMEN\'S WEAR',title:'Complete Women\'s Collection',tag:'WESTERN • ETHNIC • LINGERIE • ACTIVEWEAR',desc:'Modern western styles, traditional wear, comfort essentials and accessories.',icon:'👗',visual:'WOMEN'},
    Kids:{eyebrow:'03 • KIDS\' WEAR',title:'Complete Kids Collection',tag:'BOYS • GIRLS • INFANTS • NIGHTWEAR',desc:'Fun, comfortable clothing for boys, girls and little ones — all in one place.',icon:'🧒',visual:'KIDS'}
  };
  const data={
    Men:[['Topwear',['T-Shirts','Polos','Casual Shirts','Formal Shirts','Sweatshirts & Hoodies','Jackets','Blazers & Suits']],['Bottomwear',['Jeans','Trousers & Chinos','Casual Shorts','Track Pants & Joggers']],['Ethnic Wear',['Kurtas & Kurta Sets','Nehru Jackets','Sherwanis']],['Activewear',['Sports T-Shirts','Gym Shorts','Tracksuits']],['Innerwear & Loungewear',['Vests','Briefs & Trunks','Boxers','Pyjama Sets']],['Accessories',['Belts','Wallets','Ties & Pocket Squares','Caps & Socks']]],
    Women:[['Western Wear',['Tops & Tees','Dresses & Jumpsuits','Shirts & Blouses','Jeans & Jeggings','Trousers & Pants','Skirts','Jackets & Shrugs','Blazers']],['Ethnic & Traditional Wear',['Sarees','Kurtas & Kurtis','Suit Sets (Salwar/Anarkali)','Lehengas','Palazzos & Leggings','Dupattas']],['Lingerie & Nightwear',['Bras & Panties','Nightwear & Robes','Loungewear','Shapewear']],['Activewear',['Sports Bras','Leggings & Tights','Gym Tops']],['Accessories',['Handbags','Jewellery','Scarves & Stoles','Belts']]],
    Kids:[['Boys (2–14 Years)',['T-Shirts & Polos','Shirts','Jeans & Trousers','Shorts','Ethnic Wear','Jackets & Sweaters']],['Girls (2–14 Years)',['Dresses & Frocks','Tops & Tees','Skirts','Jeans & Leggings','Ethnic Wear (Lehengas/Kurtis)','Jackets']],['Infants & Toddlers (0–2 Years)',['Onesies & Bodysuits','Rompers','Clothing Sets','Baby Sleepsuits','Bibs & Mittens']],['Nightwear & Innerwear',['Pyjama Sets','Vests & Underwear']]]
  };
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function stockFor(cat){
    try{return (window.products||[]).filter(p=>Number(p.stock)>0&&(p.cat===cat||p.group===cat)).length}catch(e){return 0}
  }
  function go(item){
    const cat=MAP[item];
    if(typeof window.setCategory==='function'&&cat){ window.setCategory(cat); return; }
    document.getElementById('products')?.scrollIntoView({behavior:'smooth'});
  }
  function visual(g){
    return `<div class="s2Visual s2-${g.toLowerCase()}"><div class="s2VisualGlow"></div><div class="s2Model">${groups[g].icon}</div><div class="s2FashionWord">${groups[g].visual}</div><div class="s2VisualCaption">SANTOSH FASHION HUB</div></div>`;
  }
  function buildGroup(g){
    const cfg=groups[g];
    return `<article class="s2Department">
      <div class="s2Head"><div class="s2Title"><span class="s2Eyebrow">${cfg.eyebrow}</span><h3>${cfg.title}</h3><p>${cfg.desc}</p></div><span class="s2Tag">${cfg.tag}</span></div>
      <div class="s2TopGrid">${visual(g)}<div class="s2QuickPanel"><div class="s2QuickTop"><div><span class="s2Mini">SHOP BY STYLE</span><strong>Explore ${g==='Women'?'women\'s':g.toLowerCase()} categories</strong></div><span class="s2Badge">${g==='Men'?'MEN':g==='Women'?'LADIES':'KIDS'}</span></div><p>Tap any category to see matching products, prices and available stock.</p><button class="s2Explore" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">View all products →</button></div></div>
      <div class="s2GroupGrid">${data[g].map(([title,items])=>`<div class="s2CategoryGroup"><h4>${esc(title)}</h4><div class="s2Pills">${items.map(x=>`<button class="s2Pill" data-s2-item="${esc(x)}" onclick="sfhStep2Go(this.dataset.s2Item)"><span>${esc(x)}</span><b>›</b></button>`).join('')}</div></div>`).join('')}</div>
      <div class="s2Bottom"><span>📦 Live stock filtering</span><span>💬 WhatsApp support</span><span>🚚 India delivery</span></div>
    </article>`;
  }
  function install(){
    const root=document.querySelector('.collectionPortal');
    if(!root)return;
    root.innerHTML=`<div class="s2Intro"><div><span class="s2Eyebrow">COMPLETE FASHION PORTAL</span><h2>Men's, Women's & Kids' Collections</h2><p>Browse the full department catalogue and tap any subcategory. Products are connected to the existing live catalogue and stock filters.</p></div><div class="s2Live"><b>LIVE</b><span>Product catalogue</span></div></div>${buildGroup('Men')}${buildGroup('Women')}${buildGroup('Kids')}`;
    if(!document.getElementById('sfh-step2-css')){
      const st=document.createElement('style');st.id='sfh-step2-css';st.textContent=`
      .collectionPortal{padding-top:24px}
      .s2Intro{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;flex-wrap:wrap;margin-bottom:20px}
      .s2Intro h2{margin:5px 0 8px;font-size:clamp(28px,5vw,44px);letter-spacing:-1px}
      .s2Intro p{margin:0;max-width:820px;line-height:1.7;opacity:.78}
      .s2Eyebrow{font-size:10px;font-weight:1000;letter-spacing:2px;opacity:.68}
      .s2Live{border:1px solid rgba(244,201,93,.35);background:rgba(244,201,93,.08);padding:10px 13px;border-radius:999px;display:flex;gap:8px;align-items:center;font-size:11px}
      .s2Live b{font-size:9px;padding:4px 7px;border-radius:999px;background:#087443;color:#fff}
      .s2Department{margin:18px 0;padding:20px;border:1px solid rgba(255,255,255,.10);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.02));box-shadow:0 20px 50px rgba(0,0,0,.08)}
      .s2Head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .s2Title{flex:1;min-width:260px}.s2Title h3{margin:4px 0 7px;font-size:clamp(24px,4vw,32px)}.s2Title p{margin:0;line-height:1.6;opacity:.72;max-width:700px}
      .s2Tag{padding:8px 11px;border-radius:999px;background:rgba(255,255,255,.07);font-size:10px;font-weight:900;letter-spacing:.7px}
      .s2TopGrid{display:grid;grid-template-columns:1.12fr .88fr;gap:13px;margin-bottom:14px}
      .s2Visual{min-height:240px;position:relative;overflow:hidden;border-radius:18px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,rgba(244,201,93,.22),transparent 30%),linear-gradient(145deg,#11182b,#2b234d);border:1px solid rgba(255,255,255,.12)}
      .s2VisualGlow{width:210px;height:210px;border-radius:50%;background:rgba(244,201,93,.10);filter:blur(4px);position:absolute;right:-40px;bottom:-70px}.s2Model{font-size:74px;z-index:1;filter:drop-shadow(0 15px 22px rgba(0,0,0,.28))}.s2FashionWord{position:absolute;left:18px;bottom:18px;font-size:30px;font-weight:1000;letter-spacing:3px;color:rgba(255,255,255,.12)}.s2VisualCaption{position:absolute;right:15px;top:15px;font-size:8px;letter-spacing:2px;color:rgba(255,255,255,.6);font-weight:900}.s2-women{background:radial-gradient(circle at 70% 18%,rgba(244,201,93,.25),transparent 30%),linear-gradient(145deg,#251628,#4e2845)}.s2-kids{background:radial-gradient(circle at 20% 15%,rgba(244,201,93,.26),transparent 30%),linear-gradient(145deg,#142b34,#263c6b)}
      .s2QuickPanel{padding:18px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);display:flex;flex-direction:column;justify-content:center}.s2QuickTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.s2Mini{font-size:9px;letter-spacing:1.6px;opacity:.58;font-weight:900;display:block;margin-bottom:5px}.s2QuickPanel strong{font-size:20px;line-height:1.15}.s2Badge{font-size:9px;font-weight:900;border:1px solid rgba(244,201,93,.35);color:#f4c95d;padding:5px 7px;border-radius:999px}.s2QuickPanel p{font-size:12px;line-height:1.65;opacity:.72;margin:12px 0}.s2Explore{align-self:flex-start;border:0;border-radius:11px;padding:10px 13px;background:#f4c95d;color:#17130a;font-weight:900;cursor:pointer}
      .s2GroupGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.s2CategoryGroup{padding:13px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.s2CategoryGroup h4{margin:0 0 10px;font-size:14px}.s2Pills{display:flex;flex-wrap:wrap;gap:7px}.s2Pill{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);color:inherit;border-radius:999px;padding:8px 10px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:10px;font-weight:800;text-align:left}.s2Pill:hover{border-color:rgba(244,201,93,.5);transform:translateY(-1px)}.s2Pill b{opacity:.55;font-size:13px}.s2Bottom{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px;font-size:9px;opacity:.58}.s2Bottom span{padding:6px 8px;border-radius:999px;background:rgba(255,255,255,.035)}
      @media(max-width:820px){.s2TopGrid{grid-template-columns:1fr}.s2GroupGrid{grid-template-columns:1fr 1fr}}
      @media(max-width:520px){.s2Department{padding:15px;border-radius:20px}.s2GroupGrid{grid-template-columns:1fr}.s2Visual{min-height:200px}.s2Model{font-size:62px}.s2FashionWord{font-size:22px}.s2Pill{font-size:9px;padding:7px 9px}.s2Tag{width:100%;text-align:left}}
      `;document.head.appendChild(st);
    }
  }
  window.sfhStep2Go=function(item){
    const category=MAP[item];
    if(category&&typeof window.setCategory==='function'){
      window.setCategory(category);return;
    }
    const p=(window.products||[]).filter(x=>Number(x.stock)>0&&String(x.name||'').toLowerCase().includes(String(item).toLowerCase().split(' ')[0]));
    document.getElementById('products')?.scrollIntoView({behavior:'smooth'});
    if(!p.length){
      const t=document.getElementById('toast');if(t){t.textContent=`No live ${item} products added yet`;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,40));else setTimeout(install,40);
})();
