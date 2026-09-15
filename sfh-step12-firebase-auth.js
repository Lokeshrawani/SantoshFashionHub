import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const checks=document.getElementById('checks');
const badge=document.getElementById('configBadge');
const title=document.getElementById('connectionTitle');
const text=document.getElementById('connectionText');
const authMsg=document.getElementById('authMsg');
const userBox=document.getElementById('userBox');
const logoutBtn=document.getElementById('logoutBtn');
const signupBtn=document.getElementById('signupBtn');

function isConfigReady(c){return c && Object.values(c).every(v=>typeof v==='string'&&v.trim()&& !/^YOUR_/i.test(v));}
function setMessage(msg,kind=''){authMsg.textContent=msg;authMsg.className='message '+kind;}
function check(name,ok,detail){return `<div class="check"><b>${ok?'✅':'⚠️'} ${name}</b><span>${detail}</span></div>`;}

let cfg;
try{
  await import('./firebase-config.js');
  cfg=window.SFH_FIREBASE_CONFIG;
}catch(e){cfg=null;}

if(!isConfigReady(cfg)){
  badge.textContent='⚠️ Firebase config not connected'; badge.classList.add('bad');
  title.textContent='One setup step is still required';
  text.innerHTML='Your <code>firebase-config.js</code> still contains placeholder values. Register a Firebase Web App and paste its Web App config into that file.';
  checks.innerHTML=check('Config',false,'Add your Firebase Web App config first')+check('Authentication',false,'Enable Email/Password in Firebase Console')+check('Firestore',false,'Create Firestore Database and apply secure rules');
  signupBtn.disabled=true; document.querySelector('[data-mode="signin"]').disabled=true;
}else{
  try{
    const app=initializeApp(cfg);
    const auth=getAuth(app);
    getFirestore(app);
    badge.textContent='✅ Firebase SDK initialized'; badge.classList.add('ok');
    title.textContent='Firebase connection is ready';
    text.textContent='Authentication and Firestore clients initialized in the browser.';
    checks.innerHTML=check('Config',true,'Web App configuration found')+check('Authentication',true,'SDK client initialized; provider still must be enabled in Console')+check('Firestore',true,'SDK client initialized; database/rules must be created in Console');

    onAuthStateChanged(auth,user=>{
      if(user){
        userBox.classList.remove('hidden'); userBox.innerHTML=`Signed in as <b>${user.email||user.uid}</b><br>UID: ${user.uid}`;
        logoutBtn.classList.remove('hidden');
      }else{
        userBox.classList.add('hidden'); logoutBtn.classList.add('hidden');
      }
    });

    document.getElementById('authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const email=document.getElementById('email').value.trim();
      const password=document.getElementById('password').value;
      setMessage('Signing in…');
      try{await signInWithEmailAndPassword(auth,email,password);setMessage('Signed in successfully.','ok');}
      catch(err){setMessage(err.code?.replace('auth/','')||'Sign-in failed. Enable Email/Password in Firebase Console.','bad');}
    });

    signupBtn.addEventListener('click',async()=>{
      const email=document.getElementById('email').value.trim();
      const password=document.getElementById('password').value;
      if(!email||password.length<6){setMessage('Enter an email and a password with at least 6 characters.','bad');return;}
      setMessage('Creating account…');
      try{
        const cred=await createUserWithEmailAndPassword(auth,email,password);
        const db=getFirestore(app);
        await setDoc(doc(db,'customers',cred.user.uid),{email:cred.user.email||'',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),role:'customer'},{merge:true});
        setMessage('Account created successfully.','ok');
      }catch(err){setMessage(err.code?.replace('auth/','')||'Account creation failed.','bad');}
    });

    logoutBtn.addEventListener('click',async()=>{await signOut(auth);setMessage('Signed out.','ok');});
  }catch(err){
    badge.textContent='❌ Firebase initialization error'; badge.classList.add('bad');
    title.textContent='Firebase could not initialize'; text.textContent=err.message||'Check the Web App config values.';
    checks.innerHTML=check('Config',true,'File found')+check('Initialization',false,'Check project ID, app ID and other config values')+check('Console',false,'Verify the registered Web App matches this config');
    signupBtn.disabled=true; document.querySelector('[data-mode="signin"]').disabled=true;
  }
}
