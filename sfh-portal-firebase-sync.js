import './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const ADMIN_EMAIL='santoshrawani123@gmail.com';
const KEY='sfh-collection-photos-v1';
const FIREBASE_COLLECTION='collectionPhotoSlots';
const PORTALS=['men','women','kids','jeans','tshirt','shirt','trouser','jacket','ethnic','activewear','innerwear','accessories'];
const app=getApps().find(a=>a.name==='sfh-portal-firebase-sync-v3')||initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-portal-firebase-sync-v3'});
const auth=getAuth(app);
const db=getFirestore(app);

function readLocal(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function writeLocal(v){localStorage.setItem(KEY,JSON.stringify(v));}
function normalizePhotos(value){const arr=Array.isArray(value)?value.slice(0,4):[];while(arr.length<4)arr.push(null);return arr;}
function localPortal(key){return normalizePhotos(readLocal()[key]);}

async function fetchRemote(){
  const snap=await getDocs(collection(db,FIREBASE_COLLECTION));
  const remote={};
  snap.forEach(d=>{
    const data=d.data()||{};
    const key=data.portal;
    const index=Number(data.slot)-1;
    if(PORTALS.includes(key)&&index>=0&&index<4){
      remote[key]=normalizePhotos(remote[key]);
      remote[key][index]=data.dataUrl||data.url||null;
    }
  });
  const all=readLocal();
  PORTALS.forEach(key=>{if(remote[key]?.some(Boolean))all[key]=normalizePhotos(remote[key])});
  writeLocal(all);
  return remote;
}
async function saveSlot(key,index){
  const value=localPortal(key)[index];
  const id=`${key}-${index+1}`;
  if(!value){await deleteDoc(doc(db,FIREBASE_COLLECTION,id));return;}
  const dataUrl=typeof value==='string'?value:value?.dataUrl||value?.url||'';
  if(!dataUrl)return;
  await setDoc(doc(db,FIREBASE_COLLECTION,id),{portal:key,slot:index+1,dataUrl,updatedAt:serverTimestamp(),updatedBy:ADMIN_EMAIL});
}
async function savePortal(key){for(let i=0;i<4;i++)await saveSlot(key,i)}
async function migrateAll(){
  if(auth.currentUser?.email?.toLowerCase()!==ADMIN_EMAIL)return;
  const all=readLocal();
  for(const key of PORTALS){
    const values=normalizePhotos(all[key]);
    if(values.some(v=>typeof v==='string'&&v.startsWith('data:'))){
      try{await savePortal(key)}catch(e){console.warn('SFH portal migration '+key,e)}
    }
  }
}
function showAdminState(message,ok=false){
  const status=document.getElementById('status');
  if(status){status.textContent=message;status.className='status '+(ok?'ok':'bad');}
}
function bindAdminEvents(){
  if(window.__sfhPortalFirebaseBound)return;
  window.__sfhPortalFirebaseBound=true;
  document.addEventListener('change',e=>{
    const input=e.target?.closest?.('[data-file]');if(!input)return;
    setTimeout(async()=>{
      const [key,index]=input.dataset.file.split(':');if(!PORTALS.includes(key))return;
      try{await saveSlot(key,Number(index));showAdminState(`✓ ${key} Photo ${Number(index)+1} saved to Firebase`,true)}
      catch(err){console.error(err);showAdminState(`Firebase portal save failed: ${err.message||err}`,false)}
    },1100);
  });
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('[data-remove],[data-demo]');if(!btn)return;
    const raw=btn.dataset.remove||btn.dataset.demo;const [key,index]=raw.split(':');
    setTimeout(async()=>{
      if(!PORTALS.includes(key))return;
      try{await saveSlot(key,Number(index));showAdminState(`✓ ${key} Photo ${Number(index)+1} synced to Firebase`,true)}
      catch(err){console.error(err);showAdminState(`Firebase portal update failed: ${err.message||err}`,false)}
    },1000);
  });
}
function renderSyncedPhotos(){
  const all=readLocal();
  ['men','women','kids'].forEach((key,idx)=>{
    const block=document.querySelectorAll('.collectionBlock')[idx];if(!block)return;
    [...block.querySelectorAll('.photoSlot')].slice(0,4).forEach((slot,i)=>{
      const src=all[key]?.[i];if(!src)return;const img=slot.querySelector('.sfh-photo');if(img&&img.src!==src)img.src=src;
    });
  });
  PORTALS.forEach(key=>{
    const card=document.getElementById('sfh-portal-'+key);if(!card)return;
    [...card.querySelectorAll('.sfh-portal-photo .sfh-pp')].slice(0,4).forEach((img,i)=>{const src=all[key]?.[i];if(src&&img.src!==src)img.src=src});
  });
}
async function storeMode(){try{await fetchRemote();renderSyncedPhotos();setTimeout(renderSyncedPhotos,900)}catch(e){console.warn('SFH Firestore portal read:',e)}}
async function adminMode(){
  bindAdminEvents();
  try{
    await migrateAll();
    await fetchRemote();
    renderSyncedPhotos();
    showAdminState('✓ Portal photos connected to Firebase and ready for all devices.',true);
  }catch(e){
    console.warn('SFH Firestore portal sync:',e);
    showAdminState(`Firebase portal sync failed: ${e.message||e}`,false);
  }
}
function start(){const isAdminPage=/\/admin\.html$/i.test(location.pathname);if(isAdminPage){onAuthStateChanged(auth,u=>{if(u?.email?.toLowerCase()===ADMIN_EMAIL)setTimeout(adminMode,600)})}else setTimeout(storeMode,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
