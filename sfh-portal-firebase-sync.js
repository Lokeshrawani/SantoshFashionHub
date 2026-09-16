import './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';

const ADMIN_EMAIL='santoshrawani123@gmail.com';
const KEY='sfh-collection-photos-v1';
const FIREBASE_COLLECTION='collectionPhotos';
const PORTALS=['men','women','kids','jeans','tshirt','shirt','trouser','jacket','ethnic','activewear','innerwear','accessories'];
const app=getApps().find(a=>a.name==='sfh-portal-firebase-sync-v1')||initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-portal-firebase-sync-v1'});
const auth=getAuth(app);
const db=getFirestore(app);
const storage=getStorage(app);

function readLocal(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return {}}}
function writeLocal(v){localStorage.setItem(KEY,JSON.stringify(v));}
function normalizePhotos(value){
  const arr=Array.isArray(value)?value.slice(0,4):[];
  while(arr.length<4)arr.push(null);
  return arr;
}
function mergeLocal(remote){
  const current=readLocal();
  PORTALS.forEach(k=>{
    if(remote[k]) current[k]=normalizePhotos(remote[k]).map(x=>x?.url||x||null);
  });
  writeLocal(current);
  return current;
}
function dataUrlToBlob(dataUrl){
  const parts=dataUrl.split(',');
  const mime=(parts[0].match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  const bin=atob(parts[1]||'');
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}
async function fetchRemote(){
  const snap=await getDocs(collection(db,FIREBASE_COLLECTION));
  const remote={};
  snap.forEach(d=>{remote[d.id]=d.data()?.photos||[]});
  if(Object.keys(remote).length)mergeLocal(remote);
  return remote;
}
async function savePortal(key){
  const all=readLocal();
  const photos=normalizePhotos(all[key]);
  const result=[];
  for(let i=0;i<4;i++){
    const value=photos[i];
    if(!value){result.push(null);continue}
    if(typeof value==='string' && value.startsWith('data:')){
      const path=`portal-photos/${key}/photo-${i+1}.jpg`;
      const blob=dataUrlToBlob(value);
      const snap=await uploadBytes(ref(storage,path),blob,{contentType:'image/jpeg',cacheControl:'public,max-age=3600'});
      result.push({url:await getDownloadURL(snap.ref),path,slot:i+1});
    }else if(typeof value==='string'){
      result.push({url:value,slot:i+1});
    }else if(value?.url){
      result.push({url:value.url,path:value.path||'',slot:i+1});
    }else result.push(null);
  }
  await setDoc(doc(db,FIREBASE_COLLECTION,key),{
    portal:key,
    photos:result,
    updatedAt:serverTimestamp(),
    updatedBy:ADMIN_EMAIL
  },{merge:true});
  all[key]=result.map(x=>x?.url||null);
  writeLocal(all);
}
async function removePortalSlot(key,index){
  const all=readLocal();
  const photos=normalizePhotos(all[key]);
  const old=photos[index];
  try{
    if(old && typeof old==='object' && old.path)await deleteObject(ref(storage,old.path));
    else if(typeof old==='string' && old.includes('firebasestorage.googleapis.com')){
      const guess=`portal-photos/${key}/photo-${index+1}.jpg`;
      try{await deleteObject(ref(storage,guess))}catch(_){ }
    }
  }catch(e){console.warn('SFH photo delete:',e)}
  photos[index]=null;
  all[key]=photos;
  writeLocal(all);
  await savePortal(key);
}
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
  const authStatus=document.getElementById('authStatus');
  if(authStatus && /Firebase|Storage|portal/i.test(message)){authStatus.textContent=message;authStatus.className='status '+(ok?'ok':'bad');}
}
function bindAdminEvents(){
  document.addEventListener('change',e=>{
    const input=e.target?.closest?.('[data-file]');
    if(!input)return;
    setTimeout(async()=>{
      const [key,index]=input.dataset.file.split(':');
      if(!PORTALS.includes(key))return;
      try{await savePortal(key);showAdminState(`✓ ${key} Photo ${Number(index)+1} saved to Firebase Storage`,true)}catch(err){console.error(err);showAdminState(`Firebase photo upload failed: ${err.message||err}`,false)}
    },900);
  });
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('[data-remove],[data-demo]');
    if(!btn)return;
    const raw=btn.dataset.remove||btn.dataset.demo;
    const [key,index]=raw.split(':');
    setTimeout(async()=>{
      if(!PORTALS.includes(key))return;
      try{
        if(btn.dataset.remove){await removePortalSlot(key,Number(index))}
        else await savePortal(key);
        showAdminState(`✓ ${key} Photo ${Number(index)+1} updated in Firebase`,true);
      }catch(err){console.error(err);showAdminState(`Firebase photo update failed: ${err.message||err}`,false)}
    },800);
  });
}
function renderRemoteIntoLegacySections(){
  const all=readLocal();
  const map=[['men','women','kids']];
  [...document.querySelectorAll('.collectionBlock')].slice(0,3).forEach((block,idx)=>{
    const key=map[0][idx]; if(!key)return;
    [...block.querySelectorAll('.photoSlot')].slice(0,4).forEach((slot,i)=>{
      const src=all[key]?.[i]; if(!src)return;
      const img=slot.querySelector('.sfh-photo');
      if(img && img.src!==src)img.src=src;
    });
  });
  PORTALS.forEach(key=>{
    const card=document.getElementById('sfh-portal-'+key); if(!card)return;
    [...card.querySelectorAll('.sfh-portal-photo .sfh-pp')].slice(0,4).forEach((img,i)=>{const src=all[key]?.[i];if(src&&img.src!==src)img.src=src});
  });
}
async function storeMode(){
  try{
    await fetchRemote();
    renderRemoteIntoLegacySections();
    setTimeout(renderRemoteIntoLegacySections,700);
  }catch(e){console.warn('SFH storefront portal sync:',e)}
}
async function adminMode(user){
  bindAdminEvents();
  try{
    await fetchRemote();
    renderRemoteIntoLegacySections();
    await migrateAll();
    showAdminState('✓ Portal photos connected to Firebase. Uploads will sync across devices.',true);
  }catch(e){
    console.warn('SFH admin portal sync:',e);
    if(String(e?.code||'').includes('storage')||String(e?.message||'').includes('Storage'))showAdminState(`Firebase Storage unavailable: ${e.message||e}. Local fallback remains active.`,false);
  }
}
function start(){
  const isAdminPage=/\/admin\.html$/i.test(location.pathname);
  if(isAdminPage){
    onAuthStateChanged(auth,u=>{if(u?.email?.toLowerCase()===ADMIN_EMAIL)setTimeout(()=>adminMode(u),500)});
  }else{
    setTimeout(storeMode,1200);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
