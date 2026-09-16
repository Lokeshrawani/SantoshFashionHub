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

// Cross-device fashion-portal sync + universal full-photo fit/quality + final storefront UI fix.
(()=>{
  const load=()=>{
    import('./sfh-portal-firebase-sync.js?v=3').catch(e=>console.warn('SFH portal sync load:',e));
    import('./sfh-photo-fit-quality-v1.js?v=2').catch(e=>console.warn('SFH photo quality load:',e));
    import('./sfh-final-store-visual-fix.js?v=1').catch(e=>console.warn('SFH visual fix load:',e));
    import('./sfh-store-final-fix.js?v=1').catch(e=>console.warn('SFH store final fix load:',e));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,0),{once:true});
  else setTimeout(load,0);
})();
