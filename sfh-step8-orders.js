/* SFH Step 8 — local order records */
(function(){
  const KEY='sfh-orders';
  function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
  function save(a){localStorage.setItem(KEY,JSON.stringify(a))}
  window.sfhCreateOrder=function(customer,cartData){
    const now=new Date();
    const id='SFH-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(Date.now()).slice(-6);
    const order={id,createdAt:now.toISOString(),status:'Pending',customer,items:cartData.items.map(x=>({id:x.p.id,name:x.p.name,size:x.size,qty:x.qty,price:Number(x.p.price||0),lineTotal:Number(x.p.price||0)*Number(x.qty||0)})),subtotal:cartData.subtotal,discount:cartData.discount,total:cartData.total};
    const a=load();a.push(order);save(a);return order;
  };
  window.sfhOrdersCount=function(){return load().length};
  window.sfhOrderStorageKey=KEY;
})();
