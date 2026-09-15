import './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getFirestore,collection,getDocs} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const app=initializeApp(window.SFH_FIREBASE_CONFIG,{name:'sfh-store-bridge'});
const db=getFirestore(app);
const KEY='sfh-products';
const SYNC_KEY='sfh-products-firebase-synced';
async function sync(){try{const snap=await getDocs(collection(db,'products'));if(!snap.size)return;const products=snap.docs.map(d=>({id:d.id,...d.data()}));localStorage.setItem(KEY,JSON.stringify(products));if(sessionStorage.getItem(SYNC_KEY)!=='1'){sessionStorage.setItem(SYNC_KEY,'1');location.reload()}}catch(error){console.warn('Santosh Fashion Hub Firebase product sync skipped:',error)}}
sync();
