import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {getFirestore,collection,doc,deleteField,onSnapshot,query,orderBy,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {getFunctions,httpsCallable} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

const ADMIN_EMAIL="santoshrawani123@gmail.com";
const REGION="asia-south1";
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=value=>"₹"+Number(value||0).toLocaleString("en-IN");
let auth,db,functions,currentUser=null,stopProducts=null,stopOrders=null;
let products=[],orders=[];

function authMessage(message,bad=false){$("authStatus").textContent=message;$("authStatus").className="status "+(bad?"bad":"ok");}
function timeText(value){try{if(value?.toDate)return value.toDate().toLocaleString("en-IN");if(value?.seconds)return new Date(value.seconds*1000).toLocaleString("en-IN");return value?new Date(value).toLocaleString("en-IN"):"—"}catch(_){return "—"}}
function updateStats(){
  $("statProducts").textContent=products.length;
  $("statUnits").textContent=products.reduce((sum,p)=>sum+Math.max(0,Number(p.stock)||0),0);
  $("statOrders").textContent=orders.length;
  $("statPending").textContent=orders.filter(o=>!["Delivered","Cancelled"].includes(o.status)).length;
  $("statPaid").textContent=orders.filter(o=>o.paymentStatus==="paid").length;
}
function parseSizeInventory(value){
  const result={};
  const entries=String(value||"").split(",").map(part=>part.trim()).filter(Boolean);
  for(const entry of entries){
    const match=entry.match(/^([^:]{1,24}):\s*(\d{1,5})$/);
    if(!match)throw new Error("Use size:quantity pairs, for example S:3, M:5, L:2.");
    const size=match[1].trim();
    if(Object.prototype.hasOwnProperty.call(result,size))throw new Error("Duplicate size: "+size);
    result[size]=Number(match[2]);
  }
  return result;
}
function renderInventory(){
  const queryText=$("productSearch").value.trim().toLowerCase();
  const rows=products.filter(p=>!queryText||`${p.id} ${p.name} ${p.cat}`.toLowerCase().includes(queryText));
  $("inventory").innerHTML=rows.length?rows.map(p=>{
    const inventory=p.inventoryBySize&&typeof p.inventoryBySize==="object"?p.inventoryBySize:{};
    const variantText=Object.entries(inventory).map(([size,qty])=>size+":"+qty).join(", ");
    const image=p.image||(Array.isArray(p.images)?p.images[0]:"");
    const priceApproved=p.priceVerified===true&&Number(p.approvedPricePaise||0)===Math.round(Number(p.price||0)*100);
    const online=p.saleEnabled===true&&priceApproved;
    return `<article class="product" data-product-card="${esc(p.id)}">
      <div class="product-head"><div><b>${esc(p.name||"New product")}</b><small class="meta">SKU ${esc(p.id)} • ${esc(p.cat||p.group||"Uncategorised")}</small></div><span class="pill ${online&&p.priceVerified?"good":"bad"}">${online&&p.priceVerified?"ONLINE SALE ON":"NOT LIVE FOR SALE"}</span></div>
      <div class="product-main"><div class="photo">${image?`<img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy">`:"Fashion item"}</div><div class="fields">
        <label>Selling price (₹)<input data-price value="${Number(p.price)||0}" type="number" min="1" step="0.01"></label>
        <label>MRP (₹)<input data-old value="${Number(p.old)||0}" type="number" min="0" step="0.01"></label>
        <label>Global stock<input data-stock value="${Number(p.stock)||0}" type="number" min="0" step="1"></label>
        <label>Stock by size (optional)<input data-variants value="${esc(variantText)}" placeholder="S:3, M:5, L:2"></label>
      </div></div>
      <div class="checks">
        <label><input data-verified type="checkbox" ${priceApproved?"checked":""}> I verified actual price & stock</label>
        <label><input data-online type="checkbox" ${online?"checked":""}> Enable online sale</label>
      </div>
      <div class="save-row"><small>Current stock: ${Number(p.stock)||0} units • Existing sizes: ${esc((p.sizes||[]).join(", ")||"not specified")}</small><button type="button" data-save-product>Save inventory</button></div>
    </article>`;
  }).join(""):'<div class="empty">No matching products. Add new products from the Product Catalogue Admin.</div>';
  $("inventory").querySelectorAll("[data-save-product]").forEach(button=>button.addEventListener("click",saveProduct));
}
async function saveProduct(event){
  const card=event.currentTarget.closest("[data-product-card]");
  const id=card.dataset.productCard;
  const product=products.find(item=>item.id===id);
  if(!product)return;
  const button=event.currentTarget;
  try{
    button.disabled=true;
    const price=Number(card.querySelector("[data-price]").value);
    const old=Number(card.querySelector("[data-old]").value);
    const globalStock=Number(card.querySelector("[data-stock]").value);
    const variantText=card.querySelector("[data-variants]").value.trim();
    const verified=card.querySelector("[data-verified]").checked;
    const requestedOnline=card.querySelector("[data-online]").checked;
    if(!Number.isFinite(price)||price<=0)throw new Error("Enter the actual selling price.");
    if(!Number.isFinite(old)||old<0||!Number.isInteger(globalStock)||globalStock<0)throw new Error("Enter valid MRP and stock values.");
    if(!verified&&requestedOnline)throw new Error("First tick the confirmation that price and stock are actual and verified.");
    const inventoryBySize=variantText?parseSizeInventory(variantText):null;
    const stock=inventoryBySize?Object.values(inventoryBySize).reduce((sum,value)=>sum+value,0):globalStock;
    if(requestedOnline&&stock<=0)throw new Error("Online sale cannot be enabled without stock.");
    if(inventoryBySize&&Array.isArray(product.sizes)){
      const missing=Object.keys(inventoryBySize).filter(size=>product.sizes.length&&!product.sizes.includes(size));
      if(missing.length)throw new Error("These variants are not listed in product sizes: "+missing.join(", "));
    }
    await updateDoc(doc(db,"products",id),{
      price,old,stock,priceVerified:verified,approvedPricePaise:verified?Math.round(price*100):0,saleEnabled:requestedOnline&&verified&&stock>0,
      ...(inventoryBySize?{inventoryBySize}:{inventoryBySize:deleteField()}),
      updatedAt:serverTimestamp(),commerceUpdatedBy:currentUser.uid
    });
    $("inventoryStatus").textContent="Saved "+id+". Storefront stock and online-sale approval updated.";
    $("inventoryStatus").className="status ok";
  }catch(error){
    $("inventoryStatus").textContent=error.message||"Inventory save failed.";
    $("inventoryStatus").className="status bad";
  }finally{button.disabled=false;}
}
function statusOptions(current){
  const choices=["Order received","Confirmed","Processing","Packed","Shipped","Out for delivery","Delivered","Cancelled"];
  if(current&&!choices.includes(current))choices.unshift(current);
  return choices.map(status=>`<option value="${status}" ${current===status?"selected":""}>${status}</option>`).join("");
}
function renderOrders(){
  const needle=$("orderSearch").value.trim().toLowerCase();
  const filter=$("orderFilter").value;
  const rows=orders.filter(order=>{
    const customer=order.customer||{};
    const matchStatus=filter==="All"||order.status===filter;
    const searchable=`${order.id} ${customer.name} ${customer.mobile} ${customer.city}`.toLowerCase();
    return matchStatus&&(!needle||searchable.includes(needle));
  });
  $("orders").innerHTML=rows.length?rows.map(order=>{
    const customer=order.customer&&typeof order.customer==="object"?order.customer:{name:order.customer||order.name,mobile:order.mobile,pin:order.pin,city:order.city,address:order.address},tracking=order.tracking||{};
    const items=Array.isArray(order.items)?order.items:[];
    return `<article class="order" data-order-card="${esc(order.id)}">
      <div class="order-head"><div><b>${esc(order.id)}</b><small class="meta">${timeText(order.createdAt)} • ${esc(order.paymentMethod||"—")} • Payment: ${esc(order.paymentStatus||"—")}</small></div><span class="pill ${order.status==="Delivered"?"good":order.status==="Cancelled"?"bad":""}">${esc(order.status||"Order received")}</span></div>
      <div class="customer"><b>${esc(customer.name||"Customer")}</b> • ${esc(customer.mobile||"")}<br>${esc(customer.address||"")} • ${esc(customer.city||"")} • PIN ${esc(customer.pin||"")}<br>Online payment: ${order.paymentStatus==="paid"?"Paid":order.paymentMethod==="cod"?"Cash on Delivery":"Not paid / awaiting confirmation"} ${order.refundRequired?" • Refund action required":""}</div>
      <div class="order-items">${items.map(item=>`<div class="order-item"><span>${esc(item.name||item.productId)} • ${esc(item.size)} × ${Number(item.qty||1)}</span><b>${money(item.lineTotal)}</b></div>`).join("")}</div>
      <div class="order-head"><small class="meta">Order total</small><b>${money(order.total)}</b></div>
      <div class="order-controls">
        <label>Order status<select data-status>${statusOptions(order.status)}</select></label>
        <label>Courier / delivery partner<input data-courier value="${esc(tracking.courier||"")}" placeholder="e.g. India Post"></label>
        <label>Tracking number<input data-tracking-number value="${esc(tracking.trackingNumber||"")}" placeholder="Consignment / AWB number"></label>
        <label>Expected delivery<input data-eta value="${esc(tracking.estimatedDelivery||"")}" placeholder="e.g. 2–4 Dec 2026"></label>
        <label class="wide">Tracking URL (must start with https://)<input data-tracking-url value="${esc(tracking.trackingUrl||"")}" placeholder="https://carrier.example/track/..."></label>
        <label class="wide">Customer update / note<input data-note value="${esc(tracking.note||"")}" placeholder="Parcel handed to courier"></label>
      </div>
      <div class="order-actions"><small>${order.needsManualReview?"Payment needs manual review.":order.refundRequired?"Paid order cancelled — refund must be actioned in the Razorpay dashboard.":order.restockRequired?"Cancelled committed order — physically inspect and manually restock returned goods.":"Customer sees these updates in My Orders."}</small><button type="button" data-save-order>Save order & tracking</button></div>
    </article>`;
  }).join(""):'<div class="empty">No orders match this filter.</div>';
  $("orders").querySelectorAll("[data-save-order]").forEach(button=>button.addEventListener("click",saveOrder));
  updateStats();
}
async function saveOrder(event){
  const card=event.currentTarget.closest("[data-order-card]");
  const button=event.currentTarget;
  try{
    button.disabled=true;
    const payload={
      orderId:card.dataset.orderCard,
      status:card.querySelector("[data-status]").value,
      courier:card.querySelector("[data-courier]").value.trim(),
      trackingNumber:card.querySelector("[data-tracking-number]").value.trim(),
      estimatedDelivery:card.querySelector("[data-eta]").value.trim(),
      trackingUrl:card.querySelector("[data-tracking-url]").value.trim(),
      note:card.querySelector("[data-note]").value.trim()
    };
    await httpsCallable(functions,"adminUpdateOrder")(payload);
    $("ordersStatus").textContent="Saved order "+payload.orderId+". Customer tracking has been updated.";
    $("ordersStatus").className="status ok";
  }catch(error){
    $("ordersStatus").textContent=error.message||"Order update failed.";
    $("ordersStatus").className="status bad";
  }finally{button.disabled=false;}
}
function stopListeners(){
  if(stopProducts){stopProducts();stopProducts=null;}
  if(stopOrders){stopOrders();stopOrders=null;}
}
function startListeners(){
  stopListeners();
  stopProducts=onSnapshot(collection(db,"products"),snapshot=>{
    products=snapshot.docs.map(snap=>({id:snap.id,...snap.data()})).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
    $("inventoryStatus").textContent="Live inventory connected • "+products.length+" products.";
    $("inventoryStatus").className="status ok";
    renderInventory();updateStats();
  },error=>{$("inventoryStatus").textContent="Inventory error: "+error.message;$("inventoryStatus").className="status bad";});
  stopOrders=onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),snapshot=>{
    orders=snapshot.docs.map(snap=>({firestoreId:snap.id,...snap.data()}));
    $("ordersStatus").textContent="Live orders connected • "+orders.length+" orders.";
    $("ordersStatus").className="status ok";
    renderOrders();
  },error=>{$("ordersStatus").textContent="Order read error: "+error.message;$("ordersStatus").className="status bad";});
}
$("signIn").addEventListener("click",async()=>{
  try{
    authMessage("Signing in…");
    await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);
    $("password").value="";
  }catch(error){authMessage(error.message||"Sign in failed.",true);}
});
$("signOut").addEventListener("click",()=>signOut(auth));
$("productSearch").addEventListener("input",renderInventory);
$("orderSearch").addEventListener("input",renderOrders);
$("orderFilter").addEventListener("change",renderOrders);
try{
  const config=window.SFH_FIREBASE_CONFIG;
  if(!config?.projectId)throw new Error("Firebase web configuration is missing.");
  const app=getApps().find(existing=>existing.name==="[DEFAULT]")||initializeApp(config);
  auth=getAuth(app);db=getFirestore(app);functions=getFunctions(app,REGION);
  onAuthStateChanged(auth,user=>{
    stopListeners();
    currentUser=user||null;
    if(!user){
      $("dashboard").hidden=true;$("signIn").hidden=false;$("signOut").hidden=true;
      authMessage("Sign in with the authorised shop administrator account.");
      return;
    }
    if(String(user.email||"").toLowerCase()!==ADMIN_EMAIL || user.emailVerified!==true){
      $("dashboard").hidden=true;
      authMessage("Use the authorised shop admin email and verify it before managing the store.",true);
      signOut(auth);
      return;
    }
    $("dashboard").hidden=false;$("signIn").hidden=true;$("signOut").hidden=false;
    authMessage("Signed in as authorised shop administrator.");
    startListeners();
  });
}catch(error){authMessage("Firebase startup failed: "+error.message,true);}
