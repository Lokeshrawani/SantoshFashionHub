// Santosh Fashion Hub — Firebase Web App configuration
// Safe for browser/client-side use. Do NOT put Firebase Admin SDK private keys here.
window.SFH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvTKvrKLl82upwFEO_9gyYa5W727misLo",
  authDomain: "santosh-fashion-hub.firebaseapp.com",
  projectId: "santosh-fashion-hub",
  storageBucket: "santosh-fashion-hub.firebasestorage.app",
  messagingSenderId: "318770842041",
  appId: "1:318770842041:web:9144ddff42a983857b0e68",
  measurementId: "G-PC8SF81YQV"
};

// Load non-critical Firebase/photo enhancement layers after the initial storefront paints.
// The main product UI is available from localStorage immediately; these layers then add
// cross-device photo sync and visual compatibility without blocking first render.
(()=>{
  const load=()=>{
    const imports=[
      './sfh-portal-firebase-sync.js?v=3',
      './sfh-photo-fit-quality-v1.js?v=2',
      './sfh-final-store-visual-fix.js?v=1',
      './sfh-store-final-fix.js?v=2'
    ];
    imports.forEach(src=>import(src).catch(e=>console.warn('SFH deferred layer:',src,e)));
  };
  const run=()=>setTimeout(load,1400);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
