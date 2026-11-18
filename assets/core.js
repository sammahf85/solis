/* Solis — shared data & live sync engine */
(function(){
  var IS_DEMO=/[?&]demo\b/.test(location.search);
  var KEY_DB=IS_DEMO?'solis_demo_db':'solis_db', KEY_ME=IS_DEMO?'solis_demo_me':'solis_me';
  var COLLS=['menu','drivers','partners','orders'];
  var RECENT_DAYS=3;
  var FB_VER='10.12.2';

  window.uid=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);};
  window.S={settings:null,menu:[],drivers:[],partners:[],orders:[]};

  var meDefault={cust:{name:'',phone:'',address:'',notes:'',type:'delivery',pay:'cash'},myOrders:[],driverId:null,partnerId:null,shopOk:false};
  function loadMe(){
    try{var m=JSON.parse(localStorage.getItem(KEY_ME)||'{}');var r=Object.assign({},meDefault,m);r.cust=Object.assign({},meDefault.cust,m.cust||{});return r;}
    catch(e){return JSON.parse(JSON.stringify(meDefault));}
  }
  window.ME=loadMe();
  window.saveMe=function(){try{localStorage.setItem(KEY_ME,JSON.stringify(ME));}catch(e){}};

  var last={};            // "coll/id" -> JSON last known in the database
  var adapter=null, hooks={}, filter={};
  var clean=function(o){return JSON.parse(JSON.stringify(o));};

  function wantOrder(o){
    if(!o)return false;
    if(filter.orders==='mine')return ME.myOrders.indexOf(o.id)>=0;
    return o.t>=Date.now()-RECENT_DAYS*86400000;
  }
  function applyOne(c,id,data){
    var k=c+'/'+id;
    if(c==='meta'){ if(id==='settings'){S.settings=data||null;last[k]=JSON.stringify(data||null);} return; }
    var arr=S[c]; if(!arr)return;
    var i=-1; for(var j=0;j<arr.length;j++){if(arr[j].id===id){i=j;break;}}
    if(data==null){ if(i>=0)arr.splice(i,1); delete last[k]; return; }
    data.id=id; last[k]=JSON.stringify(data);
    if(i>=0)arr[i]=data; else arr.push(data);
  }
  function sortAll(){
    var byOrd=function(a,b){return (a.ord||0)-(b.ord||0);};
    S.menu.sort(byOrd);S.drivers.sort(byOrd);S.partners.sort(byOrd);
    S.orders.sort(function(a,b){return b.t-a.t;});
  }

  /* ---------- Local adapter: one device, tabs stay in sync ---------- */
  function LocalAdapter(){
    function read(){try{return JSON.parse(localStorage.getItem(KEY_DB))||{};}catch(e){return {};}}
    function write(db){try{localStorage.setItem(KEY_DB,JSON.stringify(db));}catch(e){}}
    function load(){
      var db=read(),ch=[];
      var s=(db.meta&&db.meta.settings)||null;
      if(JSON.stringify(s)!==(last['meta/settings']||'null'))ch.push(['meta','settings',s]);
      COLLS.forEach(function(c){
        var m=db[c]||{};
        Object.keys(m).forEach(function(id){
          if(c==='orders'&&!wantOrder(m[id])&&!last[c+'/'+id])return;
          if(JSON.stringify(m[id])!==last[c+'/'+id])ch.push([c,id,m[id]]);
        });
        Object.keys(last).forEach(function(k){
          if(k.indexOf(c+'/')===0){var id=k.slice(c.length+1);if(!m[id])ch.push([c,id,null]);}
        });
      });
      if(ch.length)Sync.remote(ch);
    }
    return {
      mode:'local',
      start:function(){load();window.addEventListener('storage',function(e){if(e.key===KEY_DB)load();});return Promise.resolve();},
      watch:function(){load();},
      set:function(c,id,d){var db=read();db[c]=db[c]||{};db[c][id]=d;write(db);},
      del:function(c,id){var db=read();if(db[c])delete db[c][id];write(db);},
      nextNo:function(){var db=read();db.meta=db.meta||{};var n=((db.meta.counter&&db.meta.counter.n)||1000)+1;db.meta.counter={n:n};write(db);return Promise.resolve(n);},
      tx:function(c,id,fn){var db=read();var cur=db[c]&&db[c][id];var r=fn(cur?clean(cur):null);if(!r)return Promise.resolve(null);db[c]=db[c]||{};db[c][id]=clean(r);write(db);return Promise.resolve(r);}
    };
  }

  /* ---------- Cloud adapter: Firebase Firestore, all devices in sync ---------- */
  function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('load '+src));};document.head.appendChild(s);});}
  function CloudAdapter(cfg){
    var db, watched={};
    function onErr(e){console.error(e);if(hooks.onError)hooks.onError(e);}
    function watchOne(id){if(watched[id])return;watched[id]=1;db.collection('orders').doc(id).onSnapshot(function(s){Sync.remote([['orders',id,s.exists?s.data():null]]);},onErr);}
    function handle(c){return function(snap){var ch=[];snap.docChanges().forEach(function(x){ch.push([c,x.doc.id,x.type==='removed'?null:x.doc.data()]);});if(ch.length)Sync.remote(ch);};}
    return {
      mode:'cloud',
      start:function(){
        var base='https://www.gstatic.com/firebasejs/'+FB_VER+'/';
        return loadScript(base+'firebase-app-compat.js')
          .then(function(){return Promise.all([loadScript(base+'firebase-auth-compat.js'),loadScript(base+'firebase-firestore-compat.js')]);})
          .then(function(){
            if(!firebase.apps.length)firebase.initializeApp(cfg);
            return firebase.auth().signInAnonymously().catch(function(e){console.warn('auth',e);});
          })
          .then(function(){
            db=firebase.firestore();
            return new Promise(function(resolve){
              var done=false,fin=function(){if(!done){done=true;resolve();}};
              setTimeout(fin,8000);
              db.collection('meta').doc('settings').onSnapshot(function(s){Sync.remote([['meta','settings',s.exists?s.data():null]]);fin();},onErr);
              ['menu','drivers','partners'].forEach(function(c){db.collection(c).onSnapshot(handle(c),onErr);});
              if(filter.orders==='mine')ME.myOrders.slice(0,25).forEach(function(id){watchOne(id);});
              else db.collection('orders').where('t','>=',Date.now()-RECENT_DAYS*86400000).onSnapshot(handle('orders'),onErr);
            });
          });
      },
      watch:function(id){if(db)watchOne(id);},
      set:function(c,id,d){db.collection(c).doc(id).set(d).catch(onErr);},
      del:function(c,id){db.collection(c).doc(id).delete().catch(onErr);},
      nextNo:function(){var ref=db.collection('meta').doc('counter');return db.runTransaction(function(tx){return tx.get(ref).then(function(s){var n=((s.exists&&s.data().n)||1000)+1;tx.set(ref,{n:n});return n;});});},
      tx:function(c,id,fn){var ref=db.collection(c).doc(id);return db.runTransaction(function(tx){return tx.get(ref).then(function(s){var r=fn(s.exists?s.data():null);if(!r)return null;r=clean(r);tx.set(ref,r);return r;});});}
    };
  }

  window.Sync={
    get mode(){return adapter?adapter.mode:'';},
    start:function(opts,h){
      filter=opts||{};hooks=h||{};
      var cfg=window.SOLIS_FIREBASE;
      adapter=(!IS_DEMO&&cfg&&cfg.apiKey&&cfg.projectId)?CloudAdapter(cfg):LocalAdapter();
      return adapter.start();
    },
    remote:function(ch){
      ch.forEach(function(x){applyOne(x[0],x[1],x[2]);});
      sortAll();
      if(hooks.onRemote)hooks.onRemote(ch);
    },
    /* write every local change (diff against the database copy) */
    push:function(){
      if(!adapter)return;
      if(S.settings){var j=JSON.stringify(S.settings);if(last['meta/settings']!==j){last['meta/settings']=j;adapter.set('meta','settings',clean(S.settings));}}
      COLLS.forEach(function(c){
        var seen={};
        S[c].forEach(function(it){var k=c+'/'+it.id;seen[k]=1;var j=JSON.stringify(it);if(last[k]!==j){last[k]=j;adapter.set(c,it.id,clean(it));}});
        Object.keys(last).forEach(function(k){if(k.indexOf(c+'/')===0&&!seen[k]){delete last[k];adapter.del(c,k.slice(c.length+1));}});
      });
    },
    nextNo:function(){return adapter.nextNo();},
    watch:function(id){adapter.watch(id);},
    /* safe update of one record (e.g. two drivers taking the same job) */
    tx:function(c,id,fn){return adapter.tx(c,id,fn).then(function(r){if(r){Sync.remote([[c,id,r]]);}return r;});}
  };
})();
