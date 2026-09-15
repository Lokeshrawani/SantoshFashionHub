const products=[
 {id:"M001",name:"Men's Premium T-Shirt",cat:"Men",price:499,icon:"👕"},
 {id:"M002",name:"Men's Casual Shirt",cat:"Men",price:699,icon:"👔"},
 {id:"J001",name:"Men's Denim Jeans",cat:"Jeans",price:999,icon:"👖"},
 {id:"M003",name:"Men's Formal Trouser",cat:"Men",price:799,icon:"👖"},
 {id:"M004",name:"Men's Stylish Jacket",cat:"Jacket",price:1299,icon:"🧥"},
 {id:"K001",name:"Kids Trendy Wear",cat:"Kids",price:599,icon:"🧒"},
 {id:"K002",name:"Kids T-Shirt",cat:"Kids",price:399,icon:"👕"},
 {id:"L001",name:"Ladies Innerwear Collection",cat:"Ladies",price:299,icon:"🩷"}
];
let cart=[];
const grid=document.getElementById("productGrid");
function render(list=products){
 grid.innerHTML=list.map(p=>`<article class="card">
 <div class="cardImg">${p.icon}</div><div class="cardBody">
 <span class="tag">${p.cat.toUpperCase()} • ${p.id}</span><h3>${p.name}</h3>
 <span class="muted">Multiple sizes & varieties available</span>
 <div class="price">₹${p.price.toLocaleString("en-IN")}</div>
 <button class="add" onclick="addCart('${p.id}')">Add to Cart</button></div></article>`).join("");
}
function filterCategory(cat){
 document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
 const list=cat==="All"?products:products.filter(p=>p.cat===cat || (cat==="Men" && ["Jeans","Jacket"].includes(p.cat)));
 render(list); document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function searchProducts(){
 const q=document.getElementById("searchInput").value.toLowerCase().trim();
 render(q?products.filter(p=>(p.name+" "+p.cat).toLowerCase().includes(q)):products);
 document.getElementById("products").scrollIntoView({behavior:"smooth"});
}
function addCart(id){cart.push(products.find(p=>p.id===id));updateCart();}
function updateCart(){
 document.getElementById("cartCount").textContent=cart.length;
}
function openCart(){
 const items=document.getElementById("cartItems");
 items.innerHTML=cart.length?cart.map((p,i)=>`<div class="cartRow"><span>${p.name}<small> (${p.id})</small></span><b>₹${p.price}</b></div>`).join(""):"<p>Your cart is empty.</p>";
 document.getElementById("cartTotal").textContent="₹"+cart.reduce((a,p)=>a+p.price,0).toLocaleString("en-IN");
 document.getElementById("cartModal").classList.remove("hidden");
}
function closeCart(){document.getElementById("cartModal").classList.add("hidden")}
function checkoutWhatsApp(){
 if(!cart.length){alert("Please add a product first.");return}
 const total=cart.reduce((a,p)=>a+p.price,0);
 const lines=cart.map(p=>`${p.id} - ${p.name} - ₹${p.price}`).join("\n");
 const msg=`Hello Santosh Fashion Point,%0A%0AI want to order:%0A${encodeURIComponent(lines)}%0A%0ATotal: ₹${total}%0A%0APlease confirm size, availability and delivery charges.`;
 window.open("https://wa.me/919835567894?text="+msg,"_blank");
}
document.getElementById("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchProducts()});
render();