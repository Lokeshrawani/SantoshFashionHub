/* Santosh Fashion Hub — Step 14: Customer Account in Storefront */
(async function(){
  const CDN='https://www.gstatic.com/firebasejs/12.19.0/';
  let auth=null, db=null;
  let ready=false;

  function cfgReady(c){return c && Object.values(c).every(v=>typeof v==='string'&&v.trim()&&!/^YOUR_/i.test(v));}
  function esc(s){return String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}

  const addAccountButton=()=>{
    const actions=document.querySelector('.headerActions');
    if(!actions||document.getElementById('sfhAccountBtn'))return;
    const b=document.createElement('button');
    b.id='sfhAccountBtn'; b.className='sfh-account-btn'; b.type='button';
    b.innerHTML='<span class="sfh-account-dot"></span><span id="sfhAccountLabel">My Account</span>';
    b.onclick=()=>window.sfhToggleAccount(true);
    actions.insertBefore(b,actions.firstChild);
  };

  const ensurePanel=()=>{
    if(document.getElementById('sfhAccountPanel'))return;
    const backdrop=document.createElement('div'); backdrop.id='sfhAccountBackdrop'; backdrop.className='sfh-account-backdrop'; backdrop.onclick=()=>window.sfhToggleAccount(false);
    const panel=document.createElement('section'); panel.id='sfhAccountPanel'; panel.className='sfh-account-panel';
    panel.innerHTML=`<div class="sfh-account-head"><div><span>SANTOSH FASHION HUB</span><h3 id="sfhAccountTitle">My Account</h3></div><button class="sfh-account-close" type="button" onclick="sfhToggleAccount(false)">×</button></div><div class="sfh-account-body"><div id="sfhAccountContent"></div></div>`;
    document.body.append(backdrop,panel);
  };

  const renderLoggedOut=()=>{
    const box=document.getElementById('sfhAccountContent');
    box.innerHTML=`<form id="sfhAccountForm" class="sfh-account-form"><label>Email<input id="sfhAcctEmail" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="sfhAcctPassword" type="password" required minlength="6" autocomplete="current-password" placeholder="Minimum 6 characters"></label><div class="sfh-account-actions"><button class="primary" type="submit" data-mode="signin">Sign In</button><button type="button" id="sfhAcctSignup">Create Account</button></div><div id="sfhAccountMsg" class="sfh-account-msg"></div></form><div class="sfh-account-links"><a href="./sfh-step13-orders.html">📦 My Orders</a><a href="./sfh-step12-firebase-auth.html">⚙️ Account Setup</a></div><div class="sfh-account-note">Your password is handled by Firebase Authentication. Do not share passwords in WhatsApp.</div>`;
    box.querySelector('#sfhAccountForm').addEventListener('submit',signIn);
    box.querySelector('#sfhAcctSignup').addEventListener('click',signUp);
  };

  const renderLoggedIn=(user)=>{
    const box=document.getElementById('sfhAccountContent');
    box.innerHTML=`<div class="sfh-account-user"><b>${esc(user.email||'Signed-in customer')}</b><span>Customer ID: ${esc(user.uid)}</span></div><div class="sfh-account-links"><a href="./sfh-step13-orders.html">📦 My Orders</a><button type="button" id="sfhAcctLogout">↪ Sign Out</button></div><div id="sfhAccountMsg" class="sfh-account-msg ok">You are signed in. Checkout can be connected to this account.</div>`;
    box.querySelector('#sfhAcctLogout').addEventListener('click',async()=>{try{await auth.signOut();}catch(e){showMsg(e.message||'Sign out failed','bad')}});
  };

  const showMsg=(msg,kind='')=>{const e=document.getElementById('sfhAccountMsg');if(e){e.textContent=msg;e.className='sfh-account-msg '+kind}};

  const updateLabel=(user)=>{
    const label=document.getElementById('sfhAccountLabel'); const btn=document.getElementById('sfhAccountBtn');
    if(!label||!btn)return;
    if(user){label.textContent='Account';btn.classList.add('signed');}else{label.textContent='My Account';btn.classList.remove('signed')}
  };

  const signIn=async(e)=>{
    e.preventDefault(); if(!ready)return showMsg('Firebase is not connected yet.','bad');
    showMsg('Signing in…');
    try{await auth.signInWithEmailAndPassword(document.getElementById('sfhAcctEmail').value.trim(),document.getElementById('sfhAcctPassword').value);showMsg('Signed in successfully.','ok')}
    catch(err){showMsg((err.code||'auth/error').replace('auth/','')||'Sign-in failed.','bad')}
  };

  const signUp=async()=>{
    if(!ready)return showMsg('Firebase is not connected yet.','bad');
    const email=document.getElementById('sfhAcctEmail').value.trim(), password=document.getElementById('sfhAcctPassword').value;
    if(!email||password.length<6)return showMsg('Enter an email and at least 6 characters password.','bad');
    showMsg('Creating account…');
    try{
      const cred=await auth.createUserWithEmailAndPassword(email,password);
      if(db) await db.collection('customers').doc(cred.user.uid).set({email:cred.user.email||'',updatedAt:Date.now(),createdAt:Date.now(),role:'customer'},{merge:true});
      showMsg('Account created successfully.','ok');
    }catch(err){showMsg((err.code||'auth/error').replace('auth/','')||'Account creation failed.','bad')}
  };

  window.sfhToggleAccount=(open)=>{ensurePanel();document.getElementById('sfhAccountPanel').classList.toggle('open',open);document.getElementById('sfhAccountBackdrop').classList.toggle('open',open);document.body.style.overflow=open?'hidden':''};

  addAccountButton(); ensurePanel();
  try{
    const module=await import('./firebase-config.js');
    const cfg=module?.default||window.SFH_FIREBASE_CONFIG;
    if(!cfgReady(cfg)){renderLoggedOut();return;}
    const [{initializeApp},{getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut},{getFirestore,doc,setDoc,serverTimestamp}]=await Promise.all([
      import(CDN+'firebase-app.js'),
      import(CDN+'firebase-auth.js'),
      import(CDN+'firebase-firestore.js')
    ]);
    const app=initializeApp(cfg); auth=getAuth(app); db=getFirestore(app); ready=true;
    auth.signInWithEmailAndPassword=signInWithEmailAndPassword.bind(null,auth);
    auth.createUserWithEmailAndPassword=createUserWithEmailAndPassword.bind(null,auth);
    auth.signOut=signOut.bind(null,auth);
    db.collection=(path)=>({doc:(id)=>({set:(data,opts)=>setDoc(doc(db,path,id),data,opts)})});
    onAuthStateChanged(auth,user=>{updateLabel(user);if(document.getElementById('sfhAccountPanel')?.classList.contains('open')) user?renderLoggedIn(user):renderLoggedOut()});
    renderLoggedOut();
  }catch(e){renderLoggedOut();}

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-account-open]');
    if(btn){e.preventDefault();window.sfhToggleAccount(true)}
  });
})();
