
const state = {
  products: [],
  services: [],
  cart: JSON.parse(localStorage.getItem('petflu-cart')||'[]'),
  bookings: JSON.parse(localStorage.getItem('petflu-bookings')||'[]')
};
const fmtBRL = v => v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

function saveCart(){
  localStorage.setItem('petflu-cart', JSON.stringify(state.cart));
  document.getElementById('cart-count').textContent = state.cart.reduce((a,b)=>a+b.qtd,0);
}
function addToCart(item){
  const found = state.cart.find(i=>i.id===item.id);
  if(found){ found.qtd += 1; } else { state.cart.push({...item, qtd:1}); }
  saveCart(); renderCart();
}
function removeFromCart(id){
  const i = state.cart.findIndex(x=>x.id===id);
  if(i>=0){ state.cart.splice(i,1); saveCart(); renderCart(); }
}
function renderCart(){
  const box = document.getElementById('cart-items');
  const total = state.cart.reduce((sum,i)=>sum+i.price*i.qtd,0);
  document.getElementById('cart-total').textContent = total.toLocaleString('pt-BR', {minimumFractionDigits:2});
  box.innerHTML = '';
  if(state.cart.length===0){ box.innerHTML='<p class="muted">Seu carrinho está vazio.</p>'; return; }
  state.cart.forEach(i=>{
    const el = document.createElement('div');
    el.className='cart-item';
    el.innerHTML = `
      <span>${i.name} × ${i.qtd}</span>
      <span>${fmtBRL(i.price)}</span>
      <button class="btn btn-outline" aria-label="Remover ${i.name} do carrinho">Remover</button>
    `;
    el.querySelector('button').onclick = ()=>removeFromCart(i.id);
    box.appendChild(el);
  });
}

async function loadData(){
  const [prodRes, servRes] = await Promise.all([
    fetch('data/products.json'),
    fetch('data/services.json')
  ]);
  state.products = (await prodRes.json()).categories;
  state.services = await servRes.json();
}
function renderCatalog(){
  const grid = document.getElementById('catalog');
  grid.innerHTML = '';
  state.products.forEach(cat=>{
    cat.items.forEach(p=>{
      const card = document.createElement('article');
      card.className='card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <div class="card-body">
          <div class="row between">
            <h3>${p.name}</h3>
            <span class="price">${fmtBRL(p.price)}</span>
          </div>
          <p class="muted">${p.desc}</p>
          <button class="btn btn-primary">Adicionar ao carrinho</button>
        </div>
      `;
      card.querySelector('button').onclick = ()=>addToCart({id:p.id,name:p.name,price:p.price});
      grid.appendChild(card);
    });
  });
}
function renderServices(){
  const sel = document.getElementById('service');
  sel.innerHTML = '';
  state.services.filter(s=>['banho','tosa','banho-tosa'].includes(s.id)).forEach(s=>{
    const opt = document.createElement('option');
    opt.value = s.id; opt.textContent = `${s.name} — ${fmtBRL(s.base_price)}`;
    sel.appendChild(opt);
  });
}
function initCartDialog(){
  const dialog = document.getElementById('cart-dialog');
  document.getElementById('open-cart').onclick = ()=>{ renderCart(); dialog.showModal(); };
  document.getElementById('checkout').onclick = (e)=>{
    e.preventDefault();
    if(state.cart.length===0) return;
    alert('Compra simulada com sucesso! (demonstrativo)');
    state.cart = []; saveCart(); renderCart();
  };
}
function initBooking(){
  const form = document.getElementById('booking-form');
  const pickup = document.getElementById('pickup');
  const msg = document.getElementById('booking-msg');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const s = document.getElementById('service').value;
    const petSize = document.getElementById('pet-size').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const petName = document.getElementById('pet-name').value.trim();
    const notes = document.getElementById('notes').value.trim();
    if(!date || !time || !petName){ msg.textContent='Preencha os campos obrigatórios.'; return; }
    const base = state.services.find(x=>x.id===s).base_price;
    const factor = petSize==='grande' ? 1.4 : petSize==='medio' ? 1.2 : 1;
    let total = base*factor;
    const tb = state.services.find(x=>x.id==='tele-busca').base_price;
    if(pickup.checked) total += tb;
    const booking = {id:'b'+Date.now(), service:s, petSize, date, time, petName, notes, pickup:pickup.checked, total};
    state.bookings.push(booking);
    localStorage.setItem('petflu-bookings', JSON.stringify(state.bookings));
    msg.textContent = 'Agendamento realizado! Total: '+fmtBRL(total);
    form.reset();
  });
}
async function main(){
  document.getElementById('cart-count').textContent = state.cart.reduce((a,b)=>a+b.qtd,0);
  await loadData();
  renderCatalog();
  renderServices();
  initCartDialog();
  initBooking();
}
main();
