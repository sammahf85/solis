/* Solis — Shop, Customer, Driver and Delivery Company apps */
(function(){
const APP=window.APP||'customer';
const MIN=60000;
const $app=document.getElementById('app');
const DEMO=/[?&]demo\b/.test(location.search);
const EMBED=/[?&]embed\b/.test(location.search);
const AUTO=/[?&]auto\b/.test(location.search);

/* ============ DEFAULT DATA ============ */
function baseData(){
  const m=(name,cat,price,emoji,desc,custom,i)=>({id:uid(),ord:i,name,cat,price,emoji,desc,custom,available:true});
  const list=[
    ['Espresso','Hot Coffee',2,'☕','Double shot, rich crema',true],
    ['Cappuccino','Hot Coffee',3.5,'☕','Espresso, steamed milk, thick foam',true],
    ['Caffè Latte','Hot Coffee',3.75,'🥛','Smooth espresso with silky milk',true],
    ['Spanish Latte','Hot Coffee',4.25,'🍯','Latte sweetened with condensed milk',true],
    ['Americano','Hot Coffee',2.75,'☕','Espresso topped with hot water',true],
    ['Iced Latte','Iced & Cold',4,'🧊','Espresso and cold milk over ice',true],
    ['Iced Americano','Iced & Cold',3.25,'🧊','Bold, refreshing, over ice',true],
    ['Caramel Frappé','Iced & Cold',4.75,'🥤','Blended ice, caramel & cream',true],
    ['Cold Brew','Iced & Cold',4.25,'🫙','Steeped 18 hours, served cold',true],
    ['Matcha Latte','Tea & More',4.5,'🍵','Ceremonial matcha with milk',true],
    ['Hot Chocolate','Tea & More',3.75,'🍫','Rich Belgian chocolate',true],
    ['Fresh Mint Tea','Tea & More',2.25,'🌿','Fresh mint leaves, lightly sweet',false],
    ['Butter Croissant','Bakery',2.25,'🥐','Flaky, baked this morning',false],
    ['Chocolate Croissant','Bakery',2.75,'🥐','Filled with dark chocolate',false],
    ['Zaatar Croissant','Bakery',2.5,'🥐','Zaatar & olive oil',false],
    ['Cheesecake Slice','Bakery',4.5,'🍰','New York style, berry coulis',false],
    ['Chocolate Chip Cookie','Bakery',1.75,'🍪','Soft and chewy',false]
  ];
  return {
    settings:{name:'Solis Café',address:'Main Street, Byblos',phone:'+961 3 123 456',fee:2,eta:30,rate:89500,mode:'both',open:true,autoPartner:'',pin:'1234'},
    menu:list.map((x,i)=>m(...x,i))
  };
}
async function loadDemo(){
  const t=now();
  const d1={id:uid(),ord:1,name:'Elie Khoury',phone:'+961 70 123 456',vehicle:'Motorbike',pin:'1111',online:true};
  const d2={id:uid(),ord:2,name:'Karim Saad',phone:'+961 71 987 654',vehicle:'Motorbike',pin:'2222',online:true};
  const p1={id:uid(),ord:1,name:'SwiftRun Delivery',phone:'+961 70 111 222',contact:'Dispatch desk',fee:1.5,pin:'5555',active:true};
  const p2={id:uid(),ord:2,name:'CityDash Couriers',phone:'+961 71 333 444',contact:'Rami',fee:2,pin:'6666',active:true};
  S.drivers.push(d1,d2);S.partners.push(p1,p2);
  const it=(name,qty,unit,opt)=>({name,qty,unit,opt:opt||''});
  const mk=async(ago,type,cust,items,payment,status,dlv,extra)=>{
    const sub=items.reduce((a,i)=>a+i.qty*i.unit,0),fee=type==='delivery'?S.settings.fee:0,tt=t-ago*MIN;
    const o=Object.assign({id:uid(),no:await Sync.nextNo(),t:tt,type,cust,items,sub,fee,total:sub+fee,payment,paid:false,status,dlv,times:{new:tt},log:[{t:tt,m:'Order placed'}]},extra||{});
    S.orders.unshift(o);
  };
  await mk(18,'delivery',{name:'Joelle Haddad',phone:'+961 76 321 654',address:'Jbeil, Rue Pépé Abed, Bldg 9, 3rd floor',notes:''},[it('Iced Latte',2,4.75,'Large'),it('Chocolate Chip Cookie',2,1.75)],'cash','out',{method:'inhouse',driverId:d1.id});
  await mk(9,'delivery',{name:'Karim Nassar',phone:'+961 3 777 210',address:'Blat, main road, Villa Nassar',notes:'Call on arrival'},[it('Cold Brew',1,4.25,'Medium'),it('Zaatar Croissant',1,2.5)],'omt','ready',{method:null},{paid:true});
  await mk(12,'delivery',{name:'Rita Sfeir',phone:'+961 71 444 555',address:'Byblos Old Souk, near the castle, shop 3',notes:''},[it('Spanish Latte',2,4.25,'Medium'),it('Butter Croissant',1,2.25)],'cash','preparing',{method:'partner',partnerId:p1.id,pStatus:'requested',fee:p1.fee});
  await mk(7,'pickup',{name:'Maya Haddad',phone:'+961 70 222 333',address:'',notes:''},[it('Iced Latte',1,4.75,'Large'),it('Cheesecake Slice',1,4.5)],'cash','preparing',{method:null});
  await mk(2,'delivery',{name:'Nadim Rizk',phone:'+961 3 456 789',address:'Amchit, main road, Bldg 14, 2nd floor',notes:'Ring twice'},[it('Cappuccino',2,4,'Medium, Oat'),it('Zaatar Croissant',2,2.5)],'whish','new',{method:null});
}

/* ============ UI STATE ============ */
const ui={shopTab:'orders',cScreen:'menu',cCat:'All',cart:[],trackId:null,modal:null,drafts:{},resetArm:false,clearArm:false,pinFor:null,pinErr:'',ready:false,error:'',showInstallHelp:false};

/* ============ HELPERS ============ */
const now=()=>Date.now();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+(+n||0).toFixed(2);
const lbp=n=>(Math.round(n*((S.settings&&S.settings.rate)||89500)/1000)*1000).toLocaleString('en-US')+' LBP';
const ago=t=>{const m=Math.floor((now()-t)/MIN);return m<1?'just now':m<60?m+' min ago':Math.floor(m/60)+' h ago';};
const clock=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const isToday=t=>new Date(t).toDateString()===new Date().toDateString();
const O=id=>S.orders.find(o=>o.id===id);
const D=id=>S.drivers.find(d=>d.id===id);
const P=id=>S.partners.find(p=>p.id===id);
const PAY={cash:'Cash on delivery',card:'Card on delivery',whish:'Whish Money',omt:'OMT Pay'};
const ST={new:'New',preparing:'Preparing',ready:'Ready',out:'Out for delivery',delivered:'Delivered',cancelled:'Cancelled'};
const PST={requested:'Waiting for company to accept',accepted:'Rider heading to shop',picked:'Rider picked up — on the way',delivered:'Delivered'};
const MODE={inhouse:'Own drivers only',outsourced:'Delivery company only',both:'Own drivers + delivery company'};
const MODE_D={inhouse:'Your drivers receive every delivery in the Driver app.',outsourced:'You have no drivers — every delivery is sent to a delivery company to pick up.',both:'Choose per order: give it to your own driver or send it to a delivery company.'};
const SIZES=[['S','Small',-0.5],['M','Medium',0],['L','Large',0.75]];
const MILKS=[['Regular',0],['Oat',0.5],['Almond',0.5],['Lactose-free',0.25],['No milk',0]];
const SUGARS=['No sugar','Less sugar','Normal','Extra sweet'];
const delta=p=>p?` ${p>0?'+':'−'}${money(Math.abs(p))}`:'';
const isWallet=o=>['whish','omt'].includes(o.payment);
const collectAmt=o=>(['cash','card'].includes(o.payment)&&!o.paid)?o.total:0;
const log=(o,m)=>{o.log=o.log||[];o.log.push({t:now(),m});};
function setStatus(o,s,msg){o.status=s;o.times=o.times||{};o.times[s]=now();log(o,msg||ST[s]);}
const activeJobs=id=>S.orders.filter(o=>o.dlv.method==='inhouse'&&o.dlv.driverId===id&&['preparing','ready','out'].includes(o.status)).length;
const cashHeld=id=>S.orders.filter(o=>o.cashBy===id&&!o.settled).reduce((a,o)=>a+(o.collected||0),0);
const digits=s=>String(s||'').replace(/\D/g,'');
const mapLink=a=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a);
const qtyOf=o=>o.items.reduce((a,i)=>a+i.qty,0);
function unitPrice(it,m){if(!it.custom)return it.price;const s=SIZES.find(x=>x[0]===m.size),k=MILKS.find(x=>x[0]===m.milk);return it.price+(s?s[2]:0)+(k?k[1]:0)+(m.shot?0.75:0);}
function optStr(it,m){if(!it.custom)return '';const s=SIZES.find(x=>x[0]===m.size);return [s?s[1]:'',m.milk!=='Regular'?m.milk:'',m.sugar!=='Normal'?m.sugar:'',m.shot?'Extra shot':''].filter(Boolean).join(', ');}
const cartSub=()=>ui.cart.reduce((a,l)=>a+l.unit*l.qty,0);
const cartQty=()=>ui.cart.reduce((a,l)=>a+l.qty,0);
const nextOrd=arr=>arr.reduce((a,x)=>Math.max(a,x.ord||0),0)+1;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2600);}
const isTyping=()=>{const a=document.activeElement;return a&&['INPUT','TEXTAREA','SELECT'].includes(a.tagName);};
const appLink=name=>(location.protocol==='file:'?new URL('../'+name+'/index.html',location.href).href:new URL('../'+name+'/',location.href).href)+(DEMO?'?demo=1':'');

/* alert sound */
let actx=null;
document.addEventListener('pointerdown',()=>{try{if(!actx){const C=window.AudioContext||window.webkitAudioContext;if(C)actx=new C();}if(actx&&actx.state==='suspended')actx.resume();}catch(e){}});
function beep(){try{navigator.vibrate&&navigator.vibrate([200,100,200]);}catch(e){}try{if(!actx)return;[0,0.25].forEach(d=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);const t=actx.currentTime+d;g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.start(t);o.stop(t+.22);});}catch(e){}}

/* install as app */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;render();});
window.addEventListener('appinstalled',()=>{installEvt=null;toast('App installed');render();});
const standalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function installBtn(dark){
  if(standalone()||location.protocol==='file:')return '';
  if(installEvt||isIOS())return `<button class="btn sm ${dark?'ghost':'acc'}" data-a="install">📲 Install app</button>`;
  return '';
}

function reqText(o){
  const s=S.settings,amt=collectAmt(o);
  return `DELIVERY PICKUP REQUEST\n${s.name} — Order #${o.no}\nPickup: ${s.address} (${s.phone})\nDrop-off: ${o.cust.address}\nCustomer: ${o.cust.name} ${o.cust.phone}\nItems: ${qtyOf(o)}\nCollect from customer: ${amt?money(amt):'Nothing — prepaid'}${o.cust.notes?'\nNotes: '+o.cust.notes:''}`;
}
const waLink=o=>{const p=P(o.dlv.partnerId);return 'https://wa.me/'+digits(p&&p.phone)+'?text='+encodeURIComponent(reqText(o));};
function sendToPartner(o,p){o.dlv={method:'partner',partnerId:p.id,pStatus:'requested',fee:+p.fee||0};log(o,'Pickup request sent to '+p.name);}
function finishDelivery(o,by,msg){
  o.collected=collectAmt(o);
  if(o.collected){o.cashBy=by;o.paid=true;}
  o.settled=false;
  if(o.dlv.method==='partner')o.dlv.pStatus='delivered';
  setStatus(o,'delivered',msg);
}
function byWho(o){
  if(o.type==='pickup')return '—';
  if(o.dlv.method==='inhouse'){const d=D(o.dlv.driverId);return '🛵 '+esc(d?d.name:'Driver');}
  if(o.dlv.method==='partner'){const p=P(o.dlv.partnerId);return '🏢 '+esc(p?p.name:'Company');}
  return '—';
}
const cupSvg='<svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M5 12h18v7a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-7z" fill="#c98a3d"/><path d="M23 14h2a3 3 0 0 1 0 6h-2" stroke="#c98a3d" stroke-width="2.5"/><path d="M10 4c-1 2 1 3 0 5M15 4c-1 2 1 3 0 5" stroke="#e9d8c8" stroke-width="1.8" stroke-linecap="round"/></svg>';
function pinScreen(title,sub,backAction){
  return `<div class="pinbox"><h2>${title}</h2><p class="muted sm">${sub}</p>
    <form data-f="pin" class="form"><input name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN" maxlength="8" autofocus required>
    ${ui.pinErr?`<div class="tag bad">${esc(ui.pinErr)}</div>`:''}<button class="btn pri big">Log in</button></form>
    ${backAction?`<button class="btn ghost full" data-a="${backAction}">‹ Back</button>`:''}</div>`;
}

/* ============ SHOP ============ */
function vShop(){
  const s=S.settings;
  if(!ME.shopOk)return `<div class="wrap narrow"><div class="brandrow">${cupSvg}<b>${esc(s.name)}</b></div>${pinScreen('Shop dashboard','Enter the shop PIN to continue.'+(DEMO?' <b>Demo PIN: '+esc(s.pin)+'</b>':''))}</div>`;
  const n=S.orders.filter(o=>o.status==='new').length;
  const tabs=[['orders','Live orders'],['menu','Menu'],['drivers','Drivers'],['partners','Delivery companies'],['reports','Reports'],['settings','Settings']];
  const views={orders:sOrders,menu:sMenu,drivers:sDrivers,partners:sPartners,reports:sReports,settings:sSettings};
  return `<header class="top"><div class="logo">${cupSvg}${esc(s.name)}</div><span class="live ${Sync.mode}">${Sync.mode==='cloud'?'● Live':DEMO?'● Demo':'● This device only'}</span>
    <div class="row right">${installBtn(true)}<button class="btn ghost sm" data-a="lockShop">Lock</button></div></header>
  <div class="wrap">
  <div class="shophead"><div class="muted sm">${esc(s.address)} · Delivery: <b>${MODE[s.mode]}</b></div>
  <button class="switch ${s.open?'on':''}" data-a="toggleOpen"><span></span>${s.open?'Open — accepting orders':'Closed — not accepting orders'}</button></div>
  <nav class="subnav">${tabs.map(([k,l])=>`<button class="${ui.shopTab===k?'on':''}" data-a="shopTab" data-k="${k}">${l}${k==='orders'&&n?`<span class="badge">${n}</span>`:''}</button>`).join('')}</nav>
  ${views[ui.shopTab]()}</div>`;
}
function sOrders(){
  const act=S.orders.filter(o=>!['delivered','cancelled'].includes(o.status)).sort((a,b)=>a.t-b.t);
  const cols=[['new','New'],['preparing','Preparing'],['ready','Ready'],['out','Out for delivery']];
  const done=S.orders.filter(o=>['delivered','cancelled'].includes(o.status)&&isToday(o.t));
  return `<div class="board">${cols.map(([k,l])=>{const list=act.filter(o=>o.status===k);return `<section class="col"><h3>${l}<span class="cnt">${list.length}</span></h3>${list.map(orderCard).join('')||'<div class="empty sm">No orders</div>'}</section>`;}).join('')}</div>
  <h2 class="sec">Completed today</h2>${doneTable(done)}`;
}
function orderCard(o){
  const b=(a,l,c='')=>`<button class="btn sm ${c}" data-a="${a}" data-id="${o.id}">${l}</button>`;
  const btns=[];
  if(o.status==='new')btns.push(b('accept','Accept','pri'),b('reject','Reject','ghost'));
  if(o.status==='preparing')btns.push(b('ready','Mark ready','pri'));
  if(o.status==='ready'&&o.type==='pickup')btns.push(b('handover','Handed to customer','pri'));
  if(o.type==='delivery'&&['preparing','ready'].includes(o.status)){
    if(!o.dlv.method)btns.push(b('dispatch','🛵 Dispatch','acc'));
    else if(o.dlv.method==='inhouse'||o.dlv.pStatus!=='picked')btns.push(b('undispatch','Reassign','ghost'));
  }
  if(o.status==='out')btns.push(b('forceDone','Mark delivered','ghost'));
  if(isWallet(o)&&!o.paid&&o.status!=='cancelled')btns.push(b('paid','Confirm payment received','ghost'));
  return `<article class="card ord ${o.status}">
    <div class="row"><b>#${o.no}</b><span class="tag ${o.type}">${o.type==='delivery'?'Delivery':'Pickup'}</span><span class="muted sm right">${ago(o.t)}</span></div>
    <div class="cname">${esc(o.cust.name)} <span class="muted sm">${esc(o.cust.phone)}</span></div>
    ${o.type==='delivery'?`<div class="sm muted">📍 ${esc(o.cust.address)}</div>`:''}
    <ul class="items">${o.items.map(i=>`<li>${i.qty}× ${esc(i.name)}${i.opt?` <span class="muted sm">(${esc(i.opt)})</span>`:''}</li>`).join('')}</ul>
    ${o.cust.notes?`<div class="note">📝 ${esc(o.cust.notes)}</div>`:''}
    <div class="row"><b>${money(o.total)}</b><span class="sm right">${PAY[o.payment]} ${isWallet(o)?(o.paid?'<span class="tag ok">Paid</span>':'<span class="tag warn">Unpaid</span>'):''}</span></div>
    ${o.type==='delivery'?`<div class="dl">${dlvLine(o)}</div>`:''}
    <div class="acts">${btns.join('')}</div></article>`;
}
function dlvLine(o){
  const d=o.dlv;
  if(!d.method)return `${d.declinedBy?`<span class="tag bad">Declined by ${esc(d.declinedBy)}</span> `:''}<span class="tag warn">Not dispatched yet</span>${S.settings.mode!=='outsourced'&&!d.declinedBy?'<div class="sm muted">Online drivers can also take it from their app.</div>':''}`;
  if(d.method==='inhouse'){const dr=D(d.driverId);return `🛵 Own driver: <b>${esc(dr?dr.name:'—')}</b> <span class="dot ${dr&&dr.online?'on':''}"></span>${o.status==='out'?' · <b>on the way</b>':o.status==='ready'?' · coming to pick up':''}`;}
  const p=P(d.partnerId);
  return `🏢 <b>${esc(p?p.name:'Delivery company')}</b> · fee ${money(d.fee)}<br><span class="tag ${d.pStatus==='requested'?'warn':'ok'}">${PST[d.pStatus]||''}</span>
    ${d.rider?`<div class="sm">Rider: <b>${esc(d.rider)}</b> ${esc(d.riderPhone||'')}</div>`:''}
    ${['requested','accepted'].includes(d.pStatus)?`<div class="sm"><a href="${waLink(o)}" target="_blank" rel="noopener">Send on WhatsApp</a> · <a href="#" data-a="copyReq" data-id="${o.id}">Copy request</a></div>`:''}`;
}
function doneTable(list){
  if(!list.length)return '<div class="empty">Nothing completed yet today.</div>';
  return `<div class="tablewrap"><table><tr><th>#</th><th>Time</th><th>Customer</th><th>Type</th><th>Delivered by</th><th>Payment</th><th>Total</th><th>Status</th></tr>
  ${list.map(o=>`<tr><td>${o.no}</td><td>${clock(o.t)}</td><td>${esc(o.cust.name)}</td><td>${o.type==='delivery'?'Delivery':'Pickup'}</td><td>${byWho(o)}</td><td>${PAY[o.payment]}</td><td>${money(o.total)}</td><td><span class="tag ${o.status==='cancelled'?'bad':'ok'}">${o.status==='cancelled'?'Cancelled':(o.type==='pickup'?'Collected':'Delivered')}</span></td></tr>`).join('')}</table></div>`;
}
function sMenu(){
  const cats=[...new Set(S.menu.map(m=>m.cat))];
  return `<form class="card" data-f="addItem"><h3>Add menu item</h3><div class="formrow">
    <label class="f">Name<input name="name" required></label>
    <label class="f">Category<input name="cat" list="cats" required placeholder="Hot Coffee"></label>
    <label class="f">Price ($)<input name="price" type="number" step="0.25" min="0" required></label>
    <label class="f">Icon<input name="emoji" value="☕" maxlength="4"></label>
    <label class="f">Description<input name="desc"></label>
    <label class="f"><span><input type="checkbox" name="custom" style="width:auto"> Drink options (size, milk, sugar)</span></label>
    <button class="btn pri">Add item</button></div>
    <datalist id="cats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></form>
  <div class="tablewrap"><table><tr><th></th><th>Item</th><th>Category</th><th>Price</th><th>Options</th><th>Available</th><th></th></tr>
  ${S.menu.map(m=>`<tr><td style="font-size:22px">${esc(m.emoji)}</td><td><b>${esc(m.name)}</b><div class="sm muted">${esc(m.desc)}</div></td><td>${esc(m.cat)}</td>
  <td><input type="number" step="0.25" min="0" value="${m.price}" data-ch="price" data-id="${m.id}" style="width:90px"></td>
  <td class="sm">${m.custom?'Size · milk · sugar · shot':'—'}</td>
  <td><button class="switch ${m.available?'on':''}" data-a="avail" data-id="${m.id}"><span></span></button></td>
  <td><button class="btn ghost sm" data-a="delItem" data-id="${m.id}">Delete</button></td></tr>`).join('')}</table></div>`;
}
function sDrivers(){
  return `${S.settings.mode==='outsourced'?'<div class="note">Delivery mode is “Delivery company only”, so your own drivers won’t get jobs. Change it in Settings.</div>':''}
  <form class="card" data-f="addDriver"><h3>Add driver</h3><div class="formrow">
    <label class="f">Name<input name="name" required></label><label class="f">Phone<input name="phone" required></label>
    <label class="f">Vehicle<input name="vehicle" placeholder="Motorbike"></label>
    <label class="f">Login PIN<input name="pin" inputmode="numeric" minlength="4" maxlength="8" required placeholder="4 digits"></label>
    <button class="btn pri">Add driver</button></div></form>
  <div class="grid2">${S.drivers.map(d=>{const n=S.orders.filter(o=>o.status==='delivered'&&o.dlv.method==='inhouse'&&o.dlv.driverId===d.id&&isToday(o.t)).length;
    return `<div class="card"><div class="row"><b>${esc(d.name)}</b><span class="dot ${d.online?'on':''}"></span><span class="sm muted">${d.online?'Online':'Offline'}</span></div>
    <div class="sm muted">${esc(d.phone)} · ${esc(d.vehicle||'')} · PIN ${esc(d.pin||'')}</div>
    <div class="sm mt">${activeJobs(d.id)} active · ${n} delivered today · cash held <b>${money(cashHeld(d.id))}</b></div>
    <div class="acts"><button class="btn ghost sm" data-a="delDriver" data-id="${d.id}">Remove</button></div></div>`;}).join('')||'<div class="empty">No drivers yet.</div>'}</div>
  <div class="card mt"><b>Driver app link</b><div class="sm muted">Send this link to your drivers. They open it on their phone, install the app and log in with their PIN.</div>${linkRow('driver')}</div>`;
}
function linkRow(name){const u=appLink(name);return `<div class="linkrow"><code>${esc(u)}</code><button class="btn sm" data-a="copyText" data-t="${esc(u)}">Copy</button><a class="btn sm ghost" href="${esc(u)}" target="_blank" rel="noopener">Open</a></div>`;}
function sPartners(){
  const s=S.settings;
  return `<div class="note">No drivers of your own? Add the delivery company you work with. When an order needs delivery, press <b>Dispatch → Delivery company</b>: the pickup request appears in their Delivery Company app, and you can also send it on WhatsApp with one tap. To send every accepted delivery order to one company automatically, set it in Settings.${s.mode==='inhouse'?' <b>Your delivery mode is “Own drivers only” — switch it in Settings to use a company.</b>':''}</div>
  <form class="card" data-f="addPartner"><h3>Add delivery company</h3><div class="formrow">
    <label class="f">Company name<input name="name" required></label><label class="f">WhatsApp / phone<input name="phone" required></label>
    <label class="f">Contact person<input name="contact"></label><label class="f">Fee you pay per delivery ($)<input name="fee" type="number" step="0.25" min="0" value="1.5"></label>
    <label class="f">Login PIN<input name="pin" inputmode="numeric" minlength="4" maxlength="8" required placeholder="4 digits"></label>
    <button class="btn pri">Add company</button></div></form>
  <div class="grid2">${S.partners.map(p=>{const n=S.orders.filter(o=>o.dlv.method==='partner'&&o.dlv.partnerId===p.id&&o.status==='delivered'&&isToday(o.t)).length;
    return `<div class="card"><div class="row"><b>${esc(p.name)}</b>${s.autoPartner===p.id?'<span class="tag ok">Auto-send</span>':''}<button class="switch right ${p.active?'on':''}" data-a="pActive" data-id="${p.id}"><span></span></button></div>
    <div class="sm muted">${esc(p.contact||'')} · ${esc(p.phone)} · PIN ${esc(p.pin||'')}</div>
    <div class="sm mt">Fee ${money(p.fee)} / delivery · ${n} delivered today</div>
    <div class="acts"><button class="btn ghost sm" data-a="delPartner" data-id="${p.id}">Remove</button></div></div>`;}).join('')||'<div class="empty">No delivery companies yet.</div>'}</div>
  <div class="card mt"><b>Delivery company app link</b><div class="sm muted">Send this link to the delivery company. They log in with the PIN you set for them.</div>${linkRow('courier')}</div>`;
}
function sReports(){
  const today=S.orders.filter(o=>isToday(o.t)&&o.status!=='cancelled');
  const sum=(l,f)=>l.reduce((a,o)=>a+f(o),0);
  const sales=sum(today,o=>o.sub),fees=sum(today,o=>o.fee),total=sum(today,o=>o.total);
  const del=today.filter(o=>o.type==='delivery');
  const inh=del.filter(o=>o.dlv.method==='inhouse').length,par=del.filter(o=>o.dlv.method==='partner').length;
  const pays=Object.keys(PAY).map(k=>[PAY[k],sum(today.filter(o=>o.payment===k),o=>o.total),today.filter(o=>o.payment===k).length]);
  const tally={};today.forEach(o=>o.items.forEach(i=>tally[i.name]=(tally[i.name]||0)+i.qty));
  const top=Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const pRows=S.partners.map(p=>{const os=S.orders.filter(o=>o.dlv.method==='partner'&&o.dlv.partnerId===p.id&&o.status==='delivered'&&!o.settled);
    const cash=sum(os.filter(o=>o.cashBy==='p:'+p.id),o=>o.collected||0),fee=sum(os,o=>o.dlv.fee||0);return {p,n:os.length,cash,fee,net:cash-fee};});
  return `<div class="stats">
    <div class="stat"><b>${today.length}</b><span>Orders today</span></div>
    <div class="stat"><b>${money(sales)}</b><span>Product sales</span></div>
    <div class="stat"><b>${money(fees)}</b><span>Delivery fees charged</span></div>
    <div class="stat"><b>${money(total)}</b><span>Total revenue · ${lbp(total)}</span></div>
    <div class="stat"><b>${money(today.length?total/today.length:0)}</b><span>Average ticket</span></div>
    <div class="stat"><b>${inh} / ${par}</b><span>Deliveries: own drivers / company</span></div></div>
  <div class="grid2">
    <div class="card"><h3>By payment method</h3>${pays.map(([l,a,n])=>`<div class="kv"><span>${l} (${n})</span><b>${money(a)}</b></div>`).join('')}</div>
    <div class="card"><h3>Best sellers today</h3>${top.map(([n,q])=>`<div class="kv"><span>${esc(n)}</span><b>${q}</b></div>`).join('')||'<div class="empty sm">No sales yet</div>'}</div>
  </div>
  <h2 class="sec">Driver cash to collect</h2>
  <div class="tablewrap"><table><tr><th>Driver</th><th>Cash held from customers</th><th></th></tr>
  ${S.drivers.map(d=>{const c=cashHeld(d.id);return `<tr><td>${esc(d.name)}</td><td><b>${money(c)}</b></td><td>${c?`<button class="btn sm pri" data-a="settleD" data-id="${d.id}">Mark handed in</button>`:'<span class="muted sm">Settled</span>'}</td></tr>`;}).join('')||'<tr><td colspan="3" class="muted">No drivers</td></tr>'}</table></div>
  <h2 class="sec">Delivery company balances</h2>
  <div class="tablewrap"><table><tr><th>Company</th><th>Unsettled deliveries</th><th>Cash they collected (owe you)</th><th>Their fees (you owe)</th><th>Net</th><th></th></tr>
  ${pRows.map(r=>`<tr><td>${esc(r.p.name)}</td><td>${r.n}</td><td>${money(r.cash)}</td><td>${money(r.fee)}</td><td><b>${r.net>=0?'They pay you '+money(r.net):'You pay them '+money(-r.net)}</b></td><td>${r.n?`<button class="btn sm pri" data-a="settleP" data-id="${r.p.id}">Settle</button>`:'<span class="muted sm">Settled</span>'}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No delivery companies</td></tr>'}</table></div>`;
}
function sSettings(){
  const s=S.settings;
  return `<form class="card" data-f="settings" style="max-width:780px"><h3>Shop settings</h3><div class="formrow">
    <label class="f">Shop name<input name="name" value="${esc(s.name)}" required></label>
    <label class="f">Phone / wallet number<input name="phone" value="${esc(s.phone)}"></label>
    <label class="f">Pickup address<input name="address" value="${esc(s.address)}"></label>
    <label class="f">Customer delivery fee ($)<input name="fee" type="number" step="0.25" min="0" value="${s.fee}"></label>
    <label class="f">Delivery time (min)<input name="eta" type="number" min="5" value="${s.eta}"></label>
    <label class="f">USD → LBP rate<input name="rate" type="number" value="${s.rate}"></label>
    <label class="f">Shop dashboard PIN<input name="pin" inputmode="numeric" minlength="4" maxlength="8" value="${esc(s.pin||'')}" required></label></div>
    <div class="lbl">Who delivers your orders?</div>
    ${Object.keys(MODE).map(k=>`<label class="pick btnlike"><span><input type="radio" name="mode" value="${k}" ${s.mode===k?'checked':''} style="width:auto;margin-right:8px"><b>${MODE[k]}</b><div class="sm muted" style="margin-left:26px">${MODE_D[k]}</div></span></label>`).join('')}
    <label class="f mt">Auto-send accepted delivery orders to a company
      <select name="autoPartner"><option value="">— No, I dispatch each order myself —</option>${S.partners.filter(p=>p.active).map(p=>`<option value="${p.id}" ${s.autoPartner===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <div class="acts"><button class="btn pri">Save settings</button></div></form>
  <div class="card" style="max-width:780px"><h3>App links</h3><p class="sm muted">Share these links. Each one opens a separate app that can be installed on the phone’s home screen.</p>
    <div class="lbl">Customer ordering app</div>${linkRow('customer')}
    <div class="lbl">Driver app</div>${linkRow('driver')}
    <div class="lbl">Delivery company app</div>${linkRow('courier')}</div>
  <div class="card" style="max-width:780px"><h3>Data</h3>
    <div class="acts"><button class="btn ghost" data-a="demo">Load sample drivers, companies & orders</button>
    <button class="btn ghost" data-a="clearOrders">${ui.clearArm?'Click again to delete all orders':'Delete all orders'}</button></div></div>`;
}
function mDispatch(){
  const o=O(ui.modal.id);if(!o)return '';
  const md=S.settings.mode,tab=md==='inhouse'?'inhouse':md==='outsourced'?'partner':(ui.modal.tab||'inhouse');
  let body;
  if(tab==='inhouse'){
    body=(S.drivers.map(d=>`<div class="pick ${d.online?'':'off'}"><div><b>${esc(d.name)}</b> <span class="dot ${d.online?'on':''}"></span><div class="sm muted">${esc(d.vehicle||'')} · ${activeJobs(d.id)} active job(s)${d.online?'':' · offline'}</div></div><button class="btn pri sm" data-a="assign" data-id="${o.id}" data-d="${d.id}" ${d.online?'':'disabled'}>Assign</button></div>`).join('')||'<p class="muted">No drivers yet — add them in the Drivers tab.</p>')
      +'<p class="sm muted">Or close this and leave the order open: any online driver can accept it from the Driver app.</p>';
  }else{
    const ps=S.partners.filter(p=>p.active);
    body=(ps.map(p=>`<div class="pick"><div><b>${esc(p.name)}</b><div class="sm muted">${esc(p.phone)} · fee ${money(p.fee)}</div></div><button class="btn acc sm" data-a="sendP" data-id="${o.id}" data-p="${p.id}">Send request</button></div>`).join('')||'<p class="muted">No active delivery companies — add one in the Delivery companies tab.</p>')
      +'<p class="sm muted">The company gets the request in its app. After sending, you can also forward it on WhatsApp from the order card.</p>';
  }
  return `<div class="mbox"><div class="row"><h3>Dispatch order #${o.no}</h3><button class="x" data-a="close">✕</button></div>
    <div class="sm">📍 ${esc(o.cust.address)}</div><div class="sm muted">Collect from customer: <b>${collectAmt(o)?money(collectAmt(o)):'Nothing — prepaid'}</b></div>
    ${md==='both'?`<div class="seg"><button class="${tab==='inhouse'?'on':''}" data-a="mtab" data-k="inhouse">🛵 Our drivers</button><button class="${tab==='partner'?'on':''}" data-a="mtab" data-k="partner">🏢 Delivery company</button></div>`:'<div style="height:10px"></div>'}
    ${body}</div>`;
}

/* ============ CUSTOMER APP ============ */
function custStatus(o){
  const del=o.type==='delivery';
  return {new:'Order received',preparing:'Being prepared',ready:del?'Ready — waiting for the driver':'Ready for pickup',out:'On the way',delivered:del?'Delivered':'Collected',cancelled:'Cancelled'}[o.status];
}
function vCustomer(){
  const s=S.settings,views={menu:cMenu,cart:cCart,track:cTrack};
  return `<div class="phone"><div class="ph-top"><div><b>${esc(s.name)}</b><div class="sm">${s.open?`🟢 Open · ~${s.eta} min · Delivery ${money(s.fee)}`:'🔴 Closed now'}</div></div>
    <div class="row">${ui.cScreen==='menu'?installBtn(true):'<button class="btn ghost sm" data-a="cGo" data-k="menu">‹ Menu</button>'}</div></div>
  <div class="ph-body">${views[ui.cScreen]()}</div>
  ${ui.cScreen==='menu'&&ui.cart.length?`<button class="cartbar" data-a="cGo" data-k="cart"><span>🛒 ${cartQty()} item(s)</span><b>View cart · ${money(cartSub())}</b></button>`:''}</div>`;
}
function cMenu(){
  const active=ME.myOrders.map(O).filter(o=>o&&!['delivered','cancelled'].includes(o.status));
  const cats=['All',...new Set(S.menu.map(m=>m.cat))];
  const list=S.menu.filter(m=>ui.cCat==='All'||m.cat===ui.cCat);
  return `${active.map(o=>`<button class="banner" data-a="track" data-id="${o.id}"><span>📦 #${o.no} · ${custStatus(o)}</span><span>Track ›</span></button>`).join('')}
  <div class="hero"><h2>Good coffee, delivered.</h2><p>Hot, iced or fresh from the oven — to your door or ready for pickup.</p></div>
  <div class="chips scroll">${cats.map(c=>`<button class="chip ${ui.cCat===c?'on':''}" data-a="cCat" data-k="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  ${list.map(m=>`<div class="mi ${m.available?'':'so'}"><div class="em">${esc(m.emoji)}</div><div class="grow"><b>${esc(m.name)}</b><div class="sm muted">${esc(m.desc)}</div><div class="price">${money(m.price)}</div></div>${m.available?`<button class="add" data-a="pick" data-id="${m.id}" aria-label="Add">+</button>`:'<span class="tag">Sold out</span>'}</div>`).join('')||'<div class="empty">The menu is being updated. Please check back soon.</div>'}
  ${ME.myOrders.length?'<button class="btn ghost full mt" data-a="cGo" data-k="track">My orders</button>':''}`;
}
function cCart(){
  if(!ui.cart.length)return `<div class="empty">Your cart is empty.<br><button class="btn pri mt" data-a="cGo" data-k="menu">Browse the menu</button></div>`;
  const c=ME.cust,sub=cartSub(),fee=c.type==='delivery'?S.settings.fee:0;
  return `<h2>Your order</h2>
  ${ui.cart.map((l,i)=>`<div class="cl"><div class="grow"><b>${esc(l.name)}</b>${l.opt?`<div class="sm muted">${esc(l.opt)}</div>`:''}<div class="sm">${money(l.unit)}</div></div><div class="qty"><button data-a="cq" data-i="${i}" data-d="-1">−</button><b>${l.qty}</b><button data-a="cq" data-i="${i}" data-d="1">+</button></div></div>`).join('')}
  <div class="seg mt"><button class="${c.type==='delivery'?'on':''}" data-a="cType" data-k="delivery">🛵 Delivery</button><button class="${c.type==='pickup'?'on':''}" data-a="cType" data-k="pickup">🏃 Pickup</button></div>
  <div class="form">
    <input data-bind="name" placeholder="Full name" autocomplete="name" value="${esc(c.name)}">
    <input data-bind="phone" placeholder="Mobile number" inputmode="tel" autocomplete="tel" value="${esc(c.phone)}">
    ${c.type==='delivery'?`<textarea data-bind="address" placeholder="Delivery address — area, street, building, floor">${esc(c.address)}</textarea>`:''}
    <input data-bind="notes" placeholder="Notes for the shop or driver (optional)" value="${esc(c.notes)}">
  </div>
  <div class="lbl">Payment</div>
  <div class="pays">${Object.entries(PAY).map(([k,l])=>`<button class="pay ${c.pay===k?'on':''}" data-a="cPay" data-k="${k}">${l}</button>`).join('')}</div>
  ${['whish','omt'].includes(c.pay)?`<div class="note">Send <b>${money(sub+fee)}</b> to <b>${esc(S.settings.phone)}</b> using ${PAY[c.pay]}. The shop confirms your payment.</div>`:''}
  <div class="tot"><div><span>Subtotal</span><span>${money(sub)}</span></div><div><span>Delivery</span><span>${fee?money(fee):'Free (pickup)'}</span></div><div class="big"><span>Total</span><span>${money(sub+fee)}</span></div><div class="sm muted" style="justify-content:flex-end">≈ ${lbp(sub+fee)}</div></div>
  <button class="btn pri full big" data-a="place" ${S.settings.open&&!ui.placing?'':'disabled'}>${!S.settings.open?'Shop is closed':ui.placing?'Sending…':'Place order · '+money(sub+fee)}</button>`;
}
function cTrack(){
  const o=O(ui.trackId)||O(ME.myOrders[0]);
  if(!o)return ME.myOrders.length?'<div class="empty">Loading your order…</div>':'<div class="empty">No orders yet.</div>';
  const del=o.type==='delivery';
  const steps=del?[['new','Order received'],['preparing','Preparing your order'],['ready','Ready — driver picking it up'],['out','On the way to you'],['delivered','Delivered']]
                 :[['new','Order received'],['preparing','Preparing your order'],['ready','Ready for pickup'],['delivered','Collected']];
  const idx=steps.findIndex(s=>s[0]===o.status);
  let courier='';
  if(del&&o.dlv.method==='inhouse'){const d=D(o.dlv.driverId);if(d)courier=`<div class="card"><b>🛵 Your driver: ${esc(d.name)}</b><div class="sm"><a href="tel:${esc(d.phone)}">${esc(d.phone)}</a></div></div>`;}
  if(del&&o.dlv.method==='partner'&&o.dlv.pStatus!=='requested'){const p=P(o.dlv.partnerId);courier=`<div class="card"><b>🛵 Delivered by ${esc(p?p.name:'our delivery partner')}</b>${o.dlv.rider?`<div class="sm">Rider: ${esc(o.dlv.rider)} ${o.dlv.riderPhone?`· <a href="tel:${esc(o.dlv.riderPhone)}">${esc(o.dlv.riderPhone)}</a>`:''}</div>`:''}</div>`;}
  const others=ME.myOrders.map(O).filter(x=>x&&x.id!==o.id);
  return `<div class="row"><h2>Order #${o.no}</h2><span class="tag ${o.type} right">${del?'Delivery':'Pickup'}</span></div>
  ${o.status==='cancelled'?`<div class="note">Sorry — the shop could not take this order. Please call ${esc(S.settings.phone)} or try again.</div>`:
  `<ul class="steps">${steps.map(([k,l],i)=>`<li class="${i<idx||o.status==='delivered'?'done':i===idx?'cur':'todo'}"><span class="b">${i<idx||o.status==='delivered'?'✓':''}</span><div><b>${l}</b>${o.times&&o.times[k]?`<div class="sm muted">${clock(o.times[k])}</div>`:''}</div></li>`).join('')}</ul>`}
  ${courier}
  <div class="card">${o.items.map(i=>`<div class="kv"><span>${i.qty}× ${esc(i.name)}${i.opt?` <span class="muted sm">${esc(i.opt)}</span>`:''}</span><span>${money(i.qty*i.unit)}</span></div>`).join('')}
  <div class="kv"><span>Delivery</span><span>${money(o.fee)}</span></div><div class="kv"><b>Total · ${PAY[o.payment]}</b><b>${money(o.total)}</b></div></div>
  ${others.length?`<div class="lbl">Previous orders</div>${others.map(x=>`<button class="pick btnlike" data-a="track" data-id="${x.id}"><span>#${x.no} · ${clock(x.t)} · ${money(x.total)}</span><span class="sm muted">${custStatus(x)} ›</span></button>`).join('')}`:''}`;
}
function mItem(){
  const m=ui.modal,it=S.menu.find(x=>x.id===m.itemId);if(!it)return '';
  const chip=(k,v,l,on)=>`<button class="chip ${on?'on':''}" data-a="opt" data-k="${k}" data-v="${esc(v)}">${esc(l)}</button>`;
  return `<div class="mbox"><div class="row"><h3>${esc(it.emoji)} ${esc(it.name)}</h3><button class="x" data-a="close">✕</button></div><p class="muted sm">${esc(it.desc)}</p>
  <div class="lbl">Size</div><div class="chips">${SIZES.map(([k,l,p])=>chip('size',k,l+delta(p),m.size===k)).join('')}</div>
  <div class="lbl">Milk</div><div class="chips">${MILKS.map(([k,p])=>chip('milk',k,k+delta(p),m.milk===k)).join('')}</div>
  <div class="lbl">Sugar</div><div class="chips">${SUGARS.map(k=>chip('sugar',k,k,m.sugar===k)).join('')}</div>
  <div class="lbl">Extras</div><div class="chips">${chip('shot','1','Extra espresso shot +$0.75',m.shot)}</div>
  <div class="row mt"><div class="qty"><button data-a="mq" data-d="-1">−</button><b>${m.qty}</b><button data-a="mq" data-d="1">+</button></div>
  <button class="btn pri grow" data-a="addCart">Add to cart · ${money(unitPrice(it,m)*m.qty)}</button></div></div>`;
}
function mInstall(){
  return `<div class="mbox"><div class="row"><h3>📲 Install the app</h3><button class="x" data-a="close">✕</button></div>
  <p><b>iPhone / iPad (Safari):</b> tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</p>
  <p><b>Android (Chrome):</b> tap the <b>⋮</b> menu, then <b>Install app</b> or <b>Add to Home screen</b>.</p>
  <button class="btn pri full" data-a="close">Got it</button></div>`;
}

/* ============ DRIVER APP ============ */
function vDriver(){
  const d=D(ME.driverId);
  if(!d){
    if(ui.pinFor&&D(ui.pinFor))return `<div class="phone"><div class="ph-top"><b>🛵 Driver · ${esc(S.settings.name)}</b></div><div class="ph-body">${pinScreen('Hi '+esc(D(ui.pinFor).name.split(' ')[0]),'Enter your driver PIN.','pinBack')}</div></div>`;
    return `<div class="phone"><div class="ph-top"><b>🛵 Driver · ${esc(S.settings.name)}</b>${installBtn(true)}</div><div class="ph-body"><h2>Who’s driving?</h2><p class="muted sm">Select your name to log in.</p>
    ${S.drivers.map(x=>`<button class="pick btnlike" data-a="dSelect" data-id="${x.id}"><div><b>${esc(x.name)}</b><div class="sm muted">${esc(x.vehicle||'')} · ${esc(x.phone)}${DEMO?' · <b>Demo PIN '+esc(x.pin)+'</b>':''}</div></div><span>›</span></button>`).join('')||'<p>No drivers yet. Ask the shop to add you.</p>'}</div></div>`;
  }
  const md=S.settings.mode;
  const mine=S.orders.filter(o=>o.dlv.method==='inhouse'&&o.dlv.driverId===d.id&&['preparing','ready','out'].includes(o.status)).sort((a,b)=>a.t-b.t);
  const pool=md!=='outsourced'&&d.online?S.orders.filter(o=>o.type==='delivery'&&!o.dlv.method&&['preparing','ready'].includes(o.status)):[];
  const doneToday=S.orders.filter(o=>o.status==='delivered'&&o.dlv.method==='inhouse'&&o.dlv.driverId===d.id&&isToday(o.t));
  return `<div class="phone"><div class="ph-top"><div><b>🛵 ${esc(d.name)}</b><div class="sm">${d.online?'Online — receiving jobs':'Offline'}</div></div>
    <div class="row"><button class="switch ${d.online?'on':''}" data-a="dOnline" aria-label="Online"><span></span></button><button class="btn ghost sm" data-a="dLogout">Log out</button></div></div>
  <div class="ph-body">
    ${installBtn()?`<div class="row" style="margin-bottom:10px">${installBtn()}</div>`:''}
    <div class="stats3"><div><b>${mine.length}</b><span>Active</span></div><div><b>${doneToday.length}</b><span>Delivered today</span></div><div><b>${money(cashHeld(d.id))}</b><span>Cash to hand in</span></div></div>
    <h3>My deliveries</h3>${mine.map(o=>jobCard(o,true)).join('')||'<div class="empty sm">No active deliveries.</div>'}
    ${md==='outsourced'?'<div class="note">The shop is using a delivery company for all orders right now.</div>':d.online?`<h3 class="mt">Available jobs</h3>${pool.map(o=>jobCard(o,false)).join('')||'<div class="empty sm">No open jobs right now.</div>'}`:'<div class="note">Go online (top right) to see available jobs.</div>'}
  </div></div>`;
}
function jobCard(o,mine){
  const amt=collectAmt(o);let act;
  if(!mine)act=`<button class="btn pri full" data-a="dTake" data-id="${o.id}">Accept job</button>`;
  else if(o.status==='out')act=`<button class="btn ok full" data-a="dDone" data-id="${o.id}">✓ Delivered${amt?' — collected '+money(amt):''}</button>`;
  else if(o.status==='ready')act=`<button class="btn pri full" data-a="dPick" data-id="${o.id}">Picked up from shop</button>`;
  else act='<button class="btn full" disabled>Waiting — order being prepared</button>';
  return `<div class="card"><div class="row"><b>#${o.no}</b><span class="tag">${ST[o.status]}</span><span class="right sm muted">${ago(o.t)}</span></div>
  <div class="leg"><span class="pin a">A</span><div><b>Pickup</b><div class="sm">${esc(S.settings.name)} — ${esc(S.settings.address)}</div></div></div>
  <div class="leg"><span class="pin b">B</span><div><b>${esc(o.cust.name)}</b> · <a href="tel:${esc(o.cust.phone)}">${esc(o.cust.phone)}</a><div class="sm">${esc(o.cust.address)}</div>${o.cust.notes?`<div class="sm muted">📝 ${esc(o.cust.notes)}</div>`:''}<a class="sm" href="${mapLink(o.cust.address)}" target="_blank" rel="noopener">Open in Maps ›</a></div></div>
  <div class="row" style="margin-bottom:10px"><span class="sm">${qtyOf(o)} item(s) · ${PAY[o.payment]}</span><b class="right">${amt?'Collect '+money(amt):'Prepaid ✓'}</b></div>${act}</div>`;
}

/* ============ DELIVERY COMPANY APP ============ */
function vCourier(){
  const p=P(ME.partnerId);
  if(!p){
    if(ui.pinFor&&P(ui.pinFor))return `<div class="wrap narrow"><div class="brandrow">🏢 <b>${esc(P(ui.pinFor).name)}</b></div>${pinScreen('Company login','Enter the PIN given to you by '+esc(S.settings.name)+'.','pinBack')}</div>`;
    return `<div class="wrap narrow"><div class="row"><h1>Delivery Partner</h1><span class="right">${installBtn()}</span></div><p class="muted">Pickup requests from ${esc(S.settings.name)}. Select your company:</p>
    ${S.partners.map(x=>`<button class="pick btnlike" data-a="pSelect" data-id="${x.id}"><div><b>${esc(x.name)}</b><div class="sm muted">${esc(x.contact||'')} · ${esc(x.phone)}${DEMO?' · <b>Demo PIN '+esc(x.pin)+'</b>':''}</div></div><span>›</span></button>`).join('')||'<p>No delivery companies set up yet.</p>'}</div>`;
  }
  const reqs=S.orders.filter(o=>o.dlv.method==='partner'&&o.dlv.partnerId===p.id);
  const open=reqs.filter(o=>o.dlv.pStatus==='requested'&&o.status!=='cancelled');
  const active=reqs.filter(o=>['accepted','picked'].includes(o.dlv.pStatus)&&o.status!=='cancelled');
  const done=reqs.filter(o=>o.status==='delivered'&&isToday(o.t));
  const uns=reqs.filter(o=>o.status==='delivered'&&!o.settled);
  const cash=uns.filter(o=>o.cashBy==='p:'+p.id).reduce((a,o)=>a+(o.collected||0),0),fees=uns.reduce((a,o)=>a+(o.dlv.fee||0),0);
  return `<div class="wrap narrow"><div class="row"><h1>🏢 ${esc(p.name)}</h1><span class="right row">${installBtn()}<button class="btn ghost sm" data-a="pLogout">Log out</button></span></div>
  <p class="muted sm">Pickup requests from <b>${esc(S.settings.name)}</b> · ${esc(S.settings.address)} · ${esc(S.settings.phone)}</p>
  <div class="stats"><div class="stat"><b>${open.length}</b><span>New requests</span></div><div class="stat"><b>${active.length}</b><span>In progress</span></div><div class="stat"><b>${done.length}</b><span>Delivered today</span></div><div class="stat"><b>${money(fees)}</b><span>Fees earned (unsettled)</span></div><div class="stat"><b>${money(cash)}</b><span>Cash collected for shop</span></div></div>
  <h2>New requests</h2>${open.map(pCard).join('')||'<div class="empty">No new requests.</div>'}
  <h2 class="sec">In progress</h2>${active.map(pCard).join('')||'<div class="empty">Nothing in progress.</div>'}
  <h2 class="sec">Delivered today</h2>${done.length?`<div class="tablewrap"><table><tr><th>#</th><th>Drop-off</th><th>Rider</th><th>Collected</th><th>Fee</th></tr>${done.map(o=>`<tr><td>${o.no}</td><td>${esc(o.cust.address)}</td><td>${esc(o.dlv.rider||'')}</td><td>${money(o.collected||0)}</td><td>${money(o.dlv.fee)}</td></tr>`).join('')}</table></div>`:'<div class="empty">None yet.</div>'}</div>`;
}
function pCard(o){
  const d=o.dlv,amt=collectAmt(o);let act;
  if(d.pStatus==='requested')act=`<div class="formrow mt"><input id="rn-${o.id}" data-draft="1" placeholder="Rider name" value="${esc(ui.drafts['rn-'+o.id]||'')}"><input id="rp-${o.id}" data-draft="1" placeholder="Rider phone" value="${esc(ui.drafts['rp-'+o.id]||'')}"></div>
    <div class="acts"><button class="btn pri" data-a="pAccept" data-id="${o.id}">Accept & assign rider</button><button class="btn ghost" data-a="pDecline" data-id="${o.id}">Decline</button></div>`;
  else if(d.pStatus==='accepted')act=o.status==='ready'?`<div class="acts"><button class="btn pri" data-a="pPick" data-id="${o.id}">Rider picked up the order</button></div>`:'<div class="acts"><button class="btn" disabled>Waiting — shop is still preparing</button></div>';
  else act=`<div class="acts"><button class="btn ok" data-a="pDone" data-id="${o.id}">✓ Delivered${amt?' — collected '+money(amt):''}</button></div>`;
  return `<div class="card"><div class="row"><b>Order #${o.no}</b><span class="tag ${d.pStatus==='requested'?'warn':'ok'}">${PST[d.pStatus]}</span><span class="right sm muted">${ago(o.t)}</span></div>
  <div class="leg"><span class="pin a">A</span><div><b>Pickup</b><div class="sm">${esc(S.settings.name)} — ${esc(S.settings.address)} · Order ${ST[o.status].toLowerCase()}</div></div></div>
  <div class="leg"><span class="pin b">B</span><div><b>${esc(o.cust.name)}</b> · ${esc(o.cust.phone)}<div class="sm">${esc(o.cust.address)}</div>${o.cust.notes?`<div class="sm muted">📝 ${esc(o.cust.notes)}</div>`:''}<a class="sm" href="${mapLink(o.cust.address)}" target="_blank" rel="noopener">Open in Maps ›</a></div></div>
  <div class="row"><span class="sm">${qtyOf(o)} item(s) · your fee <b>${money(d.fee)}</b></span><b class="right">${amt?'Collect '+money(amt):'Prepaid — collect nothing'}</b></div>
  ${d.rider?`<div class="sm mt">Rider: <b>${esc(d.rider)}</b> ${esc(d.riderPhone||'')}</div>`:''}${act}</div>`;
}

/* ============ ACTIONS ============ */
const A={
  resetDemo:()=>{try{localStorage.removeItem('solis_demo_db');localStorage.removeItem('solis_demo_me');}catch(e){}location.reload();},
  install:()=>{if(installEvt){installEvt.prompt();installEvt.userChoice.finally(()=>{installEvt=null;render();});}else ui.modal={type:'install'};},
  lockShop:()=>{ME.shopOk=false;saveMe();},
  shopTab:d=>{ui.shopTab=d.k;ui.clearArm=false;},
  toggleOpen:()=>{S.settings.open=!S.settings.open;},
  accept:d=>{const o=O(d.id);setStatus(o,'preparing','Accepted by shop');
    const ap=P(S.settings.autoPartner);
    if(o.type==='delivery'&&ap&&ap.active&&S.settings.mode!=='inhouse'){sendToPartner(o,ap);toast('Accepted & sent to '+ap.name);}else toast('Order #'+o.no+' accepted');},
  reject:d=>{const o=O(d.id);setStatus(o,'cancelled','Rejected by shop');},
  ready:d=>{const o=O(d.id);setStatus(o,'ready','Ready');if(o.type==='delivery'&&!o.dlv.method)toast('Ready — dispatch order #'+o.no);},
  handover:d=>{const o=O(d.id);o.paid=true;setStatus(o,'delivered','Collected by customer');},
  dispatch:d=>{ui.modal={type:'dispatch',id:d.id,tab:null};},
  mtab:d=>{ui.modal.tab=d.k;},
  assign:d=>{const o=O(d.id),dr=D(d.d);o.dlv={method:'inhouse',driverId:dr.id};log(o,'Assigned to driver '+dr.name);ui.modal=null;toast('Assigned to '+dr.name);},
  sendP:d=>{const o=O(d.id),p=P(d.p);sendToPartner(o,p);ui.modal=null;toast('Pickup request sent to '+p.name);},
  undispatch:d=>{const o=O(d.id);log(o,'Dispatch cancelled');o.dlv={method:null};ui.modal={type:'dispatch',id:o.id,tab:null};},
  forceDone:d=>{const o=O(d.id);finishDelivery(o,o.dlv.method==='inhouse'?o.dlv.driverId:o.dlv.method==='partner'?'p:'+o.dlv.partnerId:'shop','Marked delivered by shop');},
  paid:d=>{const o=O(d.id);o.paid=true;log(o,'Payment confirmed');toast('Payment confirmed for #'+o.no);},
  copyReq:d=>copy(reqText(O(d.id)),'Request copied'),
  copyText:d=>copy(d.t,'Link copied'),
  avail:d=>{const m=S.menu.find(x=>x.id===d.id);m.available=!m.available;},
  delItem:d=>{S.menu=S.menu.filter(x=>x.id!==d.id);},
  delDriver:d=>{S.drivers=S.drivers.filter(x=>x.id!==d.id);},
  delPartner:d=>{S.partners=S.partners.filter(x=>x.id!==d.id);if(S.settings.autoPartner===d.id)S.settings.autoPartner='';},
  pActive:d=>{const p=P(d.id);p.active=!p.active;},
  settleD:d=>{S.orders.forEach(o=>{if(o.cashBy===d.id)o.settled=true;});toast('Cash handed in');},
  settleP:d=>{S.orders.forEach(o=>{if(o.dlv.method==='partner'&&o.dlv.partnerId===d.id&&o.status==='delivered')o.settled=true;});toast('Balance settled');},
  demo:async()=>{await loadDemo();Sync.push();render();toast('Sample data added');},
  clearOrders:()=>{if(!ui.clearArm){ui.clearArm=true;return;}S.orders=[];ui.clearArm=false;toast('All orders deleted');},
  close:()=>{ui.modal=null;},
  // customer
  cCat:d=>{ui.cCat=d.k;},
  cGo:d=>{ui.cScreen=d.k;if(d.k==='track'&&!ui.trackId)ui.trackId=ME.myOrders[0];},
  track:d=>{ui.trackId=d.id;ui.cScreen='track';},
  pick:d=>{const it=S.menu.find(x=>x.id===d.id);if(!S.settings.open){toast('Sorry, the shop is closed');return;}
    if(it.custom)ui.modal={type:'item',itemId:it.id,size:'M',milk:'Regular',sugar:'Normal',shot:false,qty:1};
    else{const ex=ui.cart.find(l=>l.key===it.id+'|');ex?ex.qty++:ui.cart.push({key:it.id+'|',itemId:it.id,name:it.name,opt:'',unit:it.price,qty:1});toast(it.name+' added');}},
  opt:d=>{if(d.k==='shot')ui.modal.shot=!ui.modal.shot;else ui.modal[d.k]=d.v;},
  mq:d=>{ui.modal.qty=Math.max(1,ui.modal.qty+ +d.d);},
  addCart:()=>{const m=ui.modal,it=S.menu.find(x=>x.id===m.itemId),opt=optStr(it,m),key=it.id+'|'+opt,ex=ui.cart.find(l=>l.key===key);
    ex?ex.qty+=m.qty:ui.cart.push({key,itemId:it.id,name:it.name,opt,unit:unitPrice(it,m),qty:m.qty});ui.modal=null;toast(it.name+' added');},
  cq:d=>{const l=ui.cart[+d.i];l.qty+= +d.d;if(l.qty<1)ui.cart.splice(+d.i,1);},
  cType:d=>{ME.cust.type=d.k;},
  cPay:d=>{ME.cust.pay=d.k;},
  place:async()=>{
    const c=ME.cust;
    if(!c.name.trim()||!c.phone.trim())return toast('Please enter your name and mobile number');
    if(c.type==='delivery'&&!c.address.trim())return toast('Please enter your delivery address');
    if(ui.placing)return;
    ui.placing=true;render();
    try{
      const no=await Sync.nextNo();
      const sub=cartSub(),fee=c.type==='delivery'?+S.settings.fee:0,t=now(),id=uid();
      const o={id,no,t,type:c.type,cust:{name:c.name.trim(),phone:c.phone.trim(),address:c.type==='delivery'?c.address.trim():'',notes:c.notes.trim()},
        items:ui.cart.map(l=>({name:l.name,qty:l.qty,unit:l.unit,opt:l.opt})),sub,fee,total:sub+fee,payment:c.pay,paid:false,status:'new',dlv:{method:null},times:{new:t},log:[{t,m:'Order placed'}]};
      ME.myOrders.unshift(id);S.orders.unshift(o);Sync.push();Sync.watch(id);
      c.notes='';ui.cart=[];ui.trackId=id;ui.cScreen='track';toast('Order #'+no+' placed!');
    }catch(e){console.error(e);toast('Could not send your order — check your connection and try again');}
    ui.placing=false;
  },
  // driver
  dSelect:d=>{ui.pinFor=d.id;ui.pinErr='';},
  pinBack:()=>{ui.pinFor=null;ui.pinErr='';},
  dLogout:()=>{const d=D(ME.driverId);if(d)d.online=false;ME.driverId=null;ui.pinFor=null;saveMe();},
  dOnline:()=>{const d=D(ME.driverId);d.online=!d.online;},
  dTake:async d=>{
    const dr=D(ME.driverId);
    const r=await Sync.tx('orders',d.id,cur=>{if(!cur||cur.dlv.method||!['preparing','ready'].includes(cur.status))return null;cur.dlv={method:'inhouse',driverId:dr.id};log(cur,dr.name+' accepted the job');return cur;});
    toast(r?'Job #'+r.no+' is yours':'Another driver already took this job');render();
  },
  dPick:d=>{const o=O(d.id);setStatus(o,'out','Picked up by '+D(ME.driverId).name);},
  dDone:d=>{const o=O(d.id);finishDelivery(o,ME.driverId,'Delivered by '+D(ME.driverId).name);toast('Delivery complete 🎉');},
  // delivery company
  pSelect:d=>{ui.pinFor=d.id;ui.pinErr='';},
  pLogout:()=>{ME.partnerId=null;ui.pinFor=null;saveMe();},
  pAccept:d=>{const o=O(d.id),rn=(ui.drafts['rn-'+o.id]||'').trim(),rp=(ui.drafts['rp-'+o.id]||'').trim();
    if(!rn)return toast('Enter the rider’s name first');
    o.dlv.pStatus='accepted';o.dlv.rider=rn;o.dlv.riderPhone=rp;log(o,P(ME.partnerId).name+' accepted — rider '+rn);toast('Request accepted');},
  pDecline:d=>{const o=O(d.id),p=P(ME.partnerId);log(o,p.name+' declined');o.dlv={method:null,declinedBy:p.name};},
  pPick:d=>{const o=O(d.id);o.dlv.pStatus='picked';setStatus(o,'out','Picked up by '+P(ME.partnerId).name+' rider');},
  pDone:d=>{const o=O(d.id);finishDelivery(o,'p:'+ME.partnerId,'Delivered by '+P(ME.partnerId).name);toast('Marked delivered');}
};
function copy(t,msg){try{navigator.clipboard.writeText(t).then(()=>toast(msg),()=>toast('Copy not available here'));}catch(e){toast('Copy not available here');}}
const FORMS={
  pin:f=>{
    const pin=String(f.pin||'').trim();
    if(APP==='shop'){if(pin===String(S.settings.pin)){ME.shopOk=true;ui.pinErr='';}else ui.pinErr='Wrong PIN';}
    if(APP==='driver'){const d=D(ui.pinFor);if(d&&pin===String(d.pin)){ME.driverId=d.id;d.online=true;ui.pinFor=null;ui.pinErr='';}else ui.pinErr='Wrong PIN';}
    if(APP==='courier'){const p=P(ui.pinFor);if(p&&pin===String(p.pin)){ME.partnerId=p.id;ui.pinFor=null;ui.pinErr='';}else ui.pinErr='Wrong PIN';}
    saveMe();
  },
  addItem:f=>{S.menu.push({id:uid(),ord:nextOrd(S.menu),name:f.name.trim(),cat:f.cat.trim(),price:+f.price||0,emoji:f.emoji||'☕',desc:f.desc||'',custom:!!f.custom,available:true});toast('Item added');},
  addDriver:f=>{S.drivers.push({id:uid(),ord:nextOrd(S.drivers),name:f.name.trim(),phone:f.phone.trim(),vehicle:f.vehicle||'',pin:String(f.pin).trim(),online:false});toast('Driver added');},
  addPartner:f=>{S.partners.push({id:uid(),ord:nextOrd(S.partners),name:f.name.trim(),phone:f.phone.trim(),contact:f.contact||'',fee:+f.fee||0,pin:String(f.pin).trim(),active:true});toast('Delivery company added');},
  settings:f=>{Object.assign(S.settings,{name:f.name,phone:f.phone,address:f.address,fee:+f.fee||0,eta:+f.eta||30,rate:+f.rate||89500,mode:f.mode||'both',autoPartner:f.autoPartner||'',pin:String(f.pin).trim()||S.settings.pin});toast('Settings saved');}
};

/* ============ RENDER ============ */
let pendingRender=false;
function render(){
  if(ui.error){$app.innerHTML=`<div class="wrap narrow center"><h2>Can’t connect</h2><p class="muted">${esc(ui.error)}</p><button class="btn pri" onclick="location.reload()">Try again</button></div>`;return;}
  if(!ui.ready){$app.innerHTML='<div class="loading"><div class="spin"></div></div>';return;}
  if(!S.settings){$app.innerHTML='<div class="wrap narrow center"><h2>Coming soon</h2><p class="muted">This shop is still being set up. Please check back shortly.</p></div>';return;}
  pendingRender=false;
  const key=APP+ui.cScreen,b=document.querySelector('.ph-body'),st=b&&render._k===key?b.scrollTop:0;
  $app.innerHTML=(DEMO&&!EMBED&&Sync.mode==='local'?'<div class="demo-ribbon">DEMO · sample data · <a href="../demo/">All demo apps</a> · <a href="#" data-a="resetDemo">Reset demo</a></div>':'')+{shop:vShop,customer:vCustomer,driver:vDriver,courier:vCourier}[APP]();
  const b2=document.querySelector('.ph-body');if(b2)b2.scrollTop=st;render._k=key;
  document.title=S.settings.name+({shop:' · Shop',customer:'',driver:' · Driver',courier:' · Delivery Partner'}[APP]);
  const m=document.getElementById('modal');
  const ok=ui.modal&&(ui.modal.type==='install'||(ui.modal.type==='item'&&APP==='customer')||(ui.modal.type==='dispatch'&&APP==='shop'&&ME.shopOk));
  if(ok){m.className='modal';m.innerHTML=ui.modal.type==='item'?mItem():ui.modal.type==='install'?mInstall():mDispatch();}
  else{ui.modal=null;m.className='modal hidden';m.innerHTML='';}
}
function softRender(){if(isTyping())pendingRender=true;else render();}
document.addEventListener('focusout',()=>setTimeout(()=>{if(pendingRender&&!isTyping())render();},50));

document.addEventListener('click',async e=>{
  if(e.target.id==='modal'){ui.modal=null;render();return;}
  const el=e.target.closest('[data-a]');if(!el||el.disabled)return;
  if(el.tagName==='A')e.preventDefault();
  const fn=A[el.dataset.a];if(!fn)return;
  const r=fn(el.dataset,el);
  if(r&&r.then){await r;}
  Sync.push();markSeen();saveMe();render();
});
document.addEventListener('submit',e=>{const f=e.target.dataset.f;if(!f)return;e.preventDefault();FORMS[f](Object.fromEntries(new FormData(e.target)));Sync.push();markSeen();render();});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.bind){ME.cust[t.dataset.bind]=t.value;saveMe();}if(t.dataset.draft)ui.drafts[t.id]=t.value;});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.ch==='price'){const m=S.menu.find(x=>x.id===t.dataset.id);m.price=+t.value||0;Sync.push();toast('Price updated');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.modal){ui.modal=null;render();}});

/* alerts for new work */
const seen={};let primed=false;
function markSeen(){S.orders.forEach(o=>{seen[o.id]=sig(o);});}
function sig(o){return [o.status,o.dlv&&o.dlv.method,o.dlv&&o.dlv.pStatus,o.dlv&&o.dlv.partnerId].join('|');}
function checkAlerts(){
  S.orders.forEach(o=>{
    const prev=seen[o.id],cur=sig(o);seen[o.id]=cur;
    if(!primed||prev===cur)return;
    if(APP==='shop'&&ME.shopOk&&!prev&&o.status==='new'){beep();toast('🔔 New order #'+o.no);}
    if(APP==='courier'&&o.dlv.method==='partner'&&o.dlv.partnerId===ME.partnerId&&o.dlv.pStatus==='requested'&&(!prev||prev.split('|')[2]!=='requested')){beep();toast('🔔 New pickup request #'+o.no);}
    if(APP==='driver'){const d=D(ME.driverId);if(!d)return;
      if(o.dlv.method==='inhouse'&&o.dlv.driverId===d.id&&(!prev||prev.split('|')[1]!=='inhouse')){beep();toast('🔔 New delivery #'+o.no+' assigned to you');}
      else if(d.online&&S.settings.mode!=='outsourced'&&o.type==='delivery'&&!o.dlv.method&&o.status==='ready'&&(!prev||prev.split('|')[0]!=='ready')){beep();toast('🔔 Order #'+o.no+' is ready — job available');}}
  });
  primed=true;
}

/* ============ START ============ */
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0){navigator.serviceWorker.register('sw.js').catch(()=>{});}
render();
Sync.start({orders:APP==='customer'?'mine':'recent'},{
  onRemote:()=>{if(!ui.ready)return;checkAlerts();softRender();},
  onError:()=>toast('Connection problem — retrying…')
}).then(async()=>{
  const demoOk=DEMO&&Sync.mode==='local';
  if(!S.settings&&(APP==='shop'||demoOk)){const b=baseData();S.settings=b.settings;S.menu=b.menu;if(demoOk){S.settings.name='Solis Demo Café';await loadDemo();}Sync.push();markSeen();}
  if(demoOk&&!EMBED)document.body.classList.add('is-demo');
  if(demoOk&&AUTO){if(APP==='shop')ME.shopOk=true;if(APP==='driver'&&S.drivers[0]){ME.driverId=S.drivers[0].id;}if(APP==='courier'&&S.partners[0])ME.partnerId=S.partners[0].id;saveMe();}
  ui.ready=true;checkAlerts();render();
}).catch(e=>{console.error(e);ui.error='Please check your internet connection and try again.';render();});
setInterval(()=>{if(ui.ready&&!isTyping()&&!ui.modal)render();},30000);
})();
