/* Compatibility shim: route legacy checkout buttons to secure Firebase checkout only. */
(function(){
  function openSecureCheckout(){
    if(typeof window.sfhOpenProductionCheckout==="function"){
      window.sfhOpenProductionCheckout();
    }else{
      window.setTimeout(()=>{
        if(typeof window.sfhOpenProductionCheckout==="function")window.sfhOpenProductionCheckout();
        else if(typeof window.toast==="function")window.toast("Secure checkout is still loading. Please try again.");
      },250);
    }
  }
  window.sfhOpenCheckout=openSecureCheckout;
  document.addEventListener("click",event=>{
    const button=event.target.closest?.("button,a");
    if(!button||button.closest("#sfhProductionCheckout"))return;
    const label=(button.textContent||"").toLowerCase();
    if(label.includes("whatsapp checkout")||label.includes("checkout on whatsapp")){
      event.preventDefault();
      event.stopImmediatePropagation();
      openSecureCheckout();
    }
  },true);
})();
