import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,collection,onSnapshot,query,orderBy,updateDoc,doc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const cfg=window.SFH_FIREBASE_CONFIG||{};
const ready=Object.values(cfg).every(v=>typeof v==='string'&&v.trim()&&!/^YOUR_/i.test(v));
const $=id=>document.getElementById(id);
let orders=[]; let unsubscribe=null; let auth,db;

function status(t,bad=false){$('authStatus').textContent=t;$('authStatus').style.color=bad?'#b42318':'#087443'}
function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function dateText(v){if(!v)return '—'; try{if(v.seconds)return new Date(v.seconds*1000).toLocaleString('en-IN'); return new Date(v).toLocaleString('en-IN')}catch(e){return '—'}}
function render(){
  const q=$('search').value.trim().toLowerCase(), f=$('filter').value;
  const rows=orders.filter(o=>(f==='All'||o.status===f)&&(!q||`${o.id} ${o.customer} ${o.mobile}`.toLowerCase().includes(q)));
  const counts=['Pending','Confirmed','Shipped','Delivered','Cancelled'];
  $('total').textContent=orders.length; counts.forEach(s=>$(s.toLowerCase()).textContent=orders.filter(o=>o.status===s).length);
  $('orders').innerHTML=rows.length?rows.map((o,i)=>`<article class="order"><div class="head"><div><div class="id">${esc(o.id||o.firestoreId)}</div><strong>${esc(o.customer||'Customer')}</strong><div class="meta">${esc(o.mobile||'')} • ${esc(o.city||'')} • ${dateText(o.createdAt)}</div></div><div class="amount">₹${Number(o.total||0).toLocaleString('en-IN')}</div></div><div class="items">${(Array.isArray(o.items)?o.items:[]).map(x=>`<div class="row"><span>${esc(x.name)}${x.size?` (${esc(x.size)})`:''} × ${Number(x.qty||1)}</span><b>₹${Number(x.total||0).toLocaleString('en-IN')}</b></div>`).join('')||'<span class="small">No item details</span>'}</div><div class="meta">Address: ${esc(o.address||'—')} • PIN: ${esc(o.pin||'—')} • Payment: ${esc(o.payment||'—')}</div><div class="controls"><select id="s-${i}">${counts.map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select><button class="save" data-idx="${orders.indexOf(o)}">Save Status</button><span class="small">Live Firebase order</span></div></article>`).join(''):'<div class="empty">No orders match the current filter.</div>';
  document.querySelectorAll('.save').forEach(b=>b.onclick=async()=>{const o=orders[Number(b.dataset.idx)];const sel=$(`s-${rows.indexOf(o)}`);try{b.disabled=true;await updateDoc(doc(db,'orders',o.firestoreId),{status:sel.value,updatedAt:serverTimestamp()});status(`Updated ${o.id||o.firestoreId} → ${sel.value}`)}catch(e){status(`Update failed: ${e.message}`,true)}finally{b.disabled=false}});
}

$('search').oninput=render; $('filter').onchange=render;
$('signIn').onclick=async()=>{try{status('Signing in…');await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);$('password').value=''}catch(e){status(e.message,true)}};
$('signOut').onclick=()=>signOut(auth);

if(!ready){status('Firebase is not configured yet. Replace the placeholders in firebase-config.js, then reload this page.',true);$('signIn').disabled=true}
else{
 try{
  const app=getApps().length?getApp():initializeApp(cfg); auth=getAuth(app); db=getFirestore(app);
  onAuthStateChanged(auth,u=>{
    if(unsubscribe){unsubscribe();unsubscribe=null}
    if(!u){$('dashboard').hidden=true;$('signOut').hidden=true;$('signIn').hidden=false;status('Please sign in as the authorized shop admin.');return}
    const adminEmail='santoshrawani123@gmail.com';
    if((u.email||'').toLowerCase()!==adminEmail){status(`Signed in as ${u.email}, but this account is not the configured admin.`,true);$('dashboard').hidden=true;signOut(auth);return}
    $('signIn').hidden=true;$('signOut').hidden=false;$('dashboard').hidden=false;status(`Signed in: ${u.email}`);
    const q=query(collection(db,'orders'),orderBy('createdAt','desc'));
    unsubscribe=onSnapshot(q,snap=>{orders=snap.docs.map(d=>({firestoreId:d.id,...d.data()}));render()},err=>status(`Live order read failed: ${err.message}`,true));
  });
 }catch(e){status(`Firebase startup failed: ${e.message}`,true)}
}
