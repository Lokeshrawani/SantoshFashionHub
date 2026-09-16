import './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const LOCAL_KEY='sfh-collection-photos-v1';
const FIREBASE_COLLECTION='collectionPhotoSlots';
const ADMIN_EMAIL='santoshrawani123@gmail.com';
const MAX_DATA_URL_CHARS=650000;

const app=getApps().find(a=>a.name==='sfh-photo-fit-quality-v1')||initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-photo-fit-quality-v1'});
const db=getFirestore(app);

function injectCss(){
  if(document.getElementById('sfh-photo-fit-quality-style'))return;
  const s=document.createElement('style');
  s.id='sfh-photo-fit-quality-style';
  s.textContent=`
    /* Never crop customer-uploaded photos. Preserve complete top/bottom and left/right. */
    .sfh-drop>img:first-child,
    .sfh-portal-photo img.sfh-pp,
    .collectionPortal .photoSlot .sfh-photo{
      width:100%!important;
      height:100%!important;
      max-width:100%!important;
      max-height:100%!important;
      display:block!important;
      object-fit:contain!important;
      object-position:center center!important;
      padding:8px!important;
      box-sizing:border-box!important;
      background:transparent!important;
    }
    .sfh-drop,
    .sfh-portal-photo,
    .collectionPortal .photoSlot{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      background:#eef1f6!important;
      overflow:hidden!important;
    }
    .sfh-drop{min-height:260px!important;height:260px!important}
    .sfh-portal-photo{min-height:300px!important;height:300px!important}
    .collectionPortal .photoSlot{min-height:290px!important;height:290px!important}
    @media(max-width:620px){.sfh-drop{height:390px!important}.sfh-portal-photo{height:390px!important}.collectionPortal .photoSlot{height:390px!important}}
    /* Keep texture/detail visually intact; no blur/filter/forced zoom. */
    .sfh-drop>img:first-child,.sfh-portal-photo img.sfh-pp,.collectionPortal .photoSlot .sfh-photo{filter:none!important;transform:none!important}
  `;
  document.head.appendChild(s);
}

function readLocal(){try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}')||{}}catch(e){return {}}}
function writeLocal(v){localStorage.setItem(LOCAL_KEY,JSON.stringify(v))}
function setLocal(key,index,value){const all=readLocal();if(!Array.isArray(all[key]))all[key]=[];while(all[key].length<4)all[key].push(null);all[key][index]=value;all[key]=all[key].slice(0,4);writeLocal(all)}

function readAsDataUrl(file){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('File could not be read'));r.readAsDataURL(file)})
}

async function qualityResize(file){
  const source=await readAsDataUrl(file);
  const img=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=()=>reject(new Error('This image format is not supported by this browser'));x.src=source});
  const maxSide=2200;
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
  c.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const ctx=c.getContext('2d',{alpha:false});
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,c.width,c.height);
  ctx.drawImage(img,0,0,c.width,c.height);
  let q=.92;
  let out=c.toDataURL('image/jpeg',q);
  while(out.length>MAX_DATA_URL_CHARS && q>.55){q-=.04;out=c.toDataURL('image/jpeg',q)}
  return out;
}

function updateAdminUi(key,index,data){
  const d=document.querySelector(`[data-drop="${key}:${index}"]`);
  if(d){const img=d.querySelector('img:first-child');if(img)img.src=data}
  const card=d?.closest('.sfh-slot');
  const status=card?.querySelector('.sfh-status');
  if(status){status.textContent='✓ Full-resolution-compatible photo active';status.classList.add('active')}
  const head=card?.querySelector('.sfh-slot-head span');
  if(head){head.textContent='CUSTOM';head.className='custom'}
}

async function saveFirebase(key,index,dataUrl){
  try{
    await setDoc(doc(db,FIREBASE_COLLECTION,`${key}-${index+1}`),{
      portal:key,
      slot:index+1,
      dataUrl,
      updatedAt:serverTimestamp(),
      updatedBy:ADMIN_EMAIL,
      photoFit:'contain',
      maxSide:2200
    });
    return true;
  }catch(e){console.warn('SFH high-quality Firebase save:',e);return false}
}

function bindUploadQuality(){
  if(window.__sfhPhotoQualityBound)return;
  window.__sfhPhotoQualityBound=true;
  document.addEventListener('change',e=>{
    const input=e.target?.closest?.('[data-file]');
    if(!input?.files?.[0])return;
    const raw=input.dataset.file||'';
    const [key,indexText]=raw.split(':');
    const index=Number(indexText);
    if(!key||!Number.isInteger(index)||index<0||index>3)return;
    const file=input.files[0];
    setTimeout(async()=>{
      try{
        const data=await qualityResize(file);
        setLocal(key,index,data);
        updateAdminUi(key,index,data);
        const ok=await saveFirebase(key,index,data);
        if(ok){
          const status=document.getElementById('status');
          if(status){status.textContent=`✓ ${key} Photo ${index+1}: full photo preserved and synced to Firebase`;status.className='status ok'}
        }
      }catch(err){console.warn('SFH high quality photo:',err)}
    },1600);
  });
}

function refreshStore(){
  const all=readLocal();
  const map={men:0,women:1,kids:2};
  Object.entries(map).forEach(([key,idx])=>{
    const block=document.querySelectorAll('.collectionBlock')[idx];
    if(!block)return;
    [...block.querySelectorAll('.photoSlot')].slice(0,4).forEach((slot,i)=>{const src=all[key]?.[i];const img=slot.querySelector('.sfh-photo');if(src&&img)img.src=src});
  });
  Object.keys(all).forEach(key=>{
    const card=document.getElementById(`sfh-portal-${key}`);if(!card)return;
    [...card.querySelectorAll('.sfh-portal-photo .sfh-pp')].slice(0,4).forEach((img,i)=>{const src=all[key]?.[i];if(src)img.src=src});
  });
}

function start(){injectCss();bindUploadQuality();refreshStore();setTimeout(refreshStore,2200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
