/* ============ 艾牧戈智慧牧场 · 应用主逻辑 v3 ============ */
(() => {
  const $ = s => document.querySelector(s);
  const content = $('#content');
  const navBox = $('#nav');
  const crumb = $('#crumb');
  const fmt = n => Number(n).toLocaleString('zh-CN');
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  const APP_VERSION = 'v72';
  let current = 'dashboard';
  let demoMonth = new Date().getMonth() + 1;
  const SEASON_COLOR = { '春':'#7fb069', '夏':'#4f46e5', '秋':'#f59e0b', '冬':'#64748b' };
  const monthName = m => ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][m-1];

  /* ================= 登录会话与角色菜单 ================= */
  const AUTH_USER_KEY = 'yilate-auth-user';
  let authUser = null;
  try { authUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch(e){}
  const ROLE_MENUS = {
    owner: null,
    platform: null,
    ranch_admin: ['bigscreen','dashboard','cycle','livestock','grassland','forage','vaccine','devices','slaughter','products','gov','tourism','log','ledger','labor','insurance','gallery','admin','agent'],
    veterinarian: ['bigscreen','dashboard','livestock','forage','vaccine','log','gallery','agent'],
    herder: ['bigscreen','dashboard','livestock','grassland','forage','vaccine','devices','slaughter','log','labor','insurance','gallery','agent'],
    service: ['bigscreen','dashboard','tourism','products','log','agent'],
    gov: ['profile','bigscreen','dashboard','grassland','forage','vaccine','slaughter','gov','gallery']
  };
  function visibleNav(){
    const allow = authUser ? ROLE_MENUS[authUser.role] : null;
    return !allow ? DB.nav : DB.nav.filter(n=>allow.includes(n.key));
  }
  async function refreshAuth(){
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      const r = await fetch('/api/auth/me', {credentials:'include',headers:{accept:'application/json'}});
      if (!r.ok) { authUser=null; try{localStorage.removeItem(AUTH_USER_KEY)}catch(e){} return; }
      const d=await r.json(); authUser=d.user; try{localStorage.setItem(AUTH_USER_KEY,JSON.stringify(authUser))}catch(e){}
      if (authUser.mustChangePassword) { location.href='/change-password.html'; return; }
      const name=$('.user-name'), role=$('.user-role'), avatar=$('.avatar');
      if(name) name.textContent=authUser.name+' · 已登录';
      if(role) role.textContent=authUser.role==='owner'?'牧场最高管理员':authUser.role;
      if(avatar) avatar.textContent=(authUser.name||'牧').slice(0,1);
      const allowed=visibleNav().map(x=>x.key);
      if(!allowed.includes(current)) render(allowed[0]||'bigscreen'); else { renderNav(); }
    } catch(e){}
  }

  /* ================= 真实天气服务（Open-Meteo · 牧场坐标） ================= */
  let weatherLoading = false;
  function weatherCodeInfo(code){
    code = Number(code);
    if (code === 0) return { icon:'☀️', text:'晴' };
    if (code === 1) return { icon:'🌤️', text:'大部晴朗' };
    if (code === 2) return { icon:'⛅', text:'多云' };
    if (code === 3) return { icon:'☁️', text:'阴天' };
    if (code === 45 || code === 48) return { icon:'🌫️', text:'雾' };
    if (code >= 51 && code <= 57) return { icon:'🌦️', text:'毛毛雨' };
    if (code >= 61 && code <= 67) return { icon:'🌧️', text:'降雨' };
    if (code >= 71 && code <= 77) return { icon:'🌨️', text:'降雪' };
    if (code >= 80 && code <= 82) return { icon:'🌦️', text:'阵雨' };
    if (code >= 85 && code <= 86) return { icon:'❄️', text:'阵雪' };
    if (code >= 95 && code <= 99) return { icon:'⛈️', text:'雷雨' };
    return { icon:'☁️', text:'多云' };
  }
  function windDirection(deg){
    const dirs = ['北风','东北风','东风','东南风','南风','西南风','西风','西北风'];
    return dirs[Math.round(Number(deg || 0) / 45) % 8];
  }
  function renderWeatherPanel(){
    const w = DB.weather;
    const set = (id, value)=>{ const el = document.getElementById(id); if (el) el.textContent = value; };
    set('bsWeatherIcon', w.icon);
    set('bsWeatherTemp', `${Math.round(w.temp)}℃`);
    set('bsWeatherInfo', `${w.text} · ${w.wind} · ${w.snow} · 体感 ${Math.round(w.feels)}℃`);
    set('bsWeatherSource', `${w.source || 'Open-Meteo'} · ${w.updated || '本地备份'}`);
    const fc = document.getElementById('bsWeatherForecast');
    if (fc) fc.innerHTML = (w.forecast || []).slice(0,3).map(f=>`<div><span>${f.day}</span><b>${f.icon}${Math.round(f.high)}℃</b><i>${Math.round(f.low)}℃</i></div>`).join('');
  }
  async function refreshRealWeather(){
    if (weatherLoading) return;
    weatherLoading = true;
    const lat = DB.meta.lat || 48.02, lon = DB.meta.lon || 118.08;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FShanghai&forecast_days=4`;
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 9000);
    try {
      const res = await fetch(url, { signal: controller.signal, cache:'no-store' });
      if (!res.ok) throw new Error('weather http ' + res.status);
      const j = await res.json();
      const cur = j.current || {}, daily = j.daily || {};
      const info = weatherCodeInfo(cur.weather_code);
      const days = ['明天','后天','大后天'];
      const forecast = (daily.time || []).slice(1,4).map((t,i)=>{
        const di = weatherCodeInfo((daily.weather_code || [])[i+1]);
        return { day:days[i] || t, icon:di.icon, high:(daily.temperature_2m_max || [])[i+1], low:(daily.temperature_2m_min || [])[i+1] };
      });
      const precip = Math.round((daily.precipitation_probability_max || [0])[0] || 0);
      const windSpeed = Math.round(cur.wind_speed_10m || 0);
      const low = Math.round((daily.temperature_2m_min || [cur.temperature_2m])[0]);
      let alert = '天气整体平稳，请关注昼夜温差和牧场实时预警。';
      if (low <= 0) alert = `低温提示：今夜最低 ${low}℃，犊牛舍注意保温、饮水防止结冰。`;
      else if (precip >= 60) alert = `降水概率 ${precip}%，请及时覆盖饲草区并检查棚圈排水。`;
      else if (windSpeed >= 35) alert = `风力较强，建议暂停无人机作业并加固棚圈设施。`;
      DB.weather = Object.assign({}, DB.weather, {
        temp:Math.round(cur.temperature_2m),
        feels:Math.round(cur.apparent_temperature),
        icon:info.icon,
        text:info.text,
        wind:`${windDirection(cur.wind_direction_10m)} ${windSpeed}km/h`,
        snow:`降水概率 ${precip}%`,
        low,
        high:Math.round((daily.temperature_2m_max || [cur.temperature_2m])[0]),
        humidity:Math.round(cur.relative_humidity_2m || 0),
        pressure:Math.round(cur.surface_pressure || 0),
        forecast,
        alert,
        source:'Open-Meteo 实时',
        updated:new Date().toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'})
      });
      saveDB();
      renderWeatherPanel();
      initWeatherChip();
    } catch(err){
      console.warn('实时天气获取失败，使用本地备份数据', err);
      const el = document.getElementById('bsWeatherSource');
      if (el) el.textContent = '本地备份 · 网络不可用';
    } finally {
      clearTimeout(timer);
      weatherLoading = false;
    }
  }

  /* ================= IoT 实时采集引擎（模拟智能硬件自动上报） ================= */
  const live = { on:true, lastSync:'—', t:DB.weather.temp, shed:24.3, online:0, ndvi:0.74, hum:58, visitors:48 };
  let iotTimer = null;
  function liveOnline(){ return DB.deviceList.filter(x=>x.state==='在线').reduce((s,x)=>s+x.count,0); }
  live.online = liveOnline();
  function startIot(){
    if (iotTimer) clearInterval(iotTimer);
    iotTimer = setInterval(()=>{
      if (!live.on) return;
      live.t = +(DB.weather.temp + (Math.random()*0.6-0.3)).toFixed(1);
      live.shed = +(24 + Math.random()*0.8).toFixed(1);
      live.online = Math.max(0, liveOnline() + (Math.random()<0.25?-1:0));
      live.ndvi = +(0.74 + (Math.random()*0.02-0.01)).toFixed(3);
      live.hum = Math.round(56 + Math.random()*6);
      live.visitors = 48 + Math.round(Math.random()*4-2);
      live.lastSync = new Date().toLocaleTimeString('zh-CN', {hour12:false});
      renderLive();
      const chip = $('#iotChip');
      if (chip) chip.textContent = '● 实时采集 ' + live.lastSync;
    }, DB.iot.interval || 5000);
  }
  function renderLive(){
    const map = {
      wtemp: live.t+'℃', shed: live.shed+'℃',
      online: fmt(live.online)+' 台', ndvi: live.ndvi.toFixed(3), hum: live.hum+'%',
      visitors: live.visitors+' 人', sync: live.lastSync
    };
    document.querySelectorAll('[data-live]').forEach(el=>{
      const k = el.dataset.live;
      if (k==='onlineRate') el.textContent = (live.online/DB.deviceList.reduce((s,x)=>s+x.count,0)*100).toFixed(1)+'%';
      else if (map[k]!=null) el.textContent = map[k];
    });
  }

  /* ================= 交互组件 ================= */
  function toast(msg, type='ok'){
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),320); }, 2300);
  }
  function openModal(title, fields, onSubmit){
    const ov = document.createElement('div'); ov.className='modal-overlay';
    ov.innerHTML = `
      <div class="modal">
        <div class="modal-head"><h3>${title}</h3><button class="modal-x" data-x>×</button></div>
        <div class="modal-body">
          ${fields.map(f=>`
            <label class="fld"><span>${f.label}</span>
              ${f.type==='select'
                ? `<select data-n="${f.name}">${f.options.map(o=>`<option value="${o.v}" ${String(o.v)===String(f.value||'')?'selected':''}>${o.t||o.v}</option>`).join('')}</select>`
                : f.type==='textarea'
                ? `<textarea data-n="${f.name}" rows="2" placeholder="${f.placeholder||''}">${f.value||''}</textarea>`
                : `<input data-n="${f.name}" type="${f.type||'text'}" value="${f.value||''}" placeholder="${f.placeholder||''}">`}
            </label>`).join('')}
        </div>
        <div class="modal-foot"><button class="btn ghost" data-cancel>取消</button><button class="btn solid" data-ok>保存</button></div>
      </div>`;
    document.body.appendChild(ov);
    const close = ()=>ov.remove();
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelector('[data-cancel]').onclick = close;
    ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
    ov.querySelector('[data-ok]').onclick = ()=>{
      const vals = {};
      fields.forEach(f=>{ const el = ov.querySelector(`[data-n="${f.name}"]`); vals[f.name] = el ? el.value.trim() : ''; });
      if (onSubmit(vals) !== false) close();
    };
    const first = ov.querySelector('input,select,textarea'); if (first) first.focus();
  }
  function confirmDel(msg, cb){
    const ov = document.createElement('div'); ov.className='modal-overlay';
    ov.innerHTML = `<div class="modal modal-sm"><div class="modal-body confirm-body"><span>⚠️</span><p>${msg}</p></div>
      <div class="modal-foot"><button class="btn ghost" data-no>取消</button><button class="btn danger" data-yes>删除</button></div></div>`;
    document.body.appendChild(ov);
    const close = ()=>ov.remove();
    ov.querySelector('[data-no]').onclick = close;
    ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
    ov.querySelector('[data-yes]').onclick = ()=>{ cb(); close(); };
  }
  function delBtn(path, id, label){
    return `<button class="mini-btn danger" data-del="${path}|${id}" title="删除">🗑 ${label||'删除'}</button>`;
  }
  function confirmAction(msg, okLabel, cb){
    const ov = document.createElement('div'); ov.className='modal-overlay';
    ov.innerHTML = `<div class="modal modal-sm"><div class="modal-body confirm-body"><span>📤</span><p style="white-space:pre-line">${escTxt(msg)}</p></div>
      <div class="modal-foot"><button class="btn ghost" data-no>取消</button><button class="btn solid" data-yes>${okLabel}</button></div></div>`;
    document.body.appendChild(ov);
    const close = ()=>ov.remove();
    ov.querySelector('[data-no]').onclick = close;
    ov.addEventListener('click', e=>{ if(e.target===ov) close(); });
    ov.querySelector('[data-yes]').onclick = ()=>{ cb(); close(); };
  }
  function editBtn(path, id){
    return `<button class="mini-btn" data-edit="${path}|${id}" title="编辑">✏️ 编辑</button>`;
  }
  function bindDel(scope){
    scope.querySelectorAll('[data-del]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const [path, id] = b.dataset.del.split('|');
        confirmDel('确定删除这条记录吗？删除后不可恢复。', ()=>{ delRecord(path, id); toast('已删除','warn'); render(current); });
      });
    });
  }
  /* 通用编辑：configs = { '路径': {title, fields} } */
  function bindEdit(scope, configs){
    scope.querySelectorAll('[data-edit]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const [path, id] = b.dataset.edit.split('|');
        const cfg = configs[path]; if (!cfg) return;
        const item = byPath(DB, path).find(x=>x.id===id); if (!item) return;
        openModal(cfg.title, cfg.fields.map(f=>Object.assign({}, f, { value: item[f.name] != null ? item[f.name] : (f.value||'') })), v=>{
          updateRecord(path, id, v); toast('已保存修改'); render(current);
        });
      });
    });
  }
  const pageSetting = key => (DB.pageSettings && DB.pageSettings[key]) || {};
  const pill = (text, cls='ok') => `<span class="pill ${cls}">${text}</span>`;
  const statCard = o => `
    <div class="stat-card">
      <div class="stat-ico" style="background:${o.bg||'#eef2ff'};color:${o.color||'#4f46e5'}">${o.icon}</div>
      <div class="stat-body"><div class="stat-label">${o.label}</div><div class="stat-value">${o.value}</div><div class="stat-sub">${o.sub||''}</div></div>
    </div>`;
  const card = (title, body, cls='') => `
    <div class="card ${cls}">${title?`<div class="card-head"><h3>${title}</h3></div>`:''}<div class="card-body">${body}</div></div>`;
  const tableHtml = (headers, rows, cls='') => `
    <div class="table-wrap ${cls?cls+'-wrap':''}"><table class="tbl ${cls}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td data-label="${headers[i]||''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const addBtn = (label, path) => `<button class="btn solid sm" data-add="${path||label}">＋ ${label}</button>`;
  const pageHeader = (title, sub, actions='') => {
    const saved = pageSetting(current);
    const finalTitle = saved.title || title;
    const finalSub = saved.subtitle || sub;
    return `
    <div class="page-head"><div><h2>${finalTitle}</h2><p>${finalSub}</p></div><div class="page-actions"><button class="btn ghost sm page-edit-btn" data-page-edit>✏️ 编辑本页</button>${actions}</div></div>`;
  };
  const weatherHtml = () => {
    const w = DB.weather;
    const fc = (w.forecast||[]).map(f=>`<div class="w-fc"><span>${f.day}</span><b>${f.icon} ${f.high}℃</b><i>${f.low}℃</i></div>`).join('');
    return `<div class="weather-card">
      <div class="w-main"><span class="w-ico">${w.icon}</span><span class="w-temp">${w.temp}℃</span></div>
      <div class="w-info"><div>${w.text} · 体感 ${w.feels}℃</div><div>${w.wind} · ${w.snow}</div><div class="w-range">最高 ${w.high}℃ / 最低 ${w.low}℃</div></div>
      <div class="w-forecast">${fc}</div>
      <div class="w-alert">⚠️ ${w.alert||w.alert}</div></div>`;
  };
  const taskHtml = list => `<div class="task-list">${list.map(t=>`
      <div class="task-item"><span class="task-ico">${t.icon}</span>
        <div class="task-main"><div class="task-txt">${t.text}</div><div class="task-time">${t.time}</div></div>
        <span class="pill ${t.level==='高'?'danger':t.level==='中'?'warn':'muted'}">${t.level}</span></div>`).join('')}</div>`;

  /* ================= 导航（可配置栏目） ================= */
  function renderNav(){
    navBox.innerHTML = visibleNav().map(n=>`
      <a class="nav-item ${n.key===current?'active':''}" data-page="${n.key}">
        <span class="nav-ico">${n.icon}</span><span class="nav-title">${n.title}</span>
      </a>`).join('');
    navBox.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click', ()=>render(n.dataset.page)));
    const mnav = $('#mnav');
    if (mnav){
      mnav.innerHTML = visibleNav().map(n=>{
        const mt = n.key==='agent' ? '智能服务小伊' : n.title;
        return `
        <button class="mn-item ${n.key===current?'active':''}" data-page="${n.key}" title="${n.title}">
          <span>${n.icon}</span><b>${mt}</b>
        </button>`;
      }).join('');
      mnav.querySelectorAll('.mn-item').forEach(b=>b.addEventListener('click', ()=>render(b.dataset.page)));
    }
  }
  function openNavSettings(){
    openModal('栏目设置 · 每个栏目名都可以修改', DB.nav.map(n=>({ name:'t_'+n.key, label:n.icon+' '+n.title, type:'text', value:n.title })), vals=>{
      DB.nav.forEach(n=>{ const v=(vals['t_'+n.key]||'').trim(); if (v) n.title = v; });
      saveDB(); toast('栏目名称已更新'); renderNav(); render(current);
    });
  }

  /* ================= 数据大屏 ================= */
  function pageBigscreen(){
    const ps = pageSetting('bigscreen');
    const c = compute(), m = DB.months[demoMonth-1], se = DB.seasons.find(x=>x.key===m.season);
    const livePorts = (DB.ports||[]).filter(p=>p.liveUrl||p.streamUrl);
    const cameraWall = ['生活区','饲草区','设备区','犊牛舍','牛只活动区','牛舍内'].map((name,i)=>({
      name, liveUrl:(livePorts[i]&&(livePorts[i].liveUrl||livePorts[i].streamUrl))||'',
      source:(livePorts[i]&&livePorts[i].name)||'待接入监控网关'
    }));
    const w = DB.weather;
    const intro = `${DB.meta.name}位于${DB.meta.location.replace('内蒙古 · ','')}，由牧场主${DB.meta.owner}经营，现养西门塔尔牛${fmt(c.cattle)}头。`;
    const ticker = [
      `牲畜存栏 ${fmt(c.totalAnimals)} 头只（西门塔尔牛 ${fmt(c.cattle)} 头：大牛 102 · 小牛 84）`,
      `草场 ${fmt(DB.meta.area)} 亩（自有 ${fmt(DB.meta.areaSelf)} · 租赁 ${fmt(DB.meta.areaRented)}）· 天然草 ${fmt(DB.forageInventory[0].stock)} 捆`,
      `联网终端 ${fmt(c.devTotal)} 台 · 在线率 ${c.devRate}%`,
      `监控 6 路（生活区/饲草/设备/犊牛舍/活动区/牛舍内）· 耳标测温 200 个 · 定位项圈 5 个 · 机器狗 1 台`,
      `端口对接 ${c.portsOn}/${(DB.ports||[]).length} · 监控 / 耳标 / 农机`,
      `牧户游订单 ${c.todayOrders} 单 · 今日游客 48 人`,
      `犊牛舍恒温 22℃ · 饮水不冻`,
      `当前 ${monthName(demoMonth)} · ${m.season}季 · ${m.name}`
    ].join('　◆　');
    const equipList = DB.deviceList.filter(d=>d.id!=='DV1');
    const equipOnline = equipList.filter(d=>String(d.state).includes('在线')).reduce((a,d)=>a+d.count,0);
    const equipOffline = equipList.reduce((a,d)=>a+d.count,0) - equipOnline;
    const metricStream = [
      `存栏 ${fmt(c.totalAnimals)} 头`,
      `大牛 ${fmt(DB.groups[0].count)} 头`,
      `小牛 ${fmt(DB.groups[1].count)} 头`,
      `自有草场 ${fmt(DB.meta.areaSelf)} 亩`,
      `租赁草场 ${fmt(DB.meta.areaRented)} 亩`,
      `草场合计 ${fmt(DB.meta.area)} 亩`,
      `监控 6 路`,
      `智能装备 ${equipList.length} 项`,
      `设备在线 ${fmt(equipOnline)} 台`
    ].join('   ◆   ');
    const railText = [
      'LIVESTOCK 186 HEAD', 'GRASSLAND 13,290 MU', 'OWNED 3,850 MU', 'LEASED 9,440 MU', 'NATIVE HAY 900 BUNDLES',
      'SMART DEVICES 7/8 ONLINE', 'CALVES 84', 'COWS 102', 'WINTER MODE ACTIVE',
      'YILATE SMART RANCH · HULUNBUIR'
    ].join('  ///  ');
    const letterize = text => [...text].map((ch,i)=>`<span style="--i:${i}">${ch===' '?'&nbsp;':ch}</span>`).join('');
    const particles = Array.from({length:32},(_,i)=>`<i style="--x:${(i*7.3+4)%96}%;--d:${(5+(i%7)*1.1).toFixed(1)}s;--dl:-${(i*.47).toFixed(2)}s;--s:${2+(i%4)}px;--c:${['#5eead4','#7dd3fc','#a78bfa','#f0b429','#fb7185'][i%5]}"></i>`).join('');
    return `
    <div class="bigscreen bs-v8">
      <div class="bs-sweeps"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="bs-letters">
        ${['牛·草·牧·数·据·云','牧·场·智·能·感·知','草·畜·平·衡·轮·牧','耳·标·测·温·定·位','自·动·称·重·分·群','饲·草·储·备·打·草','犊·牛·保·温·饮·水','政·务·对·接·溯·源','牧·户·游·接·待','智·慧·农·机·作·业','雪·灾·预·警·防·火','冷·链·产·品·溯·源','北·斗·短·报·文','无·人·机·巡·场'].map((t,i)=>`<span style="--x:${(i*7.1+1).toFixed(1)}%;--d:${(9+(i%5)*1.8).toFixed(1)}s;--dl:-${(i*0.85).toFixed(2)}s">${t}</span>`).join('')}
      </div>
      <div class="bs-radar"><i></i><i></i><i></i><b></b></div>
      <div class="bs-colorwash"><i></i><i></i><i></i></div>
      <div class="bs-globe"><i></i><i></i><i></i><b></b></div>
      <div class="bs-shapefield"><i class="shape-ring"></i><i class="shape-diamond"></i><i class="shape-tri"></i><i class="shape-bars"></i></div>
      <div class="bs-particles">${particles}</div>
      <canvas class="bs-fx-canvas" id="bsFxCanvas"></canvas>
      <div class="bs-bits">01001101 01010011 01010010 00110001 01011001 01001100 01010100 01000101 01010011 01001101 01010011 01010010 00110001 01011001 01001100 01010100 01000101</div>

      <div class="bs-top">
        <div class="bs-brand">
          <img src="assets/logo.png?v=72" alt="YILATE">
          <div><div class="bs-name">${DB.meta.name}</div><div class="bs-en">YILATE SMART RANCH</div></div>
        </div>
        <div class="bs-title-wrap">
          <div class="bs-title">${ps.title || '智慧牧场数据驾驶舱'}</div>
          <div class="bs-title-en">${ps.subtitle || 'SMART RANCH DATA COMMAND CENTER'}</div>
        </div>
        <div class="bs-tools">
          <button class="btn ghost sm bs-voice" id="bsVoice">🔊 语音讲解</button>
          <div class="bs-time" id="bsTime"></div>
          <button class="btn ghost sm bs-full" id="bsFull">⛶ 全屏</button>
        </div>
      </div>

      <div class="bs-kpistrip">
        ${[
          ['🐂 牲畜存栏', fmt(c.totalAnimals)+' 头只', `西门塔尔牛 ${fmt(c.cattle)}（大牛 102 / 小牛 84）`],
          ['🌾 草场面积', fmt(DB.meta.area)+' 亩', '自有 3,850 + 租赁 9,440'],
          ['🧊 天然草储备', fmt(DB.forageInventory[0].stock)+' 捆', '目标 1,000 捆'],
          ['📡 设备在线率', c.devRate+'%', `在线 ${fmt(c.devOnline)} 台`],
          ['💰 今日经营', '¥'+(12680).toLocaleString('zh-CN'), `订单 ${c.todayOrders} 单`]
        ].map(([t,v,d])=>`<div class="bs-kpi"><span>${t}</span><b>${v}</b><i>${d}</i></div>`).join('')}
      </div>

      <div class="bs-metric-stream"><div class="bs-metric-track">${letterize(metricStream + '   ◆   ' + metricStream)}</div></div>
      <div class="bs-protocol-strip">
        ${['AI VISION','BEIDOU / GNSS','5G IOT','RTK CONTROL','MQTT GATEWAY','OPEN API'].map((x,i)=>`<span style="--pc:${['#5eead4','#7dd3fc','#a78bfa','#f0b429','#fb7185','#34d399'][i]}"><i></i>${x}</span>`).join('')}
      </div>

      <div class="bs-body">
        <div class="bs-col">
          <section class="bs-panel">
            <div class="bsp-title">🐂 牛群结构与存栏 <em>LIVESTOCK</em></div>
            <div class="bsp-big">${fmt(c.totalAnimals)}</div>
            <div class="bsp-sub">大牛 102 · 小牛 84</div>
            <div id="bsStock" class="bs-chart"></div>
          </section>
          <section class="bs-panel">
            <div class="bsp-title">⚖️ 增重趋势（kg） <em>WEIGHT GAIN</em></div>
            <div id="bsGain" class="bs-chart"></div>
            <div class="bsp-sub">数据来源：三分群全自动保定称</div>
          </section>
          <section class="bs-panel">
            <div class="bsp-title">🌾 草场载畜利用 <em>GRASSLAND</em></div>
            <div id="bsPasture" class="bs-chart"></div>
            <div class="bsp-sub">自有 3,850 亩 · 租赁 9,440 亩 · 打草 1,500 亩</div>
          </section>
          <section class="bs-panel bs-breed-panel">
            <div class="bsp-title">🍼 繁育与产犊 <em>BREEDING</em></div>
            <div class="bs-mini-metrics">
              <div><b>84</b><span>年度产犊</span></div>
              <div><b>96%</b><span>犊牛成活率</span></div>
              <div><b>3</b><span>待产母牛</span></div>
            </div>
            <div class="bs-line-progress"><div><span>年度繁育进度</span><b>84 / 120 头</b></div><i><b style="width:70%"></b></i></div>
            <div class="bs-ring-mini" style="--p:96"><b>96%</b><span>成活率</span></div>
          </section>
          <section class="bs-panel bs-balance-panel">
            <div class="bsp-title">⚖️ 草畜平衡与权属 <em>BALANCE</em></div>
            <div class="bs-balance-top"><b>${fmt(DB.grassland.balance.rate)}%</b><span>载畜量使用率 · 安全线 90%</span></div>
            <div class="bs-balance-split"><span>自家 ${fmt(DB.meta.areaSelf)} 亩</span><span>租赁 ${fmt(DB.meta.areaRented)} 亩</span></div>
            <div class="bs-balance-bar"><i style="width:${Math.min(100,DB.grassland.balance.rate)}%"></i></div>
            <div class="bs-balance-note">标准家畜单位 ${fmt(DB.grassland.balance.actual)} / 承载上限 ${fmt(DB.grassland.balance.capacity)}</div>
          </section>
          <section class="bs-panel bs-condition-panel">
            <div class="bsp-title">📊 牛只体况分级 <em>BODY CONDITION</em></div>
            <div class="bs-condition-grid">
              ${[['特级',18,'#5eead4'],['一级',44,'#7dd3fc'],['二级',28,'#a78bfa'],['三级',10,'#f59e0b']].map(x=>`<div style="--cc:${x[2]}"><span>${x[0]}</span><b>${x[1]}%</b><i><em style="width:${x[1]}%"></em></i></div>`).join('')}
            </div>
            <div class="bs-condition-wave">${Array.from({length:18},(_,i)=>`<i style="height:${28+((i*17)%58)}%;--i:${i}"></i>`).join('')}</div>
          </section>
        </div>

        <div class="bs-col bs-mid">
          <section class="bs-panel bs-map-panel">
            <div class="bsp-title">🗺️ 牧场空间态势 <em>RANCH MAP</em></div>
            <div class="bs-map bs-map-robot">
              ${[['🏠','大牛棚圈','z1'],['🐮','犊牛舍','z2'],['🌾','牛只活动区','z3'],['🏘️','生活区','z4'],['🔧','设备存放区','z5'],['🧊','饲草区','z6']].map((x,i)=>`<span class="map-zone ${x[2]}" style="--mc:${['#22d3ee','#a3e635','#34d399','#f472b6','#a78bfa','#f59e0b'][i]}"><i>${x[0]}</i>${x[1]}<b></b></span>`).join('')}
              <svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M18 19 L42 13 L67 21 L83 42 L58 49 L28 43 Z M42 13 L58 49 M18 19 L58 49 M67 21 L28 43"/></svg>
              <div class="bs-dh bs-dh-center" id="dhBox" title="点击AI机器人听牧场简介">
                <div class="dh-avatar dh-human">
                  <div class="human-photo-wrap video-wrap">
                    <div class="narrator-motion" id="narratorMotion" role="img" aria-label="透明背景巴尔虎服饰讲解员动态"></div>
                    <i class="human-light-scan"></i>
                    <span class="video-frame-glow"></span>
                  </div>
                </div>
                <div class="dh-bubble dh-line">
                  <div class="dh-line-flow">
                    <span>YILATE SMART RANCH · AI机器人讲解 · 牧场简介 · 西门塔尔牛 ·</span>
                    <span>YILATE SMART RANCH · AI机器人讲解 · 牧场简介 · 西门塔尔牛 ·</span>
                  </div>
                  <div class="dh-text" id="dhText">牧场简介</div>
                </div>
              </div>
            </div>
          </section>
          <section class="bs-panel">
            <div class="bsp-title">🎥 监控画面（6 路） <em>${livePorts.length?'直播':'待接网关'}</em></div>
            <div class="bs-cams">
              ${cameraWall.map(x=>`<div class="bs-cam ${x.liveUrl?'has-live':''}" ${x.liveUrl?`data-live-url="${escTxt(x.liveUrl)}"`:''} data-camera-name="${escTxt(x.name)}" title="${escTxt(x.source)}"><span>●</span>${escTxt(x.name)}<i>${x.liveUrl?'点击直播':'待接网关'}</i></div>`).join('')}
            </div>
          </section>
          <section class="bs-panel bs-season">
            <div class="bsp-title">🍃 当前生产季 <em>SEASON</em></div>
            <div class="bs-season-name" style="color:${se.color}">${m.season}季</div>
            <div class="bs-season-focus">${monthName(demoMonth)} · ${m.name} — ${se.focus}</div>
            <div class="year-cycle bs-yc">
              ${DB.months.map((mm,i)=>`<div class="yc-cell ${i===demoMonth-1?'now':''}" style="--yc:${SEASON_COLOR[mm.season]}" data-m="${i+1}">${mm.m}</div>`).join('')}
            </div>
            <div class="bs-tasks">${m.tasks.slice(0,2).map(t=>`<div class="bs-task"><span>◆</span>${t}</div>`).join('')}</div>
          </section>
          <section class="bs-panel bs-equip-panel">
            <div class="bsp-title">📡 智能装备在线状态 <em>SMART EQUIPMENT</em></div>
            <div class="bs-equip-summary"><span><i class="ok"></i>在线 ${fmt(equipOnline)} 台</span><span><i class="off"></i>离线/检修 ${fmt(equipOffline)} 台</span><span>监控已在监控墙 · 端口 ${c.portsOn}/${(DB.ports||[]).length}</span></div>
            <div class="bs-equip-grid">
              ${equipList.map(d=>{
                const on = String(d.state).includes('在线');
                return `<div class="bs-equip ${on?'is-online':'is-offline'}" title="${d.name} · ${d.state} · ${d.protocol}">
                  ${bigDeviceArt(d.name)}
                  <div class="bs-equip-meta"><b>${devShortName(d.name)}</b><small>${fmt(d.count)}台 · ${d.state}</small></div>
                  <i class="bs-equip-dot"></i>
                </div>`;
              }).join('')}
            </div>
          </section>
          <section class="bs-panel bs-shed-panel">
            <div class="bsp-title">🏠 棚圈环境与设施 <em>FACILITY</em></div>
            <div class="bs-shed-grid">
              ${(DB.meta.facilities||[]).slice(0,2).map((f,i)=>`<div><span>${f.icon}</span><div><b>${f.name}</b><em>${i===0?'102 头 · 保温正常':'84 头 · 恒温 22℃'}</em></div></div>`).join('')}
            </div>
            <div class="bs-shed-env"><span>🌡️ 犊牛舍 22℃</span><span>💧 饮水 12℃</span><span>🌬️ 通风正常</span></div>
          </section>
          <section class="bs-panel bs-cow-health">
            <div class="bsp-title">❤️ 牛只健康监测 <em>HERD HEALTH</em></div>
            <div class="bs-cow-health-grid">
              <div><b>38.6℃</b><span>平均体温</span></div>
              <div><b>2</b><span>发情预警</span></div>
              <div><b>3</b><span>待产母牛</span></div>
              <div><b>98%</b><span>活动正常</span></div>
            </div>
            <div class="bs-health-spark">${Array.from({length:24},(_,i)=>`<i style="--i:${i};height:${32+((i*17)%58)}%"></i>`).join('')}</div>
            <div class="bs-health-foot"><span>耳标测温在线</span><b>186 / 186 头</b></div>
          </section>
        </div>

        <div class="bs-col">
          <section class="bs-panel bs-weather">
            <div class="bsp-title">🌦️ ${w.place} <em>实时天气</em><button class="bs-weather-refresh" id="bsWeatherRefresh" title="刷新真实天气">↻</button></div>
            <div class="bs-w-main"><span id="bsWeatherIcon">${w.icon}</span><b id="bsWeatherTemp">${w.temp}℃</b></div>
            <div class="bs-w-info" id="bsWeatherInfo">${w.text} · ${w.wind} · ${w.snow}</div>
            <div class="bs-w-fc" id="bsWeatherForecast">
              ${(w.forecast||[]).map(f=>`<div><span>${f.day}</span><b>${f.icon}${f.high}℃</b><i>${f.low}℃</i></div>`).join('')}
            </div>
            <div class="bs-w-source" id="bsWeatherSource">${w.source||'Open-Meteo'} · ${w.updated||'本地备份'}</div>
          </section>

          <section class="bs-panel bs-forage-panel">
            <div class="bsp-title">🧊 饲草储备与冬储 <em>FORAGE</em></div>
            <div class="bs-forage-head"><div><b>${c.foragePct}%</b><span>冬储完成率</span></div><small>天然草 · 青贮 · 精料</small></div>
            <div class="bs-forage-list">
              ${DB.forageInventory.map((x,i)=>{const pct=Math.max(2,Math.min(100,Math.round(x.stock/x.target*100)));return `<div class="bs-forage-row"><div><span>${x.name.replace('（打草场自产）','')}</span><b>${x.stock}/${x.target} ${x.unit}</b></div><div class="bs-forage-bar"><i style="width:${pct}%;--fc:${['#34d399','#22d3ee','#a78bfa','#f0b429'][i%4]}"></i></div></div>`}).join('')}
            </div>
          </section>

          <section class="bs-panel bs-health-data">
            <div class="bsp-title">💉 防疫健康与免疫 <em>HEALTH</em></div>
            <div class="bs-health-metrics">
              <div><b>${DB.vaccinePlans.length}</b><span>免疫项目</span></div>
              <div><b>${DB.vaccineRecords.filter(r=>r.status==='完成').length}</b><span>完成记录</span></div>
              <div><b>96.8%</b><span>免疫覆盖率</span></div>
            </div>
            <div class="bs-health-list">
              ${DB.vaccinePlans.slice(0,2).map(v=>`<div><span>${v.season.replace('（3-4月）','').replace('（9-10月）','')}</span><b>${v.vaccine}</b></div>`).join('')}
            </div>
          </section>

          <section class="bs-panel bs-biz-panel">
            <div class="bsp-title">💰 产品与经营 <em>BUSINESS</em></div>
            <div class="bs-biz-metrics">
              <div><b>${money(c.saleAmount)}</b><span>累计销售</span></div>
              <div><b>${c.todayOrders} 单</b><span>牧游订单</span></div>
            </div>
            <div class="bs-biz-stock">
              ${DB.productInventory.slice(0,3).map(x=>`<span><i>${x.name.includes('牛肉')?'🥩':x.name.includes('犊牛')?'🐮':'🥛'}</i>${x.name} <b>${x.stock}${x.unit}</b></span>`).join('')}
            </div>
          </section>
          <section class="bs-panel bs-gov-panel">
            <div class="bsp-title">🏛️ 政府数据接口 <em>GOV DATA</em></div>
            <div class="bs-gov-metrics"><div><b>${(DB.gov.systems||[]).length}</b><span>已对接系统</span></div><div><b>${(DB.gov.reports||[]).length}</b><span>上报记录</span></div><div><b>100%</b><span>成功率</span></div></div>
            <div class="bs-gov-list">${(DB.gov.systems||[]).slice(0,2).map(g=>`<span><i></i>${g.name.replace('动物','')}<b>${g.status}</b></span>`).join('')}</div>
          </section>
          <section class="bs-panel bs-energy-panel">
            <div class="bsp-title">⚡ 能源与环境 <em>ENERGY</em></div>
            <div class="bs-energy-grid">
              <div><span>光伏发电</span><b>4.8 kW</b></div>
              <div><span>水源余量</span><b>82%</b></div>
              <div><span>饲料间湿度</span><b>58%</b></div>
              <div><span>网络信号</span><b>5G/北斗</b></div>
            </div>
            <div class="bs-energy-bars">${Array.from({length:16},(_,i)=>`<i style="height:${25+((i*23)%65)}%;--i:${i}"></i>`).join('')}</div>
          </section>
        </div>
      </div>

      <div class="bs-bottom bs-bottom-v18">
        <div class="bs-daily-strip">
          ${[
            ['今日产犊','2','头','#a3e635'],
            ['今日饲喂','2','次','#22d3ee'],
            ['今日称重','5','头','#a78bfa'],
            ['今日订单',c.todayOrders,'单','#f472b6'],
            ['今日预警',DB.tasks.length,'项','#fb923c']
          ].map((x,i)=>`<div style="--dc:${x[3]}"><span>${x[0]}</span><b>${x[1]}</b><i>${x[2]}</i><em style="width:${48+(i*11)%44}%"></em></div>`).join('')}
        </div>
        <div class="bs-data-rail">
          <div class="bs-rail-label"><i></i><b>实时数据</b><small>数据自动更新</small></div>
          <div class="bs-rail-marquee"><div class="bs-rail-track">${letterize(railText + '  ///  ' + railText)}</div></div>
          <div class="bs-rail-tag">YILATE / HULUNBUIR</div>
        </div>
      </div>

      <div class="bs-foot">
        <div class="bs-flow">
          ${['🌱 种草养地','🐂 四季轮牧','🌾 打草储备','🍼 繁殖育肥','🍖 出栏屠宰','🛍️ 产品品牌','🏕️ 牧户文旅','💰 反哺草场'].map((x,i)=>`<span>${x}</span>${i<7?'<i>→</i>':''}`).join('')}
        </div>
        <div class="bs-copy">© 2026 ${DB.meta.name} · ${DB.meta.location} · 数据实时更新</div>
      </div>
    </div>`;
  }
  function startBigscreenCanvas(){
    const canvas = document.getElementById('bsFxCanvas');
    if (!canvas || !canvas.getContext) return ()=>{};
    const ctx = canvas.getContext('2d');
    let raf = 0, w = 0, h = 0, dpr = 1;
    const nodes = Array.from({length:64}, (_,i)=>({
      x:Math.random(), y:Math.random(), vx:(Math.random()-.5)*.00028, vy:(Math.random()-.5)*.00028,
      r:1 + (i%5)*.34, c:['#5eead4','#7dd3fc','#a78bfa','#f0b429','#fb7185'][i%5]
    }));
    const resize = ()=>{
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width)); h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const draw = (now)=>{
      if (!document.body.contains(canvas)) return;
      ctx.clearRect(0,0,w,h);
      const t = now/1000;
      for (let k=0;k<3;k++){
        ctx.beginPath();
        const amp = 10 + k*5, base = h*(0.22 + k*0.28);
        for (let x=0;x<=w;x+=12){
          const y = base + Math.sin(x/120 + t*(0.45+k*0.14)) * amp + Math.cos(x/310 - t*.3) * 8;
          x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        }
        ctx.strokeStyle = ['rgba(94,234,212,.18)','rgba(125,211,252,.17)','rgba(167,139,250,.15)'][k];
        ctx.lineWidth = 1.1;
        ctx.shadowColor = ['#5eead4','#7dd3fc','#a78bfa'][k]; ctx.shadowBlur = 14; ctx.stroke();
      }
      nodes.forEach(n=>{ n.x += n.vx; n.y += n.vy; if(n.x<0||n.x>1)n.vx*=-1; if(n.y<0||n.y>1)n.vy*=-1; });
      ctx.shadowBlur = 0;
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i], ax=a.x*w, ay=a.y*h;
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j], bx=b.x*w, by=b.y*h, dx=ax-bx, dy=ay-by, d=Math.hypot(dx,dy);
          if(d<125){
            ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
            ctx.strokeStyle = `rgba(125,211,252,${(1-d/125)*.20})`; ctx.lineWidth=.8; ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(ax,ay,a.r,0,Math.PI*2);
        ctx.fillStyle=a.c; ctx.globalAlpha=.62 + .28*Math.sin(t*2+i); ctx.fill(); ctx.globalAlpha=1;
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize', resize); raf = requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); ctx.clearRect(0,0,w,h); };
  }

  function countUp(el, target, dur=1200, suffix=''){
    if (!el) return;
    const start = performance.now(), from = 0;
    const step = now => {
      const t = Math.min(1, (now-start)/dur);
      const val = Math.round(from + (target-from) * (1-Math.pow(1-t,3)));
      el.textContent = fmt(val) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function afterBigscreen(){
    /* 数据科技动态层 */
    const stopBigscreenCanvas = startBigscreenCanvas();
    /* 数字计数 */
    countUp(document.querySelector('.bsp-big'), compute().totalAnimals, 1400);
    renderWeatherPanel();
    refreshRealWeather();
    const bsRoot = document.querySelector('.bs-v8');
    let paletteNo = 0;
    const paletteTimer = setInterval(()=>{ if (bsRoot && document.body.contains(bsRoot)) bsRoot.dataset.palette = String(++paletteNo % 4); }, 4200);
    const wRefresh = $('#bsWeatherRefresh');
    if (wRefresh) wRefresh.addEventListener('click', ()=>{ toast('正在获取牧场实时天气…'); refreshRealWeather(); });

    /* ① 牛群结构 */
    Charts.donut($('#bsStock'), { size:112, thickness:14, centerValue:fmt(compute().totalAnimals), centerTitle:'存栏',
      segments: DB.species.map(x=>({ label:x.name, value:x.count, color:x.color })) });

    /* ② 增重趋势 */
    const g = DB.growth;
    if ($('#bsGain') && g){
      const days = g.animals[0].days;
      Charts.line($('#bsGain'), {
        labels: days.map(d=>d+'天'), height:104, yFormat:v=>Math.round(v),
        series: g.animals.slice(0,4).map((a,i)=>({ name:a.tag, color:['#5eead4','#38bdf8','#f0b429','#a78bfa'][i], values:a.weights }))
      });
    }

    /* ③ 草场载畜利用 */
    Charts.bars($('#bsPasture'), {
      labels:['冬·东','冬·南','春·返青','夏·西','一号打草','二号打草'],
      series:[{ name:'载畜量利用率 %', color:'#38bdf8', values:[62,58,0,52,0,0] }],
      height:96, yFormat:v=>Math.round(v)+'%' });

    /* ⑤ 月份切换 */
    $('#content').querySelectorAll('.bs-yc .yc-cell').forEach(c=>c.addEventListener('click', ()=>{ demoMonth=+c.dataset.m; render(current); }));

    /* 监控大屏直播 */
    $('#content').querySelectorAll('.bs-cam[data-live-url]').forEach(b=>b.addEventListener('click', ()=>openCameraViewer(b.dataset.cameraName, b.dataset.liveUrl)));

    /* ⑥ 全屏 */
    const fs = $('#bsFull');
    if (fs) fs.addEventListener('click', ()=>{
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    });

    /* ⑦ AI机器人数字讲解：牧场简介 + 新闻主播式语音播报 */
    const profileIntro = (DB.narration && DB.narration[0] && DB.narration[0].text) || intro;
    let voiceOn = false, newsVoice = null;
    const voiceBtn = $('#bsVoice'), dhBox = $('#dhBox'), calfBox = $('#calfBox');
    const pickNewsVoice = ()=>{
      if (!window.speechSynthesis) return;
      const voices = speechSynthesis.getVoices() || [];
      const meta = v=>((v.lang||'')+' '+(v.name||'')+' '+(v.voiceURI||'')).toLowerCase();
      const isCantonese = v=>/yue|zh-hk|zh-mo|cantonese|hong kong|粤语|粵語|sin-?ji/i.test(meta(v));
      const zh = voices.filter(v=>!/^en/i.test(v.lang||'') && /zh|chinese|中文|普通话|mandarin|putonghua/i.test(meta(v)) && !isCantonese(v));
      const mandarin = zh.filter(v=>/zh-cn|zh-sg|mandarin|putonghua|普通话|大陆|简体/i.test(meta(v)));
      const pool = mandarin.length ? mandarin : zh;
      newsVoice = pool.find(v=>/xiaoxiao|yunxi|xiaoyi|yunjian/i.test(meta(v)))
        || pool.find(v=>/natural|online/i.test(meta(v)))
        || pool.find(v=>/ting-?ting|meijia|huihui|kangkang|yaoyao/i.test(meta(v)))
        || pool[0] || null;
      if (newsVoice) document.documentElement.dataset.narratorVoice = newsVoice.name;
    };
    pickNewsVoice();
    if (window.speechSynthesis) speechSynthesis.onvoiceschanged = pickNewsVoice;
    const resetVoiceButton = ()=>{ if (voiceBtn) voiceBtn.textContent = '🔊 语音讲解'; };
    const humanRoot = document.querySelector('.dh-human');
    const motionEl = document.getElementById('narratorMotion');
    let talkTimer = null, motionTimer = null, motionFrame = 0;
    const setMotionFrame = (frame)=>{
      motionFrame = ((frame % 61) + 61) % 61;
      if (!motionEl) return;
      const col = motionFrame % 10, row = Math.floor(motionFrame / 10);
      motionEl.style.backgroundPosition = `${(col * 100 / 9).toFixed(4)}% ${(row * 100 / 9).toFixed(4)}%`;
    };
    const stopTalkMotion = ()=>{
      if (talkTimer){ clearInterval(talkTimer); talkTimer = null; }
      if (motionTimer){ clearInterval(motionTimer); motionTimer = null; }
      setMotionFrame(0);
      if (humanRoot){ humanRoot.classList.remove('is-speaking'); humanRoot.dataset.talk = '0'; }
    };
    const startTalkMotion = ()=>{
      if (!humanRoot) return;
      humanRoot.classList.add('is-speaking');
      let phase = 0;
      talkTimer = setInterval(()=>{ humanRoot.dataset.talk = String(phase++ % 3); }, 220);
      if (motionEl){
        if (motionTimer) clearInterval(motionTimer);
        setMotionFrame(0);
        motionTimer = setInterval(()=>setMotionFrame(motionFrame + 1), 167);
      }
    };
    setMotionFrame(0);
    const speak = (txt = profileIntro)=>{
      if (!window.speechSynthesis) return;
      if (speechSynthesis.speaking) return;
      try {
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'zh-CN';
        u.rate = 1.0;
        u.pitch = 1.0;
        u.volume = 1;
        if (newsVoice) u.voice = newsVoice;
        u.onstart = startTalkMotion;
        u.onboundary = e=>{ if (humanRoot) humanRoot.dataset.talk = String((e.charIndex || 0) % 3); };
        u.onend = ()=>{ voiceOn = false; resetVoiceButton(); stopTalkMotion(); };
        u.onerror = ()=>{ voiceOn = false; resetVoiceButton(); stopTalkMotion(); };
        speechSynthesis.speak(u);
      } catch(e){ voiceOn = false; resetVoiceButton(); stopTalkMotion(); }
    };
    const startNarration = (msg)=>{
      voiceOn = true;
      if (voiceBtn) voiceBtn.textContent = '🔇 关闭语音';
      speak();
      toast(msg || '🔊 AI机器人正在完整讲解牧场简介');
    };
    /* 点击数字讲解员或小牛 → 完整播报牧场简介 */
    if (dhBox) dhBox.addEventListener('click', ()=>startNarration('🔊 数字讲解员已启动'));
    if (calfBox) calfBox.addEventListener('click', (e)=>{
      e.stopPropagation();
      startNarration('🐮 小牛提示：正在完整讲解伊拉特智慧牧场简介');
    });
    if (voiceBtn) voiceBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      voiceOn = !voiceOn;
      voiceBtn.textContent = voiceOn ? '🔇 关闭语音' : '🔊 语音讲解';
      if (voiceOn) speak();
      else if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch(err){} stopTalkMotion(); }
      toast(voiceOn ? 'AI机器人开始完整讲解牧场简介' : '已关闭语音讲解');
    });
    /* 离开大屏时停止朗读与轮播 */
    const obs = new MutationObserver(()=>{
      if (!document.querySelector('.bs-v8')){ clearInterval(paletteTimer); stopBigscreenCanvas(); stopTalkMotion(); try{ speechSynthesis.cancel(); }catch(e){} obs.disconnect(); }
    });
    obs.observe(content, { childList: true });

    /* ⑧ 时钟 */
    const tick = ()=>{
      const el = $('#bsTime'); if (el){
        const d = new Date();
        el.textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
      }
    };
    tick(); const t2 = setInterval(tick, 1000);
    const obs2 = new MutationObserver(()=>{ if (!document.querySelector('.bs-v8')){ clearInterval(t2); obs2.disconnect(); } });
    obs2.observe(content, { childList: true });
  }

  /* ================= 数据总览 ================= */
  function pageDashboard() {
    const c = compute(), m = DB.months[demoMonth-1], se = DB.seasons.find(x=>x.key===m.season);
    const ps = pageSetting('dashboard');
    const vaccineDone = DB.vaccineRecords.filter(r=>r.status==='完成').length;
    return `
    <div class="page">
      <div class="hero-banner">
        <div class="hero-txt">
          <h2>${ps.title || (monthName(demoMonth)+' · '+m.season+'季（'+m.name+'）')}</h2>
          <p>${ps.subtitle || DB.meta.slogan}</p>
        </div>
        <div class="hero-badges">
          <div class="hero-badge">今日值班：吉日嘎拉 · 兽医</div>
          <div class="hero-badge">演示月份：${demoMonth}月 · ${m.season}季</div>
        </div>
      </div>
      <div class="kpi-grid">
        ${statCard({icon:'🐄', label:'牲畜存栏', value:fmt(c.totalAnimals)+' 头只', sub:DB.species.map(x=>x.name+' '+fmt(x.count)).join(' · '), color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🌾', label:'草场面积', value:fmt(DB.meta.area)+' 亩', sub:'放牧 '+fmt(DB.meta.grazingArea)+' · 打草 '+fmt(DB.meta.hayArea), color:'#475569', bg:'#f1f5f9'})}
        ${statCard({icon:'🧊', label:'饲草储备', value:c.foragePct+'%', sub:'天然草 900/1,000 捆 · 备战寒冬', color:'#64748b', bg:'#f1f5f9'})}
        ${statCard({icon:'📡', label:'智慧装备在线', value:c.devRate+'%', sub:'在线 '+fmt(c.devOnline)+'/'+fmt(c.devTotal)+' · 成套 '+fmt(c.kit)+' 台套', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'🍖', label:'本季出栏屠宰', value:c.slHead+' 头只', sub:'检疫合格率 100%', color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'🛍️', label:'产品销售收入', value:money(c.saleAmount), sub:'冷鲜肉/奶食/绒品/文创', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'🏕️', label:'牧游订单', value:c.todayOrders+' 单', sub:'今日游客 48 人 · 评分 4.9', color:'#8b5cf6', bg:'#ede9fe'})}
        ${statCard({icon:'⚖️', label:'草畜平衡', value:c.sheepUnits.toLocaleString()+' 标准家畜单位', sub:'安全线内 '+DB.grassland.balance.rate+'%', color:'#4f46e5', bg:'#eef2ff'})}
      </div>
      <div class="live-strip">
        <div class="ls-title">● 实时采集 <small>智能硬件自动上报 · 无需人工录入</small></div>
        <div class="ls-chips">
          <span>🐄 牛只体温 <b>38.6℃</b></span>
          <span>🏠 圈舍温度 <b data-live="shed">24.3℃</b></span>
          <span>📡 设备在线 <b data-live="online">${fmt(liveOnline())} 台</b></span>
          <span>🛰️ 草场 NDVI <b data-live="ndvi">0.740</b></span>
          <span>🧊 饲草库湿度 <b data-live="hum">58%</b></span>
          <span>🕐 最近上报 <b data-live="sync">—</b></span>
        </div>
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('存栏结构', `<div id="chStock" class="chart-box"></div>`)}
          ${card('近 12 个月牲畜存栏走势', `<div id="chTrend" class="chart-box"></div>`)}
        </div>
        <div class="col1">
          ${card('今日天气 · 新巴尔虎左旗', weatherHtml())}
          ${card('生态与灾害预警 · 平台自动监测', `
            <div class="eco-strip">
              ${DB.hulunbuir.eco.map(x=>`
                <div class="es-item"><span>${x.icon}</span><b>${x.name}</b><i>${x.level}</i><p>${x.desc}</p></div>`).join('')}
            </div>`)}
          ${card('今日待办与预警', taskHtml(DB.tasks))}
        </div>
      </div>
      <div class="grid-3">
        <div class="col1">${card('四季轮牧 · 年度循环进度', `
          <div class="year-cycle">
            ${DB.months.map((mm,i)=>`<div class="yc-cell ${i===demoMonth-1?'now':''}" style="--yc:${SEASON_COLOR[mm.season]}" data-m="${i+1}" title="${monthName(mm.m)} · ${mm.season}季">${mm.m}</div>`).join('')}
          </div>
          <div class="cycle-now">当前：${monthName(demoMonth)} · ${m.season}季 · ${m.name} — ${m.tasks[0]}</div>
          <div class="cycle-nav"><button class="btn ghost sm" data-cycle="prev">◀ 上个月</button><button class="btn ghost sm" data-cycle="next">下个月 ▶</button><button class="btn ghost sm" data-cycle="today">回到本月</button></div>
          <div class="card-note">点击上方月份可切换演示；完整四季循环请进入「四季循环」页。</div>`)}
        </div>
        <div class="col2">
          ${card('智慧装备 · 全系统一张网', deviceMiniHtml())}
          ${card('四季循环生产方式', `
            <div class="season-row">
              ${DB.seasons.map(x=>`<div class="season-chip ${x.key===m.season?'on':''}" style="--sc:${x.color}"><div class="sc-name">${x.key}季 ${x.name}</div><div class="sc-months">${x.months} · ${fmt(x.area)}亩</div><div class="sc-status">${x.focus}</div></div>`).join('')}
            </div>`)}
        </div>
      </div>
    </div>`;
  }
  function deviceMiniHtml(){
    const c = compute();
    return `<div class="dev-mini">
      <div class="dev-kpis"><div class="dk"><b>${fmt(c.devTotal)}</b><span>联网终端</span></div><div class="dk"><b>${c.devRate}%</b><span>在线率</span></div><div class="dk"><b>${fmt(c.kit)}</b><span>成套装备</span></div><div class="dk"><b>6 类</b><span>装备分类</span></div></div>
      <div class="dev-chips"><span>🎥 AI 识别监控 46</span><span>🏷️ 电子耳标 ${fmt(c.earTags)}</span><span>📡 GPS/北斗项圈 656</span><span>🛸 无人设备 8</span><span>🚜 农机机械 14</span><span>🏠 棚圈设施 70</span></div>
    </div>`;
  }
  function afterDashboard(){
    Charts.donut($('#chStock'), { centerValue: fmt(compute().totalAnimals), centerTitle:'存栏（头只）',
      segments: DB.species.map(x=>({ label:x.name, value:x.count, color:x.color })) });
    Charts.line($('#chTrend'), { labels:['9月','10月','11月','12月','1月','2月','3月','4月','5月','6月','7月','8月'], unit:'头',
      series:[{ name:'存栏', color:'#4f46e5', values:[866,884,902,920,938,962,986,1004,1022,1040,1052,1062] }],
      height:190, yFormat:v=>fmt(Math.round(v)) });
    bindCycleNav($('#content'));
    $('#content').querySelectorAll('.yc-cell').forEach(c=>c.addEventListener('click', ()=>{ demoMonth=+c.dataset.m; render(current); }));
  }
  function bindCycleNav(root){
    root.querySelectorAll('[data-cycle]').forEach(b=>b.addEventListener('click', ()=>{
      if (b.dataset.cycle==='prev') demoMonth = demoMonth===1?12:demoMonth-1;
      else if (b.dataset.cycle==='next') demoMonth = demoMonth===12?1:demoMonth+1;
      else demoMonth = new Date().getMonth()+1;
      render(current);
    }));
  }

  /* ================= 四季循环 ================= */
  function pageCycle() {
    const m = DB.months[demoMonth-1], se = DB.seasons.find(x=>x.key===m.season);
    return `
    <div class="page">
      ${pageHeader('四季循环生产 · 全年生产模拟', '从产犊到出栏、从打草到牧游，一个家庭牧场的完整年度循环', `
        <button class="btn solid sm" data-cycle="prev">◀ 上个月</button>
        <button class="btn solid sm" data-cycle="next">下个月 ▶</button>
        <button class="btn ghost sm" data-cycle="today">回到本月</button>`)}
      <div class="cycle-board" style="--cb:${SEASON_COLOR[m.season]}">
        <div class="cycle-meta">
          <div class="cycle-month">${demoMonth}<small>月</small></div>
          <div class="cycle-info"><div class="ci-season">${m.season}季 · ${m.name}</div>
          <div class="ci-date">${monthName(demoMonth)} · 全年进度 ${Math.round(demoMonth/12*100)}%</div>
          <div class="ci-focus">本季重点：${se.focus}</div></div>
        </div>
        <div class="cycle-tasks">
          ${m.tasks.map((t,i)=>`<div class="ct"><span>${['①','②','③'][i]||'·'}</span>${t}</div>`).join('')}
        </div>
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('年度生产轮盘 · 12 个月', `
            <div class="wheel-wrap">
              <div class="wheel" style="background:conic-gradient(${DB.months.map((mm,i)=>`${SEASON_COLOR[mm.season]} ${i*30}deg ${(i+1)*30}deg`).join(',')})">
                ${DB.months.map((mm,i)=>{
                  const ang = (i+1)/12*360 - 90;
                  const sel = i===demoMonth-1;
                  return `<div class="wheel-seg" style="--wa:${ang}deg;--wc:${SEASON_COLOR[mm.season]};${sel?'--on:1':''}" data-m="${i+1}" title="${monthName(mm.m)}：${mm.tasks[0]}">${mm.m}</div>`;
                }).join('')}
                <div class="wheel-center"><b>${demoMonth}</b><span>月</span></div>
              </div>
              <div class="wheel-legend">
                ${DB.seasons.map(x=>`<span><i style="background:${x.color}"></i>${x.key}季（${x.months}）</span>`).join('')}
              </div>
            </div>`)}
          ${card('循环生产方式 · 一个闭环', `
            <div class="flow">
              ${[
                ['🌱','天然草场','种草改良 · 以草定畜'],
                ['🐑','放牧轮牧','四季营盘 · 分区轮牧'],
                ['🌾','打草储备','夏秋打草 · 饲草入库'],
                ['🍼','繁殖饲养','产犊产犊 · 暖棚越冬'],
                ['⚖️','育肥管理','称重分群 · 智能补饲'],
                ['🍖','出栏屠宰','定点屠宰 · 检疫合格'],
                ['📦','产品加工','分割冷藏 · 品牌销售'],
                ['💰','经营反哺','收入投入草场与设备']
              ].map(([ico,tt,dd],i)=>`
                <div class="flow-node ${i===7?'loop':''}">
                  <div class="fn-ico">${ico}</div><div class="fn-name">${tt}</div><div class="fn-desc">${dd}</div>
                </div>${i<7?'<div class="flow-arrow">→</div>':''}`).join('')}
            </div>
            <div class="card-note">💡 一年四季闭环：春产犊防疫 → 夏轮牧打草 → 秋防疫出栏 → 冬补饲牧游，收入反哺草场与智慧装备，草原越养越好。</div>`)}
        </div>
        <div class="col1">
          ${card('四季营盘档案', `
            <div class="season-grid col">
              ${DB.seasons.map(x=>`
                <div class="season-card ${x.key===m.season?'on':''}" style="--sc:${x.color}">
                  <div class="sc-top"><span class="sc-emoji">${x.key==='春'?'🌱':x.key==='夏'?'🌿':x.key==='秋'?'🍂':'❄️'}</span>
                  <div><div class="sc-name">${x.key}季 · ${x.name}</div><div class="sc-months">${x.months} · ${fmt(x.area)}亩</div></div></div>
                  <div class="sc-status">${x.focus}</div>
                </div>`).join('')}
            </div>`)}
          ${card('季度工作任务计划（按月做计划）', `
            <div class="quarter-list">
              ${[1,2,3,4].map(q=>{
                const ms = DB.months.slice((q-1)*3, q*3);
                const titles = {1:'Q1 · 冬季补饲 + 产犊准备',2:'Q2 · 春季产犊 + 防疫 + 转场',3:'Q3 · 夏季轮牧 + 打草 + 牧游',4:'Q4 · 秋季出栏 + 冬储 + 验收'};
                return `<div class="quarter">
                  <div class="q-head"><b>${titles[q]}</b><span>${ms.map(m=>m.m+'月').join(' · ')}</span></div>
                  ${ms.map(m=>`<div class="q-row"><span class="q-m">${m.m}月</span><span>${m.tasks[0]}</span></div>`).join('')}
                </div>`;
              }).join('')}
            </div>`)}
          ${card('按季经营重点', `
            <div class="season-list">
              ${DB.months.map(mm=>`
                <div class="sl-row ${mm.m===demoMonth?'now':''}" style="--sl:${SEASON_COLOR[mm.season]}">
                  <span class="sl-m">${mm.m}月</span><span class="sl-t">${mm.tasks[0]}</span>
                </div>`).join('')}
            </div>`)}
          ${card('四季转场 · 走敖特尔', `
            <div class="mg-list">
              ${DB.hulunbuir.migration.map(mg=>`
                <div class="mg-item ${mg.status==='已完成'?'done':''}">
                  <div class="mg-top"><b>🐎 ${mg.season}</b>${pill(mg.status, mg.status==='已完成'?'ok':'warn')}</div>
                  <div class="mg-route">${mg.route} · ${mg.distance}</div>
                  <div class="mg-time">${mg.time} · ${mg.note}</div>
                </div>`).join('')}
            </div>
            <div class="card-note">💡 转场是游牧智慧的核心：春避返青、夏逐水草、秋储冬草、冬御风雪。</div>`)}
        </div>
      </div>
    </div>`;
  }
  function afterCycle(){
    bindCycleNav($('#content'));
    $('#content').querySelectorAll('.wheel-seg').forEach(c=>c.addEventListener('click', ()=>{ demoMonth=+c.dataset.m; render(current); }));
  }

  /* ================= 养殖管理 ================= */
  function pageLivestock() {
    const c = compute();
    return `
    <div class="page livestock-page">
      ${pageHeader('养殖管理', '西门塔尔牛分群 · 电子档案 · 繁殖动态 · 智能监测', addBtn('登记牲畜个体'))}
      <div class="kpi-grid kpi-4 livestock-kpis">
        ${statCard({icon:'🐾', label:'总存栏', value:fmt(c.totalAnimals)+' 头只', sub:'标准家畜单位 '+fmt(c.sheepUnits), color:'#0f766e', bg:'#e7f7f3'})}
        ${statCard({icon:'🏷️', label:'耳标测温', value:'200 个', sub:'全场牛只 186 头 · 200 枚含备件', color:'#0891b2', bg:'#e0f7fb'})}
        ${statCard({icon:'🍼', label:'本年度繁殖', value:'产犊 84 头', sub:'犊牛成活率 96.0%', color:'#d97706', bg:'#fff7e6'})}
        ${statCard({icon:'💉', label:'免疫率', value:'96.8%', sub:'春秋两防 · 应免尽免', color:'#2563eb', bg:'#eaf1ff'})}
      </div>

      <div class="livestock-top">
        <div class="card livestock-species-card">
          <div class="card-head split">
            <div>
              <h3>牛群结构与分类</h3>
              <p class="livestock-card-sub">西门塔尔牛 · 大牛 102 头 · 犊牛 84 头</p>
            </div>
            <div class="tabs" id="speciesTabs">
              <button class="tab active" data-key="all">全部</button>
              ${DB.species.map(x=>`<button class="tab" data-key="${x.key}">${x.emoji} ${x.name}</button>`).join('')}
            </div>
          </div>
          <div class="card-body"><div class="species-grid" id="speciesGrid"></div></div>
        </div>

        <div class="livestock-side">
          ${card('今日繁殖关注', `
            <div class="mini-alerts livestock-alerts">
              <div class="ma-item"><span>🐂</span><div><b>1 头发情预警</b><p>AN-10234 · 今日 14:00 配种</p></div></div>
              <div class="ma-item"><span>🐄</span><div><b>3 头母牛待产</b><p>犊牛舍恒温值守 · 预产期临近</p></div></div>
              <div class="ma-item"><span>🐮</span><div><b>犊牛建档 84 头</b><p>电子耳标 · 健康观察中</p></div></div>
            </div>`)}
          ${card('分群管理', tableHtml(['畜群','存栏','状态'], DB.groups.map(g=>[`<b>${g.name}</b>`, fmt(g.count)+' 头只', pill(g.status, g.status==='正常'?'ok':'warn')]), 'livestock-group-tbl'))}
        </div>
      </div>

      ${card('增重分析与出栏预测 · 三分群全自动保定称自动采集', growthHtml(), 'livestock-growth-card')}

      ${card('繁殖与产犊记录', tableHtml(
        ['日期','畜种','事项','成活率','负责人','备注'],
        DB.birthRecords.map(r=>[r.date, r.species, r.item, r.survival, r.operator, r.note]),
        'livestock-birth-tbl'
      ) + `<div class="card-actions"><button class="btn solid sm" data-modal="birth">＋ 新增繁殖记录</button></div>`, 'livestock-birth-card')}

      ${card('个体档案（可登记/删除）', tableHtml(
        ['耳标号','畜种','品种','性别','年龄','体重','健康','位置','体温','设备','操作'],
        DB.animals.map(a=>[`<code>${a.id}</code>`, a.species, a.breed, a.sex, a.age, a.weight,
          pill(a.health, a.health==='健康'?'ok':a.health==='发情预警'?'danger':'warn'),
          a.location, a.temp, `<span class="dev-on">${a.device}</span>`, delBtn('animals', a.id)]),
        'animal-archive-tbl'
      ) + `<div class="card-actions">${addBtn('登记牲畜个体')}</div>`, 'animal-archive-card')}
    </div>`;
  }
  function renderSpeciesGrid(){
    const grid = $('#speciesGrid'); if (!grid) return;
    const list = speciesKey==='all' ? DB.species : DB.species.filter(x=>x.key===speciesKey);
    grid.innerHTML = list.map(sp=>`
      <div class="species-card" style="--sp:${sp.color}">
        <div class="sp-head"><span class="sp-emoji">${sp.emoji}</span>
          <div><div class="sp-name">${sp.name}</div><div class="sp-breed">${sp.breed}</div></div>
          <div class="sp-count">${fmt(sp.count)}<small> 头/只</small></div></div>
        <div class="sp-structure">${sp.structure}</div>
        <div class="sp-meta"><span>GPS <b>${sp.gps} 套</b></span><span>均温 <b>${sp.tempAvg}</b></span></div>
        <div class="sp-chart" data-chart="${sp.key}"></div>
      </div>`).join('');
    list.forEach(sp=>{
      Charts.line(grid.querySelector(`[data-chart="${sp.key}"]`), {
        labels:['近1期','近2期','近3期','近4期','近5期','近6期','本期'],
        series:[{ name:'存栏', color:sp.color, values:sp.trend }], height:120, yFormat:v=>Math.round(v) });
    });
  }
  let speciesKey = 'all';
  function growthStats(){
    const g = DB.growth; const list = g.animals || [];
    const gains = list.map(a=>a.dailyGain);
    const avg = gains.length ? gains.reduce((x,y)=>x+y,0)/gains.length : 0;
    const best = list.reduce((m,a)=> (a.dailyGain>m.dailyGain?a:m), list[0]||{dailyGain:0});
    const accelOf = a => {
      const n = a.weights.length, mid = Math.floor(n/2);
      const t1 = a.days[mid] || 1, t2 = (a.days[n-1]-a.days[mid]) || 1;
      const g1 = (a.weights[mid]-a.weights[0])/t1;
      const g2 = (a.weights[n-1]-a.weights[mid])/t2;
      return g2-g1;
    };
    const accelAvg = list.length ? list.reduce((x,a)=>x+accelOf(a),0)/list.length : 0;
    const slow = list.filter(a=>a.stage==='育肥' && a.dailyGain<0.6);
    const forecast = (a)=>{
      const need = g.targetWeight - a.current;
      const d = a.dailyGain>0 ? Math.ceil(need/a.dailyGain) : 0;
      const dt = new Date(); dt.setDate(dt.getDate()+d);
      return { days:d, date:dt.toISOString().slice(0,10) };
    };
    return { g, list, avg, best, accelAvg, slow, accelOf, forecast };
  }
  function growthHtml(){
    const st = growthStats();
    return `
      <div class="gain-kpis">
        <div class="gk"><span>平均日增重</span><b>${st.avg.toFixed(2)} kg/天</b><i>目标 ${st.g.targetGain} kg/天</i></div>
        <div class="gk"><span>最快增重</span><b>${st.best.dailyGain} kg/天</b><i>${st.best.tag} · ${st.best.stage}</i></div>
        <div class="gk"><span>增重加速度</span><b>${st.accelAvg>=0?'+':''}${st.accelAvg.toFixed(3)} kg/天²</b><i>${st.accelAvg>=0.1?'增重持续向好':st.accelAvg>=-0.15?'增重平稳（接近出栏体重）':'增重放缓，建议调整配方'}</i></div>
        <div class="gk ${st.slow.length?'warn':''}"><span>掉膘预警</span><b>${st.slow.length} 头</b><i>${st.slow.map(a=>a.tag).join(' · ')||'无'}</i></div>
      </div>
      <div id="chGain" class="chart-box"></div>
      <div class="table-wrap growth-tbl-wrap" style="margin-top:12px">
        <table class="tbl growth-tbl">
          <thead><tr>${['耳标号','阶段','初重','当前体重','饲养天数','日增重','增重加速度','预计达标出栏','状态'].map(h=>`<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${st.list.map(a=>{
              const ac = st.accelOf(a), f = st.forecast(a);
              const good = a.dailyGain>=st.g.targetGain, warn = a.stage==='育肥' && a.dailyGain<0.6;
              return `<tr>
                <td data-label="耳标号"><code>${a.tag}</code></td><td data-label="阶段">${a.stage}</td><td data-label="初重">${a.start} kg</td>
                <td data-label="当前体重"><b>${a.current} kg</b></td><td data-label="饲养天数">${a.days[a.days.length-1]} 天</td>
                <td data-label="日增重"><b style="color:${good?'#0d9488':warn?'#ef4444':'#f0b429'}">${a.dailyGain} kg/天</b></td>
                <td data-label="增重加速度">${ac>=0?'+':''}${ac.toFixed(3)} kg/天²</td>
                <td data-label="预计达标出栏">${a.stage==='育肥'?`${f.date}（约 ${f.days} 天）`:'—'}</td>
                <td data-label="状态">${warn?pill('掉膘预警','danger'):good?pill('优秀','ok'):pill('正常','warn')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-note">⚖️ 数据来源：${st.g.weighDevice}（RS485 / Modbus RTU）自动过称采集；日增重 = 阶段增重 ÷ 天数，增重加速度 = 后半段日增重 − 前半段日增重（正值表示增重越来越快）。目标出栏体重 ${st.g.targetWeight} kg。</div>
    `;
  }
  function afterLivestock(){
    renderSpeciesGrid();
    const st = growthStats();
    const box = $('#chGain');
    if (box && st.list.length){
      const days = st.list[0].days;
      Charts.line(box, {
        labels: days.map(d=>d+'天'),
        series: st.list.map((a,i)=>({
          name: a.tag,
          color: ['#0d9488','#06b6d4','#0891b2','#f0b429','#ef4444'][i%5],
          values: a.weights
        })),
        height: 190,
        yFormat: v=>Math.round(v)+'kg',
        unit: 'kg'
      });
    }
    $('#speciesTabs').addEventListener('click', e=>{
      const b = e.target.closest('.tab'); if (!b) return;
      speciesKey = b.dataset.key;
      document.querySelectorAll('#speciesTabs .tab').forEach(x=>x.classList.toggle('active', x===b));
      renderSpeciesGrid();
    });
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="登记牲畜个体"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('登记牲畜个体', [
        {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
        {name:'breed', label:'品种', type:'text', value:'西门塔尔牛'},
        {name:'sex', label:'性别', type:'select', options:['母','公'].map(v=>({v}))},
        {name:'age', label:'年龄', type:'text', placeholder:'例：2岁'},
        {name:'weight', label:'体重', type:'text', placeholder:'例：56kg'},
        {name:'health', label:'健康状况', type:'select', options:['健康','发情预警','待产','待驱虫','观察'].map(v=>({v}))},
        {name:'location', label:'所在位置', type:'text', placeholder:'例：冬营盘·东区'},
        {name:'temp', label:'体温', type:'text', placeholder:'例：38.6℃'},
        {name:'device', label:'监测设备', type:'select', options:['GPS · 在线','耳标 · 在线','GPS · 离线'].map(v=>({v}))},
        {name:'note', label:'备注', type:'textarea'}
      ], v=>{
        v.id = 'AN-' + uid('AN').slice(-6);
        addRecord('animals', v);
        toast(`已登记 ${v.species} ${v.id}`);
        render(current);
      });
    }));
    const birthBtn = $('#content').querySelector('[data-modal="birth"]');
    if (birthBtn) birthBtn.addEventListener('click', ()=>{
      openModal('新增繁殖记录', [
        {name:'date', label:'日期', type:'date', required:true},
        {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
        {name:'item', label:'事项', type:'text', placeholder:'例：产犊 100 只', required:true},
        {name:'survival', label:'成活率', type:'text', placeholder:'例：97.6%'},
        {name:'operator', label:'负责人', type:'text'},
        {name:'note', label:'备注', type:'textarea'}
      ], v=>{ addRecord('birthRecords', v); toast('繁殖记录已保存'); render(current); });
    });
  }

  /* ================= 草场分类 ================= */
  function pageGrassland() {
    const g = DB.grassland, gt = DB.grasslandTypes;
    return `
    <div class="page">
      ${pageHeader('草场分类 · 生态类型台账', '草甸草原 / 典型草原 / 低湿地 / 改良区 / 沙化治理 · 以类定用、以草定畜', addBtn('新增地块', 'grassland.pastures'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🌾', label:'草场总面积', value:fmt(g.total)+' 亩', sub:'放牧 '+fmt(g.grazing)+' · 打草 '+fmt(g.hay), color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🏡', label:'自家草场', value:fmt(DB.meta.areaSelf)+' 亩', sub:'自有天然散养草场 · 确权经营', color:'#0d9488', bg:'#ccfbf1'})}
        ${statCard({icon:'📄', label:'租赁草场', value:fmt(DB.meta.areaRented)+' 亩', sub:'纳入四季轮牧 · 租赁经营', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'⚖️', label:'载畜量使用率', value:g.balance.rate+'%', sub:'标准家畜单位 '+fmt(g.balance.actual)+' / '+fmt(g.balance.capacity), color:'#b3541e', bg:'#fbeee6'})}
      </div>
      ${card('生态类型分类', `
        <div class="gt-grid">
          ${gt.map(x=>`
            <div class="gt-card" style="--gc:${x.color}">
              <div class="gt-ico">${x.icon}</div>
              <div class="gt-name">${x.name}</div>
              <div class="gt-area">${fmt(x.area)} 亩 · ${x.use}</div>
              <div class="gt-species">主要植物：${x.species}</div>
              <div class="gt-note">${x.note}</div>
            </div>`).join('')}
        </div>`)}
      <div class="grid-3">
        <div class="col2">
          ${card('地块台账（可新增/编辑/删除）', tableHtml(['地块','生态类型','利用方式','面积','载畜(标准家畜单位)','草高','状态','操作'],
            g.pastures.map(p=>[
              `<b>${p.name}</b>`,
              `<span class="gt-tag" style="--gc:${(gt.find(t=>t.name.startsWith(p.type)||t.name.includes(p.type))||{}).color||'#8a9a5b'}">${p.type}</span>`,
              pill(p.usage, p.usage==='打草场'?'info':'ok'),
              fmt(p.area)+' 亩', p.su?fmt(p.su):'—', p.height,
              pill(p.status, p.status.includes('放牧')||p.status.includes('打草')?'ok':p.status.includes('休')||p.status.includes('禁')?'warn':'muted'),
              editBtn('grassland.pastures', p.id) + delBtn('grassland.pastures', p.id)
            ])))}
        </div>
        <div class="col1">
          ${card('草畜平衡', `<div id="chGB" class="chart-box center"></div>`)}
          ${card('植被指数 NDVI（遥感监测）', `<div id="chNdvi" class="chart-box"></div>`)}
          ${card('草场管理待办', taskHtml(DB.grassland.tasks.map((t,i)=>({icon:'📋', text:t, time:'', level:'低'}))))}
        </div>
      </div>
    </div>`;
  }
  const pastureFields = [
    {name:'name', label:'地块名称', type:'text', required:true},
    {name:'type', label:'生态类型', type:'select', options:['草甸草原','典型草原','低湿地','退牧还草区','沙化治理区'].map(v=>({v}))},
    {name:'usage', label:'利用方式', type:'select', options:[{v:'放牧场'},{v:'打草场'},{v:'休牧区'},{v:'禁牧区'}]},
    {name:'area', label:'面积（亩）', type:'number'},
    {name:'su', label:'载畜量（标准家畜单位）', type:'number'},
    {name:'height', label:'牧草高度', type:'text', placeholder:'例：28cm'},
    {name:'status', label:'状态', type:'text', placeholder:'例：轮牧中'},
    {name:'util', label:'利用率 %', type:'number'}
  ];
  function afterGrassland(){
    Charts.gauge($('#chGB'), { value: DB.grassland.balance.rate, label:'载畜量使用率', sub:'安全线 90%', color:'#4f46e5' });
    Charts.line($('#chNdvi'), { labels:['3月','4月','5月','6月','7月','8月','本周'],
      series:[{ name:'NDVI', color:'#4f46e5', values:DB.grassland.ndvi.trend }],
      height:200, yFormat:v=>v.toFixed(2) });
    bindDel($('#content'));
    bindEdit($('#content'), { 'grassland.pastures': { title:'编辑地块', fields: pastureFields } });
    $('#content').querySelectorAll('[data-add="grassland.pastures"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增地块', pastureFields, v=>{ addRecord('grassland.pastures', {...v, area:+v.area||0, su:+v.su||0, util:+v.util||0}); toast('地块已新增'); render(current); });
    }));
  }

  /* ================= 饲草管理 ================= */
  function pageForage() {
    const inv = DB.forageInventory, rec = DB.forageRecords;
    return `
    <div class="page">
      ${pageHeader('饲草管理', '打草入库 · 青贮制作 · 冬春补饲 · 以草定畜', addBtn('饲草出入库'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🌾', label:'打草场', value:fmt(DB.meta.hayArea)+' 亩', sub:'年产干草约 980 吨', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'🧊', label:'饲草储备', value:compute().foragePct+'%', sub:'总库存 / 总目标', color:'#64748b', bg:'#f1f5f9'})}
        ${statCard({icon:'📦', label:'库存品类', value:inv.length+' 类', sub:'干草 · 青贮 · 精料 · 舔砖', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'❄️', label:'冬季补饲', value:'已启动', sub:'12月-3月 · 每日定时投喂', color:'#0ea5e9', bg:'#e0f2fe'})}
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('饲草库存台账', tableHtml(['品类','目标','当前库存','缺口/余量','状态','备注'],
            inv.map(x=>{
              const gap = +(x.target-x.stock).toFixed(1); const pct = Math.round(x.stock/x.target*100);
              return [`<b>${x.name}</b>`, x.target+' '+x.unit, `<b>${x.stock}</b> ${x.unit}`,
                (gap>0?gap+' 待补':'余 '+Math.abs(gap)), pill(pct>=80?'充足':pct>=60?'正常':'偏少', pct>=80?'ok':pct>=60?'warn':'danger'), x.note];
            })))}
          ${card('出入库记录（可新增/删除）', tableHtml(['日期','类型','品项','数量','负责人','备注','操作'],
            rec.map(r=>[r.date, pill(r.type, r.type==='打草入库'||r.type==='青贮制作'?'ok':'warn'), r.item, r.qty+' '+r.unit, r.operator, r.note, delBtn('forageRecords', r.id)])))}
          <div style="margin-top:12px">${addBtn('饲草出入库')}</div>
        </div>
        <div class="col1">
          ${card('冬季饲草储备结构', `
            <div class="hbar-stack">
              ${inv.map(x=>`<div class="hbar"><div class="hbar-head"><span>${x.name}</span><b>${x.stock}/${x.target} ${x.unit}</b></div>
                <div class="hbar-track"><div class="hbar-fill" style="width:${Math.round(x.stock/x.target*100)}%;background:${x.stock/x.target>=0.8?'#f59e0b':x.stock/x.target>=0.6?'#8a9a5b':'#d9534f'}"></div></div></div>`).join('')}
            </div>
            <div class="card-note">❄️ 寒冷地区标准：冬储饲草须覆盖至 3 月底。当前干草可支撑至 2 月底，3 月缺口 80 吨，建议 9 月打草季补足。</div>`)}
          ${card('年度饲草生产计划', `
            <div class="task-list">
              <div class="task-item"><span class="task-ico">🌱</span><div class="task-main"><div class="task-txt"><b>5 月</b> 春播补播 · 退化草场改良 200 亩</div></div></div>
              <div class="task-item"><span class="task-ico">🌿</span><div class="task-main"><div class="task-txt"><b>7-8 月</b> 打草场两茬刈割 · 留茬 ≥6cm</div></div></div>
              <div class="task-item"><span class="task-ico">🌽</span><div class="task-main"><div class="task-txt"><b>8-9 月</b> 青贮制作 240 吨 · 精料采购 80 吨</div></div></div>
              <div class="task-item"><span class="task-ico">🧊</span><div class="task-main"><div class="task-txt"><b>11-3 月</b> 冬春补饲 · 每周盘点库存</div></div></div>
            </div>`)}
        </div>
      </div>
    </div>`;
  }
  function afterForage(){
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="饲草出入库"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('饲草出入库登记', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16', required:true},
        {name:'type', label:'类型', type:'select', options:[{v:'打草入库'},{v:'青贮制作'},{v:'领用'},{v:'采购入库'}]},
        {name:'item', label:'品项', type:'select', options: DB.forageInventory.map(x=>({v:x.name}))},
        {name:'qty', label:'数量', type:'number', placeholder:'吨', required:true},
        {name:'operator', label:'负责人', type:'text'},
        {name:'note', label:'备注', type:'textarea'}
      ], v=>{
        if (!v.qty) { toast('请填写数量','warn'); return false; }
        const inv = DB.forageInventory.find(x=>x.name===v.item);
        if (inv) { const q = +v.qty; if (v.type==='领用') inv.stock = Math.max(0, +(inv.stock-q).toFixed(1)); else inv.stock = +(inv.stock+q).toFixed(1); saveDB(); }
        addRecord('forageRecords', {...v, qty:+v.qty});
        toast('出入库已登记并同步库存'); render(current);
      });
    }));
  }

  /* ================= 屠宰加工 ================= */
  function pageSlaughter() {
    const sl = DB.slaughterRecords, sp = DB.slaughterPlans;
    return `
    <div class="page">
      ${pageHeader('屠宰加工', '定点屠宰 · 检疫合格 · 冷链分割 · 产品联动', addBtn('登记屠宰记录'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🍖', label:'已屠宰（本季）', value:sl.reduce((a,r)=>a+r.head,0)+' 头只', sub:'西门塔尔牛定点屠宰', color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'✅', label:'检疫合格率', value:'100%', sub:'旗动物检疫所出证', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'❄️', label:'冷库容量', value:'40 吨', sub:'-18℃ 冻库 · 0-4℃ 排酸间', color:'#64748b', bg:'#f1f5f9'})}
        ${statCard({icon:'📋', label:'出栏计划', value:sp.reduce((a,x)=>a+x.head,0)+' 头只', sub:'秋冬季（10-12月）', color:'#f59e0b', bg:'#fef3c7'})}
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('屠宰记录（可新增/删除）', tableHtml(['日期','畜种','头数','出肉量','检疫机构','状态','备注','操作'],
            sl.map(r=>[r.date, r.species, r.head+' 头只', r.weight, r.inspector, pill(r.status, r.status==='检疫合格'?'ok':'warn'), r.note, delBtn('slaughterRecords', r.id)])))}
          <div style="margin-top:12px">${addBtn('登记屠宰记录')}</div>
        </div>
        <div class="col1">
          ${card('秋冬季出栏计划', tableHtml(['畜种','计划出栏','说明'], sp.map(x=>[`<b>${x.species}</b>`, x.head+' 头只', x.note])))}
          ${card('屠宰流程规范', `
            <div class="flow-vert">
              <div class="fv"><b>1</b><span>出栏前 14 天停用药物</span></div>
              <div class="fv"><b>2</b><span>产地检疫 → 开具检疫合格证明</span></div>
              <div class="fv"><b>3</b><span>定点屠宰 · 同步检疫（驻场官方兽医）</span></div>
              <div class="fv"><b>4</b><span>排酸 24h → 分割 → -18℃ 冷冻</span></div>
              <div class="fv"><b>5</b><span>产品赋码溯源 → 入库销售</span></div>
            </div>
            <div class="card-note">💡 每笔屠宰记录保存后，系统将同步生成对应产品入库记录，实现屠宰→产品全链联动。</div>`)}
        </div>
      </div>
    </div>`;
  }
  function afterSlaughter(){
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="登记屠宰记录"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('登记屠宰记录', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16', required:true},
        {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
        {name:'head', label:'头数', type:'number', required:true},
        {name:'weight', label:'出肉量', type:'text', placeholder:'例：1.2吨'},
        {name:'inspector', label:'检疫机构', type:'text', value:'旗动物检疫所'},
        {name:'status', label:'状态', type:'select', options:[{v:'检疫合格'},{v:'检疫中'}]},
        {name:'note', label:'备注', type:'textarea'}
      ], v=>{
        if (!v.head) { toast('请填写头数','warn'); return false; }
        addRecord('slaughterRecords', {...v, head:+v.head});
        addRecord('productRecords', { date:v.date, type:'入库', product:'冷鲜'+v.species+'肉',
          qty:v.weight, unit:'吨', amount:'—', customer:'屠宰分割（'+v.head+' 头只）' });
        toast('屠宰记录已保存，产品已联动入库'); render(current);
      });
    }));
  }

  /* ================= 防疫管理 ================= */
  function pageVaccine() {
    const vr = DB.vaccineRecords, ds = DB.disinfect, done = vr.filter(r=>r.status==='完成').length;
    return `
    <div class="page">
      ${pageHeader('防疫管理', '春秋两防 · 应免尽免 · 消毒灭源 · 检疫出证', addBtn('登记防疫记录'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'💉', label:'免疫程序', value:DB.vaccinePlans.length+' 项', sub:'口蹄疫 · 小反刍 · 炭疽等', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'✅', label:'已完成记录', value:done+' 项', sub:'共 '+vr.length+' 条防疫台账', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🧴', label:'消毒作业', value:ds.length+' 次', sub:'圈舍 · 暖棚 · 屠宰车间', color:'#475569', bg:'#f1f5f9'})}
        ${statCard({icon:'🛡️', label:'免疫率', value:'96.8%', sub:'剩余幼畜按程序补免', color:'#b3541e', bg:'#fbeee6'})}
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('免疫程序（年度）', tableHtml(['程序','疫苗','畜种','要求'],
            DB.vaccinePlans.map(x=>[`<b>${x.season}</b>`, x.vaccine, x.species, pill(x.rate,'info')])))}
          ${card('防疫记录台账（可新增/删除）', tableHtml(['日期','畜种','群体','疫苗','剂量','操作人','状态','操作'],
            vr.map(r=>[r.date, r.species, r.group, r.vaccine, r.dose, r.operator, pill(r.status,'ok'), delBtn('vaccineRecords', r.id)])))}
          <div style="margin-top:12px">${addBtn('登记防疫记录')}</div>
        </div>
        <div class="col1">
          ${card('消毒记录', tableHtml(['日期','对象','消毒药','操作人'], ds.map(r=>[r.date, r.item, r.drug, r.operator])))}
          ${card('疫病防控要点（寒冷地区）', `
            <div class="cold-list">
              <div class="cold-item">❄️ 冬春保温防寒 · 暖棚恒温 24℃，减少应激</div>
              <div class="cold-item">🧴 每周圈舍消毒 1 次 · 产犊前后重点消毒</div>
              <div class="cold-item">🩺 新调入牲畜隔离观察 21 天</div>
              <div class="cold-item">🗑️ 病死畜无害化处理 · 台账可追溯</div>
              <div class="cold-item">📡 体温耳标异常自动预警 · 远程诊断</div>
            </div>`)}
        </div>
      </div>
      ${card('兽药使用与休药期（食品安全红线）', tableHtml(['日期','畜种','群体','药品','休药期(天)','兽医','备注','操作'],
        DB.medicines.map(md=>[md.date, md.species, md.group, `<b>${md.drug}</b>`, pill(md.withdrawal+' 天','danger'), md.operator, md.note, delBtn('medicines', md.id)])))}
      <div style="margin-top:12px"><button class="btn solid sm" data-modal="med">＋ 登记用药</button></div>
      <div class="card-note">⚠️ 休药期是出栏安全的底线：出栏前必须停药（伊维菌素 21 天、土霉素 28 天…），违禁药一律不用；用药记录与检疫出证联动，政府可查。</div>
    </div>`;
  }
  function afterVaccine(){
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="登记防疫记录"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('登记防疫记录', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16', required:true},
        {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
        {name:'group', label:'群体', type:'text', placeholder:'例：全群 / 犊牛'},
        {name:'vaccine', label:'疫苗/项目', type:'select', options:['口蹄疫 O 型','口蹄疫 A 型','炭疽','布病监测','犊牛腹泻疫苗','出栏前检疫'].map(v=>({v}))},
        {name:'dose', label:'剂量', type:'text', placeholder:'例：1,200 头份'},
        {name:'operator', label:'操作人', type:'text'},
        {name:'status', label:'状态', type:'select', options:[{v:'完成'},{v:'计划中'}]}
      ], v=>{ addRecord('vaccineRecords', v); toast('防疫记录已保存'); render(current); });
    }));
    const medBtn = $('#content').querySelector('[data-modal="med"]');
    if (medBtn) medBtn.addEventListener('click', ()=>{
      openModal('登记用药（含休药期）', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16'},
        {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
        {name:'group', label:'群体', type:'text', placeholder:'例：育肥牛 60 头'},
        {name:'drug', label:'药品', type:'text', required:true, placeholder:'例：伊维菌素（驱虫）'},
        {name:'withdrawal', label:'休药期（天）', type:'number', placeholder:'例：21'},
        {name:'operator', label:'兽医', type:'text'},
        {name:'note', label:'备注', type:'text'}
      ], v=>{
        if (!v.drug) { toast('请填写药品','warn'); return false; }
        addRecord('medicines', {...v, withdrawal:+v.withdrawal||0});
        toast('用药已登记，休药期已计入'); render(current);
      });
    });
    bindDel($('#content'));
  }

  /* ================= 装备图标库（每个设备名旁显示对应小图标） ================= */
  const DEV_ICONS = {
    cam: `<svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="11" height="7" rx="2"/><path d="M13.5 9.2 20 6.5v8.5l-6.5-2.7"/><path d="M8 13.5v2.2a2 2 0 0 0 2 2h1.2"/><circle cx="6.5" cy="10" r="1.2"/></svg>`,
    tag: `<svg viewBox="0 0 24 24"><path d="M3.5 12 12 3.5h6a2.5 2.5 0 0 1 2.5 2.5v6L12 20.5z"/><circle cx="16" cy="8" r="1.7"/><path d="M3.5 12 8 16.5"/></svg>`,
    collar: `<svg viewBox="0 0 24 24"><path d="M5 7a8 8 0 0 0 14 0"/><path d="M5 7v3.2M19 7v3.2"/><rect x="9.6" y="15" width="4.8" height="4" rx="1.2"/><path d="M12 14v1"/><path d="M10.4 17h3.2"/></svg>`,
    mixer: `<svg viewBox="0 0 24 24"><path d="M2.5 15.5h11v3.5h-11z"/><circle cx="5" cy="20.5" r="1.8"/><circle cx="11" cy="20.5" r="1.8"/><path d="M13.5 17.2h5"/><path d="M6 12.5c0-3 2-5.5 5-5.5s5 2.5 5 5.5"/><path d="M11 7V4.5"/><path d="M4 12.5h14"/></svg>`,
    scale: `<svg viewBox="0 0 24 24"><path d="M3.5 20.5h17"/><path d="M6 20.5V9h12v11.5"/><path d="M8.5 9V5h7v4"/><path d="M10 13h4"/><circle cx="12" cy="17" r="1.4"/></svg>`,
    spreader: `<svg viewBox="0 0 24 24"><path d="M2.5 14.5h10v4h-10z"/><circle cx="5" cy="20.5" r="1.7"/><circle cx="11" cy="20.5" r="1.7"/><path d="M13 16.5h6"/><path d="M15.5 8v4M18.5 9.5v2.5M21 8.5v3.5"/></svg>`,
    crusher: `<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="11" height="12" rx="2"/><path d="M13.5 10h3.5a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 17 15h-3.5"/><path d="M6 10l4 4M10 10l-4 4"/></svg>`,
    drone: `<svg viewBox="0 0 24 24"><rect x="9.2" y="9.8" width="5.6" height="4.4" rx="1.2"/><path d="M9.2 11H5.6M14.8 13h3.6"/><circle cx="4" cy="10" r="2.2"/><circle cx="20" cy="14" r="2.2"/><circle cx="20" cy="10" r="2.2"/><path d="M6 10h12M6 10l12 4"/></svg>`,
    tractor: `<svg viewBox="0 0 24 24"><circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="18.5" r="2"/><path d="M3.5 14.5V9.5h6l2 5"/><path d="M10 9.5V6h4v3.5"/><path d="M14 15h5.5"/><path d="M4.5 7.5h4"/></svg>`,
    mower: `<svg viewBox="0 0 24 24"><circle cx="6" cy="18.5" r="2.4"/><circle cx="15" cy="18.5" r="2.4"/><path d="M8.4 17h4.2"/><path d="M3.5 12.5h14"/><path d="M17.5 12.5l3 2.4"/><path d="M3.5 12.5 2.6 9.4h6.4"/></svg>`,
    gate: `<svg viewBox="0 0 24 24"><path d="M3.5 20.5V6.5M20.5 20.5V6.5"/><path d="M3.5 10h17M3.5 14.5h17"/><path d="M9 10v10.5M15 10v10.5"/><path d="M12 6.5V3"/></svg>`,
    thermo: `<svg viewBox="0 0 24 24"><path d="M12 3.5a2 2 0 0 1 2 2v9a4 4 0 1 1-4 0v-9a2 2 0 0 1 2-2z"/><path d="M12 9v7"/><path d="M4.5 7.5h3M4.5 11h2.5M4.5 14.5h3"/></svg>`,
    dog: `<svg viewBox="0 0 24 24"><rect x="6.5" y="9" width="10" height="6" rx="2"/><path d="M16.5 9.5h3.5v5h-3.5"/><circle cx="18.6" cy="11.4" r="1"/><path d="M9 15v3l-1.6 2.4M12 15v3l1.6 2.4M15 15v3l-1.6 2.4"/><path d="M8 9V6.6"/><circle cx="8" cy="5.6" r="1.1"/></svg>`,
    gateway: `<svg viewBox="0 0 24 24"><path d="M9 20.5h6v-3H9z"/><path d="M12 17.5V9.5"/><path d="M7.5 10a6.5 6.5 0 0 1 9 0"/><path d="M4.6 7a10.5 10.5 0 0 1 14.8 0"/></svg>`
  };
  function devIconKey(name){
    const n = String(name||'');
    if (/耳标/.test(n)) return 'tag';
    if (/项圈/.test(n)) return 'collar';
    if (/TMR|拌料/.test(n)) return 'mixer';
    if (/保定称|称重/.test(n)) return 'scale';
    if (/撒料/.test(n)) return 'spreader';
    if (/粉碎/.test(n)) return 'crusher';
    if (/机器狗|巡检机器人/.test(n)) return 'dog';
    if (/无人机/.test(n)) return 'drone';
    if (/拖拉机/.test(n)) return 'tractor';
    if (/打草|割草/.test(n)) return 'mower';
    if (/门/.test(n)) return 'gate';
    if (/温控|舍/.test(n)) return 'thermo';
    if (/网关|基站/.test(n)) return 'gateway';
    if (/监控|摄像/.test(n)) return 'cam';
    return 'cam';
  }
  function devIcon(name, state='在线'){
    const online = String(state).includes('在线');
    return `<span class="dev-ico ${online?'is-online':'is-offline'}">${DEV_ICONS[devIconKey(name)] || DEV_ICONS.cam}</span>`;
  }
  function devShortName(name){
    const n = String(name||'');
    if (/视频监控/.test(n)) return '视频监控';
    if (/耳标/.test(n)) return '耳标测温';
    if (/定位项圈/.test(n)) return '北斗项圈';
    if (/机器狗/.test(n)) return '巡检机器狗';
    if (/保定称/.test(n)) return '保定称重';
    if (/TMR/.test(n)) return 'TMR 拌料机';
    if (/撒料/.test(n)) return '撒料机';
    if (/粉碎/.test(n)) return '饲料粉碎机';
    if (/农机/.test(n)) return '智能农机';
    return n.replace(/（[^）]*）/g,'').slice(0,8);
  }

  /* ================= 农机写实插画（智能农机管理卡片用） ================= */
  const MACHINE_ART = {
    scale: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></linearGradient></defs>
      <ellipse cx="36" cy="45" rx="29" ry="3" fill="rgba(0,0,0,.16)"/>
      <path d="M12 12 l5 -5 h38 l5 5" fill="#cbd5e1" stroke="#475569" stroke-width="1.1"/>
      <rect x="10" y="12" width="52" height="24" rx="3" fill="url(#sc1)" stroke="#475569" stroke-width="1.2"/>
      <path d="M14 22 h44" stroke="#64748b" stroke-width="1" opacity=".7"/>
      <path d="M24 32 q2 -11 12 -11 q10 0 12 11 z" fill="#78716c"/>
      <path d="M27 23 l-4 -6 M45 23 l4 -6" stroke="#57534e" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="31" cy="26" r="1.3" fill="#1f2937"/><circle cx="41" cy="26" r="1.3" fill="#1f2937"/>
      <rect x="20" y="34" width="32" height="4" rx="1.6" fill="#f59e0b" stroke="#b45309" stroke-width=".8"/>
      <rect x="52" y="6" width="14" height="10" rx="1.6" fill="#0f172a"/>
      <rect x="54" y="9" width="10" height="2" fill="#5eead4"/><rect x="54" y="12" width="6" height="2" fill="#5eead4"/>
      <path d="M14 36 v7 M58 36 v7" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`,
    mixer: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mx1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5eaf1"/><stop offset="1" stop-color="#8fa0b6"/></linearGradient>
      <linearGradient id="mx2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs>
      <ellipse cx="36" cy="45" rx="30" ry="3" fill="rgba(0,0,0,.16)"/>
      <path d="M19 13 h32 l-3 21 h-26 z" fill="url(#mx1)" stroke="#475569" stroke-width="1.2"/>
      <path d="M19 13 q16 -6 32 0" fill="#cbd5e1" stroke="#475569" stroke-width="1.1"/>
      <path d="M24 19 q11 4 22 0 M24 25 q11 4 22 0" stroke="#64748b" stroke-width="1.5" fill="none"/>
      <path d="M51 21 l9 3 -2 5 -9 -3z" fill="url(#mx2)" stroke="#92400e" stroke-width=".9"/>
      <path d="M8 30 l11 -4" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="24" cy="39" r="6" fill="#334155"/><circle cx="24" cy="39" r="2.4" fill="#cbd5e1"/>
      <circle cx="46" cy="39" r="6" fill="#334155"/><circle cx="46" cy="39" r="2.4" fill="#cbd5e1"/>
    </svg>`,
    crusher: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cr1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></linearGradient></defs>
      <ellipse cx="36" cy="45" rx="28" ry="3" fill="rgba(0,0,0,.16)"/>
      <path d="M14 19 l8 -9 h14 l8 9z" fill="#cbd5e1" stroke="#475569" stroke-width="1.1"/>
      <rect x="13" y="19" width="30" height="17" rx="3" fill="url(#cr1)" stroke="#475569" stroke-width="1.2"/>
      <path d="M19 25 l8 6 M27 25 l-8 6" stroke="#475569" stroke-width="1.5"/>
      <circle cx="52" cy="27" r="7.5" fill="#475569"/><circle cx="52" cy="27" r="3" fill="#cbd5e1"/>
      <path d="M44.5 27 h-1.5 M44 32 l-8 6" stroke="#64748b" stroke-width="1.6"/>
      <path d="M36 38 l10 5" stroke="#64748b" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="52" cy="43" rx="9" ry="3" fill="#a16207" opacity=".85"/>
      <circle cx="20" cy="40" r="5" fill="#334155"/><circle cx="20" cy="40" r="2" fill="#cbd5e1"/>
      <circle cx="36" cy="40" r="5" fill="#334155"/><circle cx="36" cy="40" r="2" fill="#cbd5e1"/>
    </svg>`,
    drone: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="44" rx="26" ry="2.6" fill="rgba(0,0,0,.16)"/>
      <path d="M18 15 L34 27 M54 15 L38 27 M18 39 L34 27 M54 39 L38 27" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="18" cy="15" rx="9" ry="2.8" fill="#94a3b8" opacity=".9"/>
      <ellipse cx="54" cy="15" rx="9" ry="2.8" fill="#94a3b8" opacity=".9"/>
      <ellipse cx="18" cy="39" rx="9" ry="2.8" fill="#94a3b8" opacity=".9"/>
      <ellipse cx="54" cy="39" rx="9" ry="2.8" fill="#94a3b8" opacity=".9"/>
      <circle cx="18" cy="15" r="2.2" fill="#334155"/><circle cx="54" cy="15" r="2.2" fill="#334155"/>
      <circle cx="18" cy="39" r="2.2" fill="#334155"/><circle cx="54" cy="39" r="2.2" fill="#334155"/>
      <rect x="28" y="21" width="16" height="12" rx="4" fill="#334155" stroke="#1e293b" stroke-width="1"/>
      <path d="M31 21 v-3 h10 v3" fill="#475569"/>
      <circle cx="36" cy="30" r="3.2" fill="#0ea5e9" stroke="#0f172a" stroke-width=".8"/>
      <path d="M31 33 v5 M41 33 v5 M29 38 h4 M39 38 h4" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
    tractor: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="tr1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b429"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs>
      <ellipse cx="36" cy="45" rx="30" ry="3" fill="rgba(0,0,0,.16)"/>
      <circle cx="49" cy="34" r="10" fill="#1f2937"/><circle cx="49" cy="34" r="4.2" fill="#cbd5e1"/><circle cx="49" cy="34" r="1.6" fill="#64748b"/>
      <circle cx="19" cy="38" r="6.6" fill="#1f2937"/><circle cx="19" cy="38" r="2.6" fill="#cbd5e1"/>
      <path d="M17 31 h13 l4 -11 h11 l4 11 h6 v7 h-38z" fill="url(#tr1)" stroke="#92400e" stroke-width="1.1"/>
      <rect x="33" y="12" width="14" height="12" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
      <rect x="35" y="14" width="10" height="6" rx="1" fill="#bfdbfe" opacity=".95"/>
      <rect x="29" y="5" width="2.6" height="9" rx="1.2" fill="#64748b"/>
      <circle cx="43" cy="7" r="2.4" fill="#0ea5e9"/><path d="M43 9.4 v2.6" stroke="#475569" stroke-width="1.3"/>
      <path d="M12 34 h5" stroke="#475569" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`,
    mower: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mw1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></linearGradient></defs>
      <ellipse cx="36" cy="45" rx="31" ry="3" fill="rgba(0,0,0,.16)"/>
      <circle cx="17" cy="33" r="8" fill="#1f2937"/><circle cx="17" cy="33" r="3" fill="#cbd5e1"/>
      <circle cx="40" cy="35" r="9" fill="#1f2937"/><circle cx="40" cy="35" r="3.4" fill="#cbd5e1"/>
      <path d="M11 28 h12 l3 -9 h10 l3 9 h9 v7 h-37z" fill="url(#mw1)" stroke="#475569" stroke-width="1.1"/>
      <rect x="28" y="11" width="13" height="10" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
      <rect x="30" y="13" width="9" height="5" rx="1" fill="#bfdbfe" opacity=".9"/>
      <rect x="50" y="28" width="20" height="5" rx="2" fill="#f59e0b" stroke="#b45309" stroke-width=".9"/>
      <circle cx="54" cy="33" r="2.4" fill="#64748b"/><circle cx="60" cy="33" r="2.4" fill="#64748b"/><circle cx="66" cy="33" r="2.4" fill="#64748b"/>
      <path d="M50 42 q7 -4 13 0 q6 -4 12 0" stroke="#16a34a" stroke-width="1.7" fill="none"/>
    </svg>`,
    gate: `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="45" rx="30" ry="3" fill="rgba(0,0,0,.16)"/>
      <rect x="7" y="13" width="5" height="28" rx="1.6" fill="#64748b"/>
      <rect x="60" y="13" width="5" height="28" rx="1.6" fill="#64748b"/>
      <rect x="12" y="17" width="48" height="23" rx="2" fill="none" stroke="#475569" stroke-width="2"/>
      <path d="M12 25 h48 M12 32 h48 M23 17 v23 M35 17 v23 M47 17 v23" stroke="#64748b" stroke-width="1.4"/>
      <rect x="24" y="6" width="22" height="8" rx="1.6" fill="#1e3a8a" stroke="#0f172a" stroke-width=".9"/>
      <path d="M31.5 6 v8 M39 6 v8 M24 10 h22" stroke="#60a5fa" stroke-width=".8"/>
      <rect x="50" y="30" width="9" height="8" rx="1.6" fill="#f0b429" stroke="#92400e" stroke-width=".8"/>
      <path d="M63 21 q4 5 0 10 M67 18 q6 8 0 16" stroke="#0ea5e9" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>`
  };
  MACHINE_ART.dog = `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="36" cy="45" rx="24" ry="2.8" fill="rgba(0,0,0,.16)"/>
      <path d="M22 21h26a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4z" fill="#334155" stroke="#1e293b" stroke-width="1"/>
      <path d="M22 25h26M22 31h26" stroke="#475569" stroke-width="1" opacity=".7"/>
      <path d="M50 20h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-9z" fill="#475569" stroke="#1e293b" stroke-width="1"/>
      <circle cx="57.5" cy="23.5" r="2.2" fill="#0ea5e9"/>
      <rect x="54" y="27" width="7" height="2.4" rx="1.2" fill="#5eead4"/>
      <path d="M26 36v7l-4 2.6M33 36v7l4 2.6M45 36v7l-4 2.6M52 36v7l4 2.6" stroke="#334155" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M24 21v-5" stroke="#64748b" stroke-width="1.6" stroke-linecap="round"/><circle cx="24" cy="14.5" r="2.2" fill="#f0b429"/>
      <path d="M63 17q4.5 7 0 14" stroke="#0ea5e9" stroke-width="1.4" fill="none" opacity=".85"/>
      <path d="M66.5 14q6.5 10 0 20" stroke="#0ea5e9" stroke-width="1.2" fill="none" opacity=".5"/>
    </svg>`;
  MACHINE_ART.tag = `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="tag3d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset=".5" stop-color="#f0b429"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs>
    <ellipse cx="36" cy="44" rx="23" ry="3" fill="rgba(0,0,0,.18)"/>
    <path d="M18 15h29l10 9-10 9H18a6 6 0 0 1-6-6v-6a6 6 0 0 1 6-6z" fill="url(#tag3d)" stroke="#78350f" stroke-width="1.2"/>
    <circle cx="49" cy="24" r="4.8" fill="#1e293b" stroke="#fef3c7" stroke-width="1"/>
    <rect x="19" y="21" width="20" height="6" rx="2" fill="#fff7ed" opacity=".9"/>
    <path d="M22 23h12M22 26h8" stroke="#64748b" stroke-width=".8"/>
    <path d="M58 18q5 6 0 12" stroke="#5eead4" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  MACHINE_ART.collar = `<svg viewBox="0 0 72 48" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="col3d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0ea5e9"/><stop offset=".55" stop-color="#0f766e"/><stop offset="1" stop-color="#134e4a"/></linearGradient></defs>
    <ellipse cx="36" cy="44" rx="25" ry="3" fill="rgba(0,0,0,.18)"/>
    <path d="M15 16q21-13 42 0l-5 9q-16-9-32 0z" fill="url(#col3d)" stroke="#0f172a" stroke-width="1.1"/>
    <rect x="29" y="22" width="15" height="11" rx="3" fill="#334155" stroke="#0f172a" stroke-width="1"/>
    <rect x="32" y="25" width="9" height="4" rx="1.2" fill="#5eead4"/>
    <circle cx="47" cy="28" r="2" fill="#0ea5e9"/>
    <path d="M52 13q5 8 0 16M56 9q8 13 0 26" stroke="#5eead4" stroke-width="1.5" fill="none" opacity=".9"/>
  </svg>`;

  function bigDeviceArt(name){
    const k = devIconKey(name);
    return `<span class="bs-equip-art">${MACHINE_ART[k] || MACHINE_ART.tractor}</span>`;
  }
  function machineArt(name){
    const n = String(name||'');
    let k = 'tractor';
    if (/机器狗|巡检机器人/.test(n)) k = 'dog';
    else if (/保定|称重/.test(n)) k = 'scale';
    else if (/TMR|拌料/.test(n)) k = 'mixer';
    else if (/粉碎/.test(n)) k = 'crusher';
    else if (/无人机/.test(n)) k = 'drone';
    else if (/拖拉机/.test(n)) k = 'tractor';
    else if (/打草|割草/.test(n)) k = 'mower';
    else if (/门/.test(n)) k = 'gate';
    return `<span class="mach-art">${MACHINE_ART[k] || MACHINE_ART.tractor}</span>`;
  }

  /* ================= 智慧装备 ================= */
  const deviceFields = [
    {name:'name', label:'设备名称', type:'text', required:true},
    {name:'cat', label:'装备分类', type:'select', options: DB.deviceCats.map(c=>({v:c.id, t:c.name}))},
    {name:'model', label:'品牌/型号', type:'text'},
    {name:'serial', label:'设备编号/序列号', type:'text'},
    {name:'count', label:'数量', type:'number'},
    {name:'where', label:'安装位置', type:'text'},
    {name:'state', label:'运行状态', type:'select', options:[{v:'在线'},{v:'离线'},{v:'检修'}]},
    {name:'protocol', label:'对接协议/端口', type:'text', placeholder:'例：ONVIF / RTSP · LoRa · Modbus'},
    {name:'battery', label:'供电/电量', type:'text'},
    {name:'last', label:'最近上报', type:'text'}
  ];
  function openCameraViewer(name,url){
    if(!url) return;
    const ov=document.createElement('div'); ov.className='modal-overlay camera-viewer-overlay';
    const isMedia=/\.(m3u8|mp4)(\?|$)/i.test(url);
    const body=isMedia
      ? `<video class="camera-live-video" src="${escTxt(url)}" controls autoplay muted playsinline></video>`
      : `<iframe class="camera-live-frame" src="${escTxt(url)}" allow="autoplay; fullscreen" referrerpolicy="no-referrer"></iframe>`;
    ov.innerHTML=`<div class="modal camera-viewer-modal">
      <div class="camera-viewer-head"><div><b>🎥 ${escTxt(name||'监控直播')}</b><span>大屏实时视频</span></div><button class="modal-x" type="button">×</button></div>
      <div class="camera-viewer-body">${body}<div class="camera-live-note">如画面未显示，请检查监控网关地址、网络和浏览器是否允许嵌入。</div></div>
      <div class="modal-foot"><a class="btn ghost" href="${escTxt(url)}" target="_blank" rel="noopener">↗ 新窗口打开</a><button class="btn solid" data-close>关闭</button></div>
    </div>`;
    document.body.appendChild(ov);
    const close=()=>ov.remove();
    ov.addEventListener('click',e=>{if(e.target===ov)close()});
    ov.querySelector('.modal-x').onclick=close;
    ov.querySelector('[data-close]').onclick=close;
  }
  const DEVICE_ONBOARD_PRESETS = [
    {key:'camera', name:'监控摄像头', icon:'🎥', cat:'D1', portKind:'监控端口', brands:['海康威视','大华','宇视','天地伟业'], protocols:['ONVIF','RTSP','GB28181'], protocol:'ONVIF / RTSP / GB28181', endpoint:'rtsp://设备IP:554/Streaming/Channels/101', where:'生活区 / 饲草区 / 设备区 / 犊牛舍 / 活动区 / 牛舍内', battery:'市电 + UPS', prefixes:['CAM','HK','DH','YS']},
    {key:'earTag', name:'耳标测温（读写器+耳标）', icon:'🏷️', cat:'D2', portKind:'耳标端口', brands:['RFID 134.2kHz','BLE 测温耳标'], protocols:['RFID 134.2kHz','BLE','TCP/IP','MQTT'], protocol:'RFID 134.2kHz + 测温 · TCP/IP / BLE', endpoint:'tcp://读写器IP:8000', where:'全场牛只', battery:'耳标电池 2-3 年', prefixes:['EB','RFID','TAG']},
    {key:'collar', name:'北斗/GPS 定位项圈', icon:'🛰️', cat:'D2', portKind:'定位端口', brands:['北斗定位项圈','4G 定位终端'], protocols:['MQTT','4G','北斗短报文'], protocol:'北斗 / GPS · 4G · MQTT', endpoint:'mqtt://iot.example.cn:1883/ranch/collar', where:'放牧牛群 / 头牛佩戴', battery:'电池 78-92%', prefixes:['GN','BD','COL']},
    {key:'robotDog', name:'智能巡检机器狗', icon:'🤖', cat:'D3', portKind:'机器狗端口', brands:['宇树','云深处','巡检机器人'], protocols:['HTTP API','RTSP','4G/5G'], protocol:'HTTP API + RTSP 回传 · 4G/5G / Wi-Fi', endpoint:'http://设备IP:8080/api/robot', where:'牛舍 / 活动区 / 饲草区', battery:'充电桩 / 电池', prefixes:['DOG','ROBOT']},
    {key:'scale', name:'自动称重保定架', icon:'⚖️', cat:'D4', portKind:'称重端口', brands:['三分群保定称','自动称重分群'], protocols:['RS485','Modbus RTU','Modbus TCP'], protocol:'RS485 / Modbus RTU · 分群控制', endpoint:'modbus://设备IP:502', where:'大牛棚圈', battery:'市电', prefixes:['WG','SCALE']},
    {key:'feeder', name:'TMR / 撒料机 / 饲喂设备', icon:'🚜', cat:'D4', portKind:'饲喂端口', brands:['TMR 拌料机','撒料机','推料机器人'], protocols:['ISOBUS','Modbus','车载称重'], protocol:'ISOBUS / Modbus / 车载称重', endpoint:'isobus://设备IP:9000', where:'饲草区 / 饲喂通道', battery:'柴油 / 市电', prefixes:['TMR','FEED']},
    {key:'climate', name:'棚圈温控 / 门禁', icon:'🏠', cat:'D4', portKind:'棚圈控制端口', brands:['温控器','自动院墙门','环境传感器'], protocols:['Modbus','MQTT','4G 控制'], protocol:'Modbus / MQTT / 4G 控制', endpoint:'mqtt://iot.example.cn:1883/ranch/barn', where:'犊牛舍 / 大牛棚圈 / 院墙门', battery:'市电 / 太阳能', prefixes:['CL','GATE','ENV']},
    {key:'machine', name:'农机 / 无人机作业终端', icon:'🛰️', cat:'D5', portKind:'农机端口', brands:['北斗农机终端','RTK 监测终端','无人机'], protocols:['RTK','北斗','ISOBUS','4G API'], protocol:'RTK / 北斗作业监测 · 4G API', endpoint:'https://api.example.cn/v1/machine/task', where:'草场 / 打草场', battery:'柴油 / 电池', prefixes:['AG','RTK','UAV']}
  ];
  function inferDevicePreset(code, selectedKey){
    const preset = DEVICE_ONBOARD_PRESETS.find(x=>x.key===selectedKey);
    if (preset) return preset;
    const c = String(code||'').trim().toUpperCase();
    return DEVICE_ONBOARD_PRESETS.find(p=>p.prefixes.some(x=>c.startsWith(x))) || null;
  }
  function openDeviceOnboardModal(selectedKey='', mode=''){
    const selected = DEVICE_ONBOARD_PRESETS.find(x=>x.key===selectedKey) || null;
    const discoveredCode = mode==='discover' ? 'AUTO-'+Date.now().toString().slice(-8) : '';
    openModal('设备购买后接入 · 自动识别协议', [
      {name:'preset', label:'设备类型（可自动识别）', type:'select', options:[{v:'',t:'请选择或由编号自动识别'}].concat(DEVICE_ONBOARD_PRESETS.map(p=>({v:p.key,t:p.name}))), value:selected?selected.key:''},
      {name:'brand', label:'品牌', type:'text', value:selected?selected.brands[0]:'', placeholder:'例：海康威视 / 大华 / RFID 读写器'},
      {name:'model', label:'型号', type:'text', value:selected?selected.protocols[0]:'', placeholder:'例：DS-2CD / AMG-TG5'},
      {name:'serial', label:'设备编号 / 二维码内容', type:'text', value:discoveredCode, required:true, placeholder:'扫码枪扫描，或输入设备序列号'},
      {name:'count', label:'数量', type:'number', value:selected&&selected.key==='earTag'?'1':'1'},
      {name:'where', label:'安装位置', type:'text', value:selected?selected.where:''},
      {name:'protocol', label:'自动识别的连接协议', type:'text', value:selected?selected.protocol:''},
      {name:'endpoint', label:'设备连接地址 / 网关地址', type:'text', value:selected?selected.endpoint:'', placeholder:'例：rtsp://IP:554 / tcp://IP:8000 / mqtt://...'},
      {name:'liveUrl', label:'大屏直播地址（WVP/go2rtc/HLS/WebRTC）', type:'text', placeholder:'例：http://服务器:1984/stream.html?src=hk1 或 https://服务器/live/camera1.m3u8'},
      {name:'account', label:'账号 / 设备密钥', type:'text', placeholder:'没有可留空'}
    ], async v=>{
      const p = inferDevicePreset(v.serial, v.preset);
      if (!p){ toast('暂时无法识别该设备，请选择设备类型后重试','warn'); return; }
      const serial = String(v.serial||'').trim() || (p.key.toUpperCase()+'-'+uid('DEV').slice(-6));
      if ((DB.deviceList||[]).some(d=>d.serial && d.serial===serial)){ toast('该设备编号已经在系统中','warn'); return; }
      const payload = {
        adapterKey:p.key, serial, name:p.name, cat:p.cat,
        model:(v.brand||p.brands[0])+' '+(v.model||''), count:+v.count||1,
        where:v.where||p.where, protocol:v.protocol||p.protocol,
        endpoint:v.endpoint||p.endpoint, liveUrl:v.liveUrl||'', account:v.account||'—'
      };
      let cloudResult = null;
      if (/^https?:/.test(location.protocol)){
        try {
          const r = await fetch('/api/devices/register', {
            method:'POST', credentials:'include',
            headers:{'content-type':'application/json','accept':'application/json'},
            body:JSON.stringify(payload)
          });
          if (r.ok) cloudResult = await r.json();
          else if ([400,409].includes(r.status)){
            const e = await r.json().catch(()=>({}));
            toast(e.error||'设备接入失败','warn'); return;
          }
        } catch(e){}
      }
      DB.deviceList = DB.deviceList || [];
      DB.ports = DB.ports || [];
      const device = cloudResult?.device || {
        id:uid('DV'), name:p.name, cat:p.cat, model:payload.model, serial,
        count:payload.count, where:payload.where, state:'在线', protocol:payload.protocol,
        battery:p.battery, last:'刚刚'
      };
      const port = cloudResult?.port || {
        id:uid('PT'), kind:p.portKind, name:p.name+' · '+serial,
        protocol:payload.protocol, endpoint:payload.endpoint,
        liveUrl:payload.liveUrl||'', account:payload.account||'—', status:'已连接',
        last:new Date().toLocaleString('zh-CN',{hour12:false})
      };
      DB.deviceList.push(device);
      DB.ports.push(port);
      saveDB();
      toast(cloudResult ? `✅ ${p.name} 已接入云端并开始上报` : `✅ ${p.name} 已在当前系统接入`);
      render(current);
    });
  }
  function pageDevices() {
    const c = compute();
    return `
    <div class="page">
      ${pageHeader('智慧装备 · 全系统一张网', '买完即可接入：扫码/编号 → 自动识别协议 → 绑定端口 → 数据进入系统', `<button class="btn solid sm" data-device-scan>＋ 扫码 / 编号接入</button><button class="btn ghost sm" data-device-discover>⌁ 自动发现设备</button>`)}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'📡', label:'联网终端', value:fmt(c.devTotal)+' 台', sub:'含耳标/项圈/终端', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'🟢', label:'设备在线率', value:c.devRate+'%', sub:'在线 '+fmt(c.devOnline)+' 台', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🔴', label:'离线/检修', value:fmt(c.devOffline)+' 台', sub:'饲料粉碎机检修 · 可回写状态', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'🔌', label:'成套装备', value:fmt(c.kit)+' 台套', sub:'6 大分类 · 农机/棚圈/无人设备', color:'#f59e0b', bg:'#fef3c7'})}
      </div>
      ${card('设备采购接入中心 · 适配型号', `
        <div class="onboard-steps">
          <div class="onboard-step"><span>1</span><div><b>扫码 / 输入编号</b><p>扫描设备二维码或输入序列号</p></div></div>
          <i>→</i>
          <div class="onboard-step"><span>2</span><div><b>自动识别协议</b><p>识别品牌、类型、ONVIF / RTSP / MQTT / Modbus 等端口</p></div></div>
          <i>→</i>
          <div class="onboard-step"><span>3</span><div><b>一键接入系统</b><p>绑定后自动进入装备台账、监控、大屏和手机端</p></div></div>
        </div>
        <div class="onboard-grid">
          ${DEVICE_ONBOARD_PRESETS.map(p=>`
            <div class="onboard-card">
              <div class="onboard-icon">${p.icon}</div>
              <div class="onboard-copy">
                <div class="onboard-name">${p.name}${pill('已适配','ok')}</div>
                <div class="onboard-meta">${p.brands.slice(0,2).join(' · ')}</div>
                <div class="onboard-proto">${p.protocols.join(' / ')}</div>
              </div>
              <button class="btn solid sm" data-onboard="${p.key}">一键接入</button>
            </div>`).join('')}
        </div>
        <div class="card-actions"><button class="btn ghost sm" data-device-scan>📷 扫码 / 输入设备编号</button><button class="btn ghost sm" data-device-discover>🔄 自动发现局域网设备</button></div>
        <div class="card-note">🔌 监控、耳标、项圈、机器狗、称重、饲喂、棚圈温控和农机终端均适配标准协议。购买符合协议的设备后，录入编号与连接地址即可接入，后续可继续在「后台管理 → 端口连接配置」修改真实协议地址。</div>
      `, 'device-onboard-card')}
      ${card('数据自动采集 · 智能硬件自动上报链路', `
        <div class="iot-pipe">
          ${[['📡','感知层','传感器/摄像头/项圈/耳标'],['📶','传输层','LoRa · 4G · 北斗短报文'],['🧠','平台层','AI 解析 · 清洗 · 规则引擎'],['📺','应用层','大屏 · 手机 · 预警中心']].map((x,i)=>`
            <div class="pipe-node"><span>${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></div>${i<3?'<i>→</i>':''}`).join('')}
        </div>
        <div class="card-note">🔌 生产环境：硬件设备通过标准协议实时上报 → 平台 API 入库 → 数据大屏/手机端自动更新，全程无需人工录入。演示版已内置实时采集引擎，以下指标每 ${(DB.iot.interval/1000)} 秒自动刷新。</div>`)}
      ${card('自动采集指标 · 数据来源', tableHtml(['指标','来源设备','协议/端口','采集频率'],
        DB.iot.sources.map(s=>[s.metric, s.device, `<span class="proto-mini">${s.protocol}</span>`, pill(s.freq,'info')])))}
      ${card('棚圈管理 · 两个棚圈 + 活动区 + 饲草区', `
        <div class="cat-grid">
          ${(DB.meta.facilities||[]).map(f=>`
            <div class="cat-card" style="--cc:#14b8a6">
              <div class="cat-head"><span class="cat-ico">${f.icon}</span><div><div class="cat-name">${f.name}</div><div class="cat-desc">${f.desc}</div></div></div>
              <div class="cat-proto">${f.detail||''}</div>
            </div>`).join('')}
        </div>
        <div class="card-note">🏠 棚圈状态实时监测：犊牛舍恒温 22℃、大牛棚圈保温、活动区饮水不冻；冬季圈养、夏季散养，棚圈与草场按季切换。</div>`)}
      ${card('智能农机管理 · 全流程机械化', `
        <div class="cat-grid">
          ${[
            ['三分群全自动保定称','自动称重 + 按体况分群 · RS485'],
            ['TMR 拌料机','9 立方 · 配方搅拌 · 出料输送'],
            ['饲料粉碎机','精料粉碎 · 电机驱动'],
            ['巡场无人机','巡场 / 巡草场 · RTK 图传'],
            ['无人拖拉机','北斗自动驾驶 · 打草场作业'],
            ['打草机','割草压扁 · 留茬 6cm'],
            ['自动院墙门','太阳能自动开合 · 遥控/4G'],
            ['智能巡检机器狗','夜间巡检 · 视觉导航 · 4G/5G 回传']
          ].map(x=>`
            <div class="cat-card mach-card" style="--cc:#0d9488">
              <div class="mach-head">${machineArt(x[0])}<div><div class="cat-name">${x[0]}</div><div class="cat-desc">${x[1]}</div></div></div>
            </div>`).join('')}
        </div>
        <div class="card-note">🚜 此区为机械化能力展示；实际数量、设备编号和在线状态以“装备台账”为准。农机端口可在「后台管理 → 端口连接配置」中填写 ISOBUS / Modbus / RTK 地址接入。</div>`)}
      ${card('装备分类', `
        <div class="cat-grid">
          ${DB.deviceCats.map(cat=>{
            const rows = DB.deviceList.filter(x=>x.cat===cat.id);
            const total = rows.reduce((s,x)=>s+x.count,0);
            const on = rows.filter(x=>x.state==='在线').reduce((s,x)=>s+x.count,0);
            return `<div class="cat-card" style="--cc:${cat.color}">
              <div class="cat-head"><span class="cat-ico">${cat.icon}</span><div><div class="cat-name">${cat.name}</div><div class="cat-desc">${cat.desc}</div></div></div>
              <div class="cat-count"><b>${fmt(total)}</b> 台 · 在线 ${on}</div>
              <div class="cat-proto">${cat.protocol}</div>
            </div>`;
          }).join('')}
        </div>`)}
      ${card('装备台账（可新增/编辑/删除）', tableHtml(['设备名称','分类','品牌/型号','设备编号','数量','位置','状态','对接协议','供电','操作'],
        DB.deviceList.map(d=>[
          `<span class="dev-cell">${devIcon(d.name)}<b>${d.name}</b></span>`,
          `<span class="cat-tag" style="--cc:${(DB.deviceCats.find(x=>x.id===d.cat)||{}).color||'#8a9a5b'}">${(DB.deviceCats.find(x=>x.id===d.cat)||{}).name||d.cat}</span>`,
          `<code>${d.model}</code>`, `<code>${d.serial||'待录入'}</code>`, fmt(d.count)+' 台', d.where,
          pill(d.state, d.state==='在线'?'ok':d.state==='离线'?'danger':'warn'),
          `<span class="proto-mini">${d.protocol}</span>`, d.battery,
          `<button class="btn ghost sm" data-device-connect="${d.id}">${d.state==='在线'?'查看链路':'连接'}</button>` + editBtn('deviceList', d.id) + delBtn('deviceList', d.id)
        ])))}
    </div>`;
  }
  function afterDevices(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'deviceList': { title:'编辑装备', fields: deviceFields } });
    $('#content').querySelectorAll('[data-onboard]').forEach(b=>b.addEventListener('click', ()=>openDeviceOnboardModal(b.dataset.onboard)));
    $('#content').querySelectorAll('[data-device-scan]').forEach(b=>b.addEventListener('click', ()=>openDeviceOnboardModal('')));
    $('#content').querySelectorAll('[data-device-discover]').forEach(b=>b.addEventListener('click', ()=>{
      toast('正在扫描同一局域网内的设备…');
      setTimeout(()=>openDeviceOnboardModal('camera','discover'),700);
    }));
    $('#content').querySelectorAll('[data-device-connect]').forEach(b=>b.addEventListener('click', ()=>{
      const d=(DB.deviceList||[]).find(x=>x.id===b.dataset.deviceConnect); if(!d)return;
      updateRecord('deviceList', d.id, { state:'在线', last:'刚刚' });
      toast(`${d.name} 数据链路已连接，正在实时上报`);
      render(current);
    }));
    $('#content').querySelectorAll('[data-add="deviceList"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增装备（端口对接）', deviceFields, v=>{
        addRecord('deviceList', {...v, count:+v.count||1});
        toast('装备已接入系统'); render(current);
      });
    }));
  }

  /* ================= 产品中心 ================= */
  function pageProducts() {
    const pr = DB.productRecords, inv = DB.productInventory;
    const sales = pr.filter(r=>r.type==='销售').reduce((a,r)=>a+(parseInt(String(r.amount).replace(/[^\d]/g,''))||0),0);
    return `
    <div class="page">
      ${pageHeader('产品中心', '从牧场到餐桌 · 冷鲜肉 / 奶食 / 绒品 / 文创 · 扫码溯源', addBtn('产品出入库'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🛍️', label:'在售品类', value:inv.length+' 类', sub:'6 大产品线', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'💰', label:'累计销售收入', value:money(sales), sub:'按销售记录实时汇总', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🧾', label:'销售/入库记录', value:pr.length+' 条', sub:'屠宰入库自动联动', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'📱', label:'溯源', value:'一品一码', sub:'批次 → 耳标 → 草场可查', color:'#8b5cf6', bg:'#ede9fe'})}
      </div>
      <div class="card">
        <div class="card-head"><h3>产品库存</h3></div>
        <div class="prod-stock">
          ${inv.map(x=>`<div class="ps-item"><div class="ps-ico">${x.name.includes('肉')?'🥩':x.name.includes('奶')||x.name.includes('奶酪')?'🧀':x.name.includes('绒')?'🧣':'🎁'}</div>
            <div class="ps-name">${x.name}</div><div class="ps-price">${x.price}</div>
            <div class="ps-stock"><b>${x.stock}</b> ${x.unit}</div><div class="ps-note">${x.note}</div></div>`).join('')}
        </div>
      </div>
      ${card('出入库 / 销售记录（可新增/删除）', tableHtml(['日期','类型','产品','数量','金额','客户/来源','操作'],
        pr.map(r=>[r.date, pill(r.type, r.type==='销售'?'warn':'info'), r.product, r.qty+' '+r.unit, r.amount==='—'?'—':r.amount, r.customer, delBtn('productRecords', r.id)])))}
      <div style="margin:0 0 18px">${addBtn('产品出入库')}</div>
    </div>`;
  }
  function afterProducts(){
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="产品出入库"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('产品出入库登记', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16', required:true},
        {name:'type', label:'类型', type:'select', options:[{v:'销售'},{v:'入库'}]},
        {name:'product', label:'产品', type:'select', options: DB.productInventory.map(x=>({v:x.name}))},
        {name:'qty', label:'数量', type:'number', required:true},
        {name:'unit', label:'单位', type:'text', placeholder:'吨/盒/件'},
        {name:'amount', label:'金额', type:'text', placeholder:'例：¥12,800'},
        {name:'customer', label:'客户/来源', type:'text'}
      ], v=>{
        if (!v.qty) { toast('请填写数量','warn'); return false; }
        addRecord('productRecords', {...v, qty:+v.qty});
        toast('产品记录已保存'); render(current);
      });
    }));
  }

  /* ================= 文旅牧游 ================= */
  function pageTourism() {
    const t = DB.tourism;
    return `
    <div class="page tourism-page">
      ${pageHeader('文旅牧游', '牧户游 · 全季运营：蒙古包 / 研学 / 打草体验 / 冰雪牧游', addBtn('新增订单'))}
      <div class="kpi-grid kpi-4 tourism-kpis">
        ${statCard({icon:'🎫', label:'今日订单', value:t.orders.length+' 单', sub:'待接待 1 单', color:'#8b5cf6', bg:'#ede9fe'})}
        ${statCard({icon:'👨‍👩‍👧', label:'今日游客', value:'48 人', sub:'亲子 2 团 · 散客 5 组', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'💰', label:'近 7 日收入', value:'¥1.27 万', sub:'住宿 40% · 体验 35% · 餐饮 25%', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'⭐', label:'游客评分', value:'4.9 分', sub:'近 30 天 128 条评价', color:'#0ea5e9', bg:'#e0f2fe'})}
      </div>

      <div class="tourism-top-grid">
        ${card('近 7 日牧游收入', `<div id="chRev" class="chart-box"></div>`, 'tourism-revenue-card')}
        ${card('蒙古包 / 毡房', `
          <div class="yurt-list">${t.yurts.map(y=>`<div class="yurt-item"><div class="yurt-top"><span>⛺ ${y.name}</span>${pill(y.status, y.status==='营业中'?'ok':'muted')}</div><div class="yurt-fac">${y.fac}</div></div>`).join('')}</div>
          <div class="card-note">❄️ 冬季全屋地暖 + 火墙，室内恒温 22℃。</div>`, 'tourism-yurt-card')}
      </div>

      ${card('旅游产品 · 全季运营', `
        <div class="prod-grid">${t.products.map(p=>`
          <div class="prod-card"><div class="prod-ico">${p.icon}</div><div class="prod-name">${p.name}</div>
          <div class="prod-desc">${p.desc}</div><div class="prod-foot"><span class="prod-price">${p.price}</span><span class="prod-season">${p.season}</span></div></div>`).join('')}</div>`, 'tourism-products-card')}

      ${card('民俗节庆日历 · 四季活动', tableHtml(
        ['时间','活动','地点','类型','状态','说明','操作'],
        DB.hulunbuir.events.map(e=>[e.date, `<b>${e.name}</b>`, e.place,
          pill(e.type, e.type==='那达慕'?'danger':e.type==='冰雪'?'info':'warn'),
          pill(e.status, e.status==='筹备'?'warn':'muted'), e.note,
          editBtn('hulunbuir.events', e.id) + delBtn('hulunbuir.events', e.id)]),
        'tourism-events-tbl'
      ) + `<div class="card-actions">${addBtn('新增节庆活动','hulunbuir.events')}</div>`, 'tourism-events-card')}

      ${card('订单管理', tableHtml(
        ['订单号','项目','游客','时间','金额','状态','操作'],
        t.orders.map(o=>[`<code>${o.id}</code>`, o.item, o.guest, o.date, o.amount,
          pill(o.status, o.status==='已付款'?'ok':o.status==='已确认'?'info':'warn'), delBtn('tourism.orders', o.id)]),
        'tourism-orders-tbl'
      ) + `<div class="card-actions">${addBtn('新增订单')}</div>`, 'tourism-orders-card')}

      <div class="tourism-bottom-grid">
        ${card('安全保障', `<div class="cold-list"><div class="cold-item">🛡️ ${t.safety}</div>
          <div class="cold-item">🚑 与镇卫生院 18km 急救联动 · 救援车 2 台</div>
          <div class="cold-item">🧭 全部向导持证 · 骑乘线路投保</div></div>`, 'tourism-safety-card')}
        ${card('四季旅游路线', `
          <div class="season-list">
            ${[['春','草原苏醒 · 产犊研学','4-5月'],['夏','绿海深处 · 深度游牧','6-8月'],['秋','金色草原 · 打草体验','9-10月'],['冬','雪原秘境 · 冰雪那达慕','11-2月']].map(x=>`
              <div class="sl-row" style="--sl:${SEASON_COLOR[x[0]]}"><span class="sl-m">${x[0]}</span><span class="sl-t">${x[1]}（${x[2]}）</span></div>`).join('')}
          </div>`, 'tourism-routes-card')}
      </div>
    </div>`;
  }
  const eventFields = [
    {name:'date', label:'时间', type:'text', placeholder:'例：7 月中旬'},
    {name:'name', label:'活动名称', type:'text', required:true},
    {name:'place', label:'地点', type:'text'},
    {name:'type', label:'类型', type:'select', options:[{v:'那达慕'},{v:'民俗活动'},{v:'祭祀'},{v:'冰雪'},{v:'研学'}]},
    {name:'status', label:'状态', type:'select', options:[{v:'计划'},{v:'筹备'},{v:'进行中'},{v:'已完成'}]},
    {name:'note', label:'说明', type:'text'}
  ];
  function afterTourism(){
    Charts.line($('#chRev'), { labels:['2/10','2/11','2/12','2/13','2/14','2/15','2/16'], unit:'元',
      series:[{ name:'收入', color:'#f59e0b', values:[3260,4180,5230,6110,7480,8920,12680] }],
      height:210, yFormat:v=>'¥'+fmt(Math.round(v)) });
    bindDel($('#content'));
    bindEdit($('#content'), { 'hulunbuir.events': { title:'编辑节庆活动', fields: eventFields } });
    $('#content').querySelectorAll('[data-add="hulunbuir.events"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增节庆活动', eventFields, v=>{ addRecord('hulunbuir.events', v); toast('活动已新增'); render(current); });
    }));
    $('#content').querySelectorAll('[data-add="新增订单"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增牧游订单', [
        {name:'item', label:'项目', type:'text', placeholder:'例：蒙古包住宿 ×2', required:true},
        {name:'guest', label:'游客', type:'text', placeholder:'例：王先生 · 北京'},
        {name:'date', label:'时间', type:'text', placeholder:'例：2/17 14:00'},
        {name:'amount', label:'金额', type:'text', placeholder:'例：¥1,360'},
        {name:'status', label:'状态', type:'select', options:[{v:'待付款'},{v:'已付款'},{v:'已确认'},{v:'待接待'}]}
      ], v=>{ addRecord('tourism.orders', v); toast('订单已新增'); render(current); });
    }));
  }

  /* ================= 牧场档案 ================= */
  function pageProfile() {
    const r = DB.meta;
    const ps = pageSetting('profile');
    return `
    <div class="page">
      <div class="ranch-hero">
        <div class="rh-inner">
          <div class="rh-logo"><img src="assets/logo.png?v=72" alt="YILATE Smart Ranch"></div>
          <div class="rh-name">${ps.title || r.name}</div>
          <div class="rh-en">${ps.subtitle || (r.nameEn+' · 新一代家庭牧场')}</div>
          <div class="rh-loc">📍 ${r.location}</div>
          <div class="rh-chips">${['🐄 养殖','🌾 草场','📡 智慧装备','🍖 屠宰加工','🧀 产品中心','🏕️ 牧户游'].map(x=>`<span>${x}</span>`).join('')}</div>
        </div>
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('牧场简介', `
            <p class="prose">${r.name}位于呼伦贝尔市新巴尔虎左旗吉布胡郎图苏木呼伦嘎查，${r.founded} 年建场，以<strong>基础母牛繁育</strong>为核心产业，现有 3 栋标准化圈舍（配套独立活动区）、基础母牛 200 头，采用“散养为主、圈养繁育为辅”的养殖模式。牧场所在区域极端低温可达 <strong>-45℃</strong>、积雪期约 140 天，高寒环境对母牛繁育与越冬安全提出严峻考验。</p>
            <p class="prose">牧场以<strong>西门塔尔牛</strong>为唯一核心畜种；2026 年完成智慧化升级，接入监控、耳标测温、北斗定位、全自动保定称、TMR 拌料机等设备，构建“<strong>可视、可测、可控、可预警</strong>”的养殖管理体系；用一套平台管理 ${fmt(r.area)} 亩草场、${fmt(compute().totalAnimals)} 头只牲畜与 ${fmt(compute().devTotal)} 台（套）联网装备。</p>
            <p class="prose">牧场坚持<strong>草畜平衡、以草定畜、四季循环</strong>：春季产犊防疫、夏季轮牧打草、秋季出栏储备、冬季补饲牧游，全年循环闭环、草原越养越好。</p>
            <div class="honor-row">${['西门塔尔牛繁育示范牧场','巴尔虎草原智慧养殖示范','新巴尔虎左旗家庭牧场示范场','高寒牧区越冬示范'].map(h=>`<span class="honor">🏅 ${h}</span>`).join('')}</div>`)}
          ${card('智慧化建设历程', `
            <div class="timeline">
              ${[['2016','建场起步','伊拉特家庭牧场成立 · 传统四季转场放牧'],['2019','圈舍扩建','3 栋标准化圈舍 · 独立活动区'],['2023','打草与饲草库','打草场 1,500 亩 · 天然草冬储体系'],['2025','繁育提质','犊牛成活率提升 · 电子耳标建档'],['2026','智慧化升级','监控 / 耳标测温 / 保定称 / TMR 接入'],['2026','一体化平台','感知 · 监测 · 调控 · 预警全打通']].map(([y,tt,dd],i)=>`
                <div class="tl-item"><div class="tl-dot ${i===5?'now':''}"></div><div class="tl-year">${y}</div><div class="tl-body"><b>${tt}</b><p>${dd}</p></div></div>`).join('')}
            </div>`)}
        </div>
        <div class="col1">
          ${card('牧场档案卡', `
            <div class="info-table">
              ${[['牧场名称', r.name], ['牧场主', r.owner], ['养殖方式', r.mode||''], ['开发单位', r.developer||''], ['行政区划', '呼伦贝尔市 · 新巴尔虎左旗 · 吉布胡郎图苏木呼伦嘎查'], ['坐标', r.gps], ['草场面积', fmt(r.area)+' 亩（放牧 '+fmt(r.grazingArea)+' / 打草 '+fmt(r.hayArea)+'）'], ['气候特点', r.climate], ['成立年份', r.founded+' 年'], ['智慧化启动', r.smartSince+' 年']].map(([k,v])=>`<div class="info-row"><span>${k}</span><b>${v}</b></div>`).join('')}
            </div>`)}
          ${card('牧场设施清单', `
            <div class="fac-list">
              ${(r.facilities||[]).map(f=>`
                <div class="fac-item">
                  <span class="fac-ico">${f.icon}</span>
                  <div><b>${f.name}</b><p>${f.desc}</p><i>${f.detail||''}</i></div>
                </div>`).join('')}
            </div>`)}
          ${card('一体化经营数据', `
            <div class="mini-stats">
              <div class="ms"><b>${fmt(compute().totalAnimals)}</b><span>牲畜存栏（头只）</span></div>
              <div class="ms"><b>${fmt(r.area)} 亩</b><span>草场面积</span></div>
              <div class="ms"><b>${fmt(compute().devTotal)} 台</b><span>联网智能终端</span></div>
              <div class="ms"><b>13 个</b><span>系统功能模块</span></div>
            </div>`)}
          ${card('寒冷地区 · 冬季运营要点', `
            <div class="cold-list">
              <div class="cold-item">❄️ 冬季最低 -42℃ · 恒温暖棚 4 座棚温 24℃</div>
              <div class="cold-item">🥶 防冻智能饮水槽 40 套 · 水温恒 8-12℃</div>
              <div class="cold-item">🌾 天然草 900 捆 + 青贮 30 吨 · 冬储覆盖至次年 4 月</div>
              <div class="cold-item">🛰️ 偏远草场北斗短报文 + 风光互补供电</div>
              <div class="cold-item">⛺ 冬季牧户游：地暖蒙古包 + 雪原穿越</div>
              <div class="cold-item">🚨 白灾预警联动：围栏、无人机、救援一图调度</div>
            </div>`)}
          <button class="btn danger" data-reset>↺ 重置为示例数据</button>
        </div>
      </div>
    </div>`;
  }
  function afterProfile(){
    const rb = $('#content').querySelector('[data-reset]');
    if (rb) rb.addEventListener('click', ()=>{
      confirmDel('确定将所有数据重置为系统示例数据吗？当前录入内容将被覆盖。', ()=>{ resetData(); toast('已重置为示例数据'); render(current); });
    });
  }


  /* ================= 智能服务小伊 ================= */
  const agentMsgs = [ {role:'bot', text:'您好，我是「智能服务小伊」👩‍🌾\n我可以基于牧场实时数据回答：存栏、饲草、防疫、屠宰、产品、牧游、设备、转场、天气预警等问题，也可以给寒冷地区养牛、保犊和越冬管理建议。'} ];
  const escTxt = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function msgHtml(m){
    return `<div class="am ${m.role==='user'?'user':'bot'}"><div class="am-ava">${m.role==='user'?'🧑':'👩‍🌾'}</div><div class="am-bubble">${escTxt(m.text).replace(/\n/g,'<br>')}</div></div>`;
  }
  function agentReply(q){
    const c = compute(), m = DB.months[demoMonth-1];
    const has = (...ks)=>ks.some(k=>q.includes(k));
    if (has('存栏','多少头','牲畜','有几','结构') && !has('转场')){
      return `📊 当前存栏 ${fmt(c.totalAnimals)} 头只\n${DB.species.map(x=>x.emoji+' '+x.name+' '+fmt(x.count)).join(' · ')}\n西门塔尔牛为核心畜种，大牛 102 头（大牛棚圈）+ 小牛 84 头（犊牛舍）\n草场 ${fmt(DB.meta.area)} 亩 · 折合标准家畜单位 ${fmt(c.sheepUnits)}\n本年度产犊 84 头，成活率 96.0%。`;
    }
    if (has('饲草','过冬','储备','干草','青贮','饲料')){
      const inv = DB.forageInventory.map(x=>`· ${x.name} ${x.stock}/${x.target}${x.unit}`).join('\n');
      return `🧊 饲草储备整体 ${c.foragePct}%\n${inv}\n❄️ 高寒牧区提示：天然草 900 捆（目标 1,000 捆），可覆盖至次年 4 月，建议打草季补足或提前采购。`;
    }
    if (has('设备','在线率','离线','装备','项圈','耳标','监控','无人机','机器人')){
      return `📡 联网终端 ${fmt(c.devTotal)} 台，在线率 ${c.devRate}%（在线 ${fmt(c.devOnline)} 台）\n成套装备 ${fmt(c.kit)} 台套 · 离线/检修 ${fmt(c.devOffline)} 台（饲料粉碎机检修）\n已生成设备巡检工单，维修状态实时回写。`;
    }
    if (has('防疫','疫苗','口蹄疫','免疫','布病','驱虫','炭疽')){
      return `💉 年度免疫程序 ${DB.vaccinePlans.length} 项：春秋两防，含口蹄疫（O/A 型）、炭疽、布病监测、犊牛腹泻疫苗。\n已完成记录 ${DB.vaccineRecords.filter(r=>r.status==='完成').length} 条，免疫率 96.8%。\n口蹄疫防控要点：新购牲畜隔离 21 天、圈舍每周消毒、发现口蹄水疱立即上报旗疫控中心。`;
    }
    if (has('屠宰','出栏','检疫','杀')){
      const sl = DB.slaughterRecords.reduce((a,r)=>a+r.head,0);
      return `🍖 本季已屠宰 ${sl} 头只，检疫合格率 100%（旗动物检疫所出证）。\n秋冬季出栏计划：西门塔尔牛 62 头。\n流程：停用药物 14 天 → 产地检疫 → 定点屠宰 → 排酸 → 分割 → 溯源入库。`;
    }
    if (has('产品','销售','收入','多少钱','收益')){
      return `🛍️ 产品销售收入累计 ${money(c.saleAmount)}\n在售：冷鲜牛肉、犊牛、奶豆腐/奶皮子、手工奶酪、草原文创。\n每件产品一品一码可溯源：批次 → 耳标 → 草场。`;
    }
    if (has('牧户游','订单','游客','旅游','住宿','那达慕','活动','节庆')){
      const events = DB.hulunbuir.events.filter(e=>e.status!=='已完成').map(e=>`· ${e.date} ${e.name}（${e.place}）`).join('\n');
      return `🏕️ 今日订单 ${c.todayOrders} 单 · 今日游客 ${live.visitors} 人 · 评分 4.9\n近期活动：\n${events||'· 暂无'}\n冬季主推：地暖蒙古包、雪原穿越、冰雪那达慕。`;
    }
    if (has('转场','营盘','轮牧','放牧','走敖特尔','该不该')){
      const next = DB.hulunbuir.migration.find(x=>x.status!=='已完成');
      return `🔄 当前 ${demoMonth} 月 · ${m.season}季（${m.name}）\n本季任务：${m.tasks.join('；')}\n下次转场：${next?`${next.season} ${next.route}（${next.distance} · ${next.time}）`:'暂无'}\n转场原则：春避返青、夏逐水草、秋储冬草、冬御风雪。`;
    }
    if (has('产犊','繁殖','小牛','犊牛')){
      return `🍼 本年度繁殖：产犊 84 头（西门塔尔），犊牛成活率 96.0%\n高寒牧区产犊要点：\n1）犊牛房恒温 22℃，出生后立即擦干保温\n2）初乳 2 小时内饲喂，必要时灌服\n3）饮水加热器保持常开（水温 12℃），防冰水应激。`;
    }
    if (has('天气','温度','降温','寒潮','冷','下雪','白灾','雪灾')){
      return `🌦️ ${DB.weather.place}：${DB.weather.icon} ${live.t}℃（体感 ${DB.weather.feels}℃）\n${DB.weather.wind} · ${DB.weather.snow}\n⚠️ ${DB.weather.alert}\n❄️ 今夜最低 ${DB.weather.low}℃，请确保犊牛暖棚加温、饮水槽防冻正常。`;
    }
    if (has('草场','载畜量','NDVI','植被','退化','打草','亩')){
      return `🌾 草场 ${fmt(DB.meta.area)} 亩（放牧 ${fmt(DB.meta.grazingArea)} · 打草 ${fmt(DB.meta.hayArea)}）· 位于新巴尔虎左旗呼伦嘎查\n载畜量使用率 ${DB.grassland.balance.rate}%（安全线 90%）· 标准家畜单位 ${fmt(c.sheepUnits)}/${fmt(DB.grassland.balance.capacity)}\nNDVI ${live.ndvi.toFixed(3)} · 植被优良\n分类：草甸/典型/低湿地/改良/沙化 6 类，以类定用。`;
    }
    if (has('预警','告警','风险','紧急')){
      const hi = DB.tasks.filter(t=>t.level==='高');
      return `🔔 当前预警 ${DB.tasks.length} 项，其中高优先级 ${hi.length} 项：\n${hi.map(t=>`· ${t.text}（${t.time}）`).join('\n')}\n生态监测：白灾预警、草原防火、鼠害防治、野生动物保护均已接入平台。`;
    }
    if (has('溯源','扫码','耳标号','安全','绿色')){
      return `📱 一畜一码全程溯源：出生 → 免疫 → 转场 → 出栏检疫 → 分割加工 → 销售，全链路可查。\n消费者扫码即可看到耳标号、草场、防疫记录，绿色畜产品认证基地。`;
    }
    if (has('帮助','你会','能干什么','功能','怎么用')){
      return `👩‍🌾 我可以帮你：\n· 查存栏 / 草场 / 饲草 / 防疫 / 屠宰 / 产品 / 订单 / 设备\n· 给寒冷地区饲养建议（产犊、防寒、防疫、补饲）\n· 查预警与转场计划\n直接问我，或点下方快捷问题。`;
    }
    if (has('你好','在吗','hi','嗨','哈喽')){
      return `你好呀！我是智能服务小伊 👩‍🌾\n想了解牧场的任何情况都可以问我，比如「饲草够不够过冬」「该不该转场了」。`;
    }
    if (has('整体','情况','总结','日报','今天','汇总','汇报','快报')){
      return `📋 今日牧场快报\n· 存栏 ${fmt(c.totalAnimals)} 头只 · 当前 ${monthName(demoMonth)} ${m.season}季（${m.name}）\n· 设备在线率 ${c.devRate}%（${fmt(live.online)} 台在线）\n· 饲草储备 ${c.foragePct}% · 产品收入 ${money(c.saleAmount)}\n· 牧游订单 ${c.todayOrders} 单 · 游客 ${live.visitors} 人\n· 高优先级预警 ${DB.tasks.filter(t=>t.level==='高').length} 项\n· 建议：今夜最低 -31℃，暖棚加温至 26℃，早晚巡圈。`;
    }
    return `我暂时没太听懂这个问题 😅 你可以问我：\n· 「今天牧场整体情况怎么样？」\n· 「饲草储备够不够过冬？」\n· 「口蹄疫怎么防？」\n· 「该不该转场了？」\n也可以试试下方的快捷问题。`;
  }
  function pageAgent(){
    const c = compute(), m = DB.months[demoMonth-1];
    const ps = pageSetting('agent');
    const brief = `📋 ${monthName(demoMonth)} · ${m.season}季快报　存栏 ${fmt(c.totalAnimals)} · 设备在线 ${c.devRate}% · 饲草 ${c.foragePct}% · 游客 ${live.visitors} 人`;
    return `
    <div class="page agent-page">
      <div class="agent-head">
        <div class="ah-avatar">👩‍🌾</div>
        <div class="ah-txt"><b>${ps.title || '智能服务小伊'}</b><span>${ps.subtitle || '伊拉特牧场数据问答 · 高寒牧区养殖顾问'}</span></div>
        <div class="ah-online">● 在线</div>
      </div>
      <div class="agent-brief" id="agentBrief">${brief}</div>
      <div class="agent-chat" id="agentChat">${agentMsgs.map(msgHtml).join('')}</div>
      <div class="agent-quick" id="agentQuick">${DB.agent.quick.map(q=>`<button class="aq">${q}</button>`).join('')}</div>
      <div class="agent-input">
        <input id="agentInput" placeholder="问点什么… 例：饲草够不够过冬？">
        <button class="mic" id="agentMic" title="语音提问">🎤</button>
        <button class="send" id="agentSend">发送</button>
      </div>
    </div>`;
  }
  function afterAgent(){
    const chat = $('#agentChat'), input = $('#agentInput');
    const scroll = ()=>chat.scrollTop = chat.scrollHeight;
    scroll();
    const push = m=>{ agentMsgs.push(m); chat.insertAdjacentHTML('beforeend', msgHtml(m)); scroll(); };
    const ask = q=>{
      q = (q||'').trim(); if (!q) return;
      push({role:'user', text:q}); input.value='';
      const typing = document.createElement('div');
      typing.className = 'am bot';
      typing.innerHTML = '<div class="am-ava">👩‍🌾</div><div class="am-bubble typing"><i></i><i></i><i></i></div>';
      chat.appendChild(typing); scroll();
      setTimeout(()=>{ typing.remove(); push({role:'bot', text:agentReply(q)}); }, 500+Math.random()*500);
    };
    $('#agentSend').addEventListener('click', ()=>ask(input.value));
    input.addEventListener('keydown', e=>{ if (e.key==='Enter') ask(input.value); });
    $('#agentQuick').querySelectorAll('.aq').forEach(b=>b.addEventListener('click', ()=>ask(b.textContent)));
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $('#agentMic');
    if (SR){
      mic.addEventListener('click', ()=>{
        try {
          const rec = new SR(); rec.lang='zh-CN'; rec.interimResults=false;
          rec.onresult = e=>{ input.value = e.results[0][0].transcript; toast('已识别，按回车发送'); };
          rec.onerror = ()=>toast('语音识别失败，请重试','warn');
          rec.onend = ()=>{};
          rec.start(); toast('🎤 请说话…','warn');
        } catch(err){ toast('语音识别不可用','warn'); }
      });
    } else mic.addEventListener('click', ()=>toast('当前浏览器不支持语音，请用 Edge 或 Chrome','warn'));
  }



  /* ================= 牧事日志 ================= */
  const patrolItems = ['圈舍巡视','饮水槽 / 水源','饲草补饲','体温 / 精神状态','围栏 / 边界','粪污清理'];
  let patrolDone = new Set();
  function pageLog(){
    const today = new Date();
    return `
    <div class="page">
      ${pageHeader('牧事日志 · 牧民的一天', '每天记一记：巡栏打卡 + 今天干了啥 + 明天要干啥，产犊季再也不乱', addBtn('写日志','logs'))}
      <div class="grid-3">
        <div class="col2">
          ${card('今日巡栏打卡', `
            <div class="patrol-head"><b>${today.getMonth()+1}月${today.getDate()}日 · 巡栏清单</b><span id="patrolProg">已完成 0/6</span></div>
            <div class="check-list" id="patrolList">
              ${patrolItems.map((it,i)=>`<label class="ck-item"><input type="checkbox" data-p="${i}"><span>✅</span><em>${it}</em></label>`).join('')}
            </div>
            <div class="card-note" id="patrolNote">❄️ 冬季巡栏重点：暖棚温度、饮水槽防冻、犊羔精神状态。</div>`)}
          ${card('牧事记录（可新增/编辑/删除）', tableHtml(['日期','天气','今天做了什么','明天计划','备注','操作'],
            DB.logs.map(l=>[l.date, pill(l.weather,'info'), l.done, l.plan||'—', l.note||'—', editBtn('logs', l.id)+delBtn('logs', l.id)])))}
          <div style="margin-top:12px">${addBtn('写日志','logs')}</div>
        </div>
        <div class="col1">
          ${card('季节牧事提醒', `
            <div class="season-list">
              ${DB.months.filter(m=>m.m===demoMonth).map(m=>m.tasks.map(t=>`<div class="sl-row now" style="--sl:${SEASON_COLOR[m.season]}"><span class="sl-m">${m.m}月</span><span class="sl-t">${t}</span></div>`).join('')).join('')}
            </div>
            <div class="card-note">产犊季口诀：初乳 2 小时内、犊牛舍恒温 22℃、饮水保持不冻。</div>`)}
          ${card('牧民经验库（老话新用）', `
            <div class="cold-list">
              <div class="cold-item">🌙 "牛不吃夜草不肥，圈不看夜不实" —— 冬季夜间巡圈最重要</div>
              <div class="cold-item">🧊 "冬储草，春不慌" —— 饲草备到 3 月底是底线</div>
              <div class="cold-item">🐂 "看膘定料，看天转场" —— 依据天气和体况决定补饲与转场</div>
            </div>`)}
        </div>
      </div>
    </div>`;
  }
  const logFields = [
    {name:'date', label:'日期', type:'date', value:'2026-02-16'},
    {name:'weather', label:'天气', type:'text', placeholder:'例：晴 -22℃'},
    {name:'done', label:'今天做了什么', type:'textarea', placeholder:'例：晨巡圈 3 处…'},
    {name:'plan', label:'明天计划', type:'textarea'},
    {name:'note', label:'备注', type:'textarea'}
  ];
  function afterLog(){
    // 巡栏打卡
    const list = $('#patrolList');
    if (list){
      list.querySelectorAll('.ck-item input').forEach(cb=>{
        const i = +cb.dataset.p;
        cb.checked = patrolDone.has(i);
        cb.addEventListener('change', ()=>{
          if (cb.checked) patrolDone.add(i); else patrolDone.delete(i);
          const n = patrolDone.size;
          $('#patrolProg').textContent = `已完成 ${n}/${patrolItems.length}`;
          $('#patrolNote').textContent = n === patrolItems.length ? '🎉 今日巡栏全部完成，辛苦了！' : '❄️ 冬季巡栏重点：暖棚温度、饮水槽防冻、犊羔精神状态。';
        });
      });
    }
    bindDel($('#content'));
    bindEdit($('#content'), { 'logs': { title:'编辑牧事日志', fields: logFields } });
    $('#content').querySelectorAll('[data-add="logs"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('写日志', logFields, v=>{ addRecord('logs', v); toast('日志已保存'); render(current); });
    }));
  }

  /* ================= 经营账本 ================= */
  function pageLedger(){
    const income = DB.ledger.filter(x=>x.type==='收入').reduce((a,x)=>a+x.amount,0);
    const expense = DB.ledger.filter(x=>x.type==='支出').reduce((a,x)=>a+x.amount,0);
    return `
    <div class="page">
      ${pageHeader('经营账本 · 牧户一本账', '收支明细 / 出栏收益测算 / 行情参考 / 补贴提醒', addBtn('记一笔','ledger'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'📥', label:'收入合计', value:'¥'+fmt(income), sub:'产品/牧游/补贴', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'📤', label:'支出合计', value:'¥'+fmt(expense), sub:'饲草/防疫/设备/人工', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'🏦', label:'结余', value:'¥'+fmt(income-expense), sub:'当前记录口径', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'🧾', label:'记账笔数', value:DB.ledger.length+' 笔', sub:'支持增删改', color:'#f59e0b', bg:'#fef3c7'})}
      </div>
      ${card('收支明细（可新增/编辑/删除）', tableHtml(['日期','类型','分类','项目','金额','备注','操作'],
        DB.ledger.map(x=>[x.date, pill(x.type, x.type==='收入'?'ok':'danger'), x.category, x.item,
          `<b style="color:${x.type==='收入'?'#4f46e5':'#d9534f'}">${x.type==='收入'?'+':'−'}¥${fmt(x.amount)}</b>`, x.note||'—',
          editBtn('ledger', x.id)+delBtn('ledger', x.id)])))}
      <div style="margin:0 0 18px">${addBtn('记一笔','ledger')}</div>
      <div class="grid-3">
        <div class="col2">
          ${card('出栏收益测算 · 现在卖还是再等等？', `
            <div class="calc-box">
              <div class="calc-row">
                <label><span>畜种</span><select id="calSpecies"><option>牛</option></select></label>
                <label><span>头数</span><input id="calHead" type="number" value="10"></label>
                <label><span>均重（kg）</span><input id="calWeight" type="number" value="500"></label>
                <label><span>单价（元/kg）</span><input id="calPrice" type="number" value="28"></label>
                <label><span>每头成本（元）</span><input id="calCost" type="number" value="6000"></label>
                <button class="btn solid" id="calBtn">测算</button>
              </div>
              <div class="calc-result" id="calResult">填写数据后点击「测算」查看出栏毛利。</div>
            </div>
            <div class="card-note">💡 出栏决策看三样：体重不再明显增长、价格窗口、饲草成本。育肥牛日增重＜0.6kg 就该考虑出栏。</div>`)}
        </div>
        <div class="col1">
          ${card('市场行情参考', tableHtml(['畜种','单位','价格','说明'], DB.marketPrice.map(x=>[`<b>${x.species}</b>`, x.unit, x.price, x.note])))}
          ${card('补贴与保险提醒', `
            <div class="eco-strip">
              ${DB.subsidies.map(x=>`<div class="es-item"><span>${x.icon}</span><b>${x.name}</b><i>${x.status}</i><p>${x.desc}</p></div>`).join('')}
            </div>`)}
        </div>
      </div>
      ${card('转场费用记录（可新增/删除）', tableHtml(['日期','路线','项目','金额','操作'],
        DB.migrationCosts.map(mc=>[mc.date, mc.route, mc.item, '¥'+fmt(mc.amount), delBtn('migrationCosts', mc.id)])))}
      <div style="margin:0 0 18px">${addBtn('记一笔转场费','migrationCosts')}</div>
      <div class="card-note">⛽ 一次转场少则几百、多则上千：油料、车辆费、路上饲草都要记。全年转场 4 次，合计约 ¥3,000-5,000。</div>
    </div>`;
  }
  const ledgerFields = [
    {name:'date', label:'日期', type:'date', value:'2026-02-16'},
    {name:'type', label:'类型', type:'select', options:[{v:'收入'},{v:'支出'}]},
    {name:'category', label:'分类', type:'select', options:['产品','牧游','饲草','防疫','设备','人工','保险','其他'].map(v=>({v}))},
    {name:'item', label:'项目', type:'text', required:true, placeholder:'例：冷鲜牛肉'},
    {name:'amount', label:'金额（元）', type:'number', required:true},
    {name:'note', label:'备注', type:'text'}
  ];
  function afterLedger(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'ledger': { title:'编辑账目', fields: ledgerFields } });
    $('#content').querySelectorAll('[data-add="ledger"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('记一笔', ledgerFields, v=>{
        if (!v.amount) { toast('请填写金额','warn'); return false; }
        addRecord('ledger', {...v, amount:+v.amount}); toast('已入账'); render(current);
      });
    }));
    $('#content').querySelectorAll('[data-add="migrationCosts"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('记一笔转场费', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16'},
        {name:'route', label:'路线', type:'select', options:['冬营盘→春营盘','春营盘→夏营盘','夏营盘→秋营盘','秋营盘→冬营盘'].map(v=>({v}))},
        {name:'item', label:'项目', type:'select', options:[{v:'油料'},{v:'车辆费'},{v:'路上饲草'},{v:'住宿'},{v:'其他'}]},
        {name:'amount', label:'金额（元）', type:'number', required:true},
        {name:'note', label:'备注', type:'text'}
      ], v=>{
        if (!v.amount) { toast('请填写金额','warn'); return false; }
        addRecord('migrationCosts', {...v, amount:+v.amount}); toast('转场费已记录'); render(current);
      });
    }));
    const btn = $('#calBtn');
    if (btn) btn.addEventListener('click', ()=>{
      const head = +$('#calHead').value||0, w = +$('#calWeight').value||0, p = +$('#calPrice').value||0, c = +$('#calCost').value||0;
      const revenue = head*w*p, cost = head*c, profit = revenue-cost, rate = revenue? (profit/revenue*100).toFixed(1):0;
      $('#calResult').innerHTML = `<div class="cr-line"><span>出栏收入</span><b>¥${fmt(revenue)}</b></div>
        <div class="cr-line"><span>饲养成本</span><b>¥${fmt(cost)}</b></div>
        <div class="cr-line big ${profit>=0?'ok':'bad'}"><span>预计毛利</span><b>${profit>=0?'+':'−'}¥${fmt(Math.abs(profit))}</b></div>
        <div class="cr-note">毛利率 ${rate}%${rate>0?' · 可以出栏':rate===0?' · 保本':' · 暂不建议出栏'}</div>`;
    });
  }


  /* ================= 用工管理 ================= */
  function pageLabor(){
    const on = DB.workers.filter(w=>w.status==='在岗').length;
    const pay = DB.attendance.reduce((a,x)=>a+(+x.pay||0),0);
    return `
    <div class="page">
      ${pageHeader('用工管理 · 雇人干活账目清', '雇工名单 / 考勤工钱 / 旺季用工安排', addBtn('添加雇工','workers'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🧑‍🌾', label:'在岗雇工', value:on+' 人', sub:'共 '+DB.workers.length+' 人', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'💰', label:'考勤工钱合计', value:'¥'+fmt(pay), sub:'按考勤记录实时汇总', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'📋', label:'考勤记录', value:DB.attendance.length+' 条', sub:'产犊季每日记', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'🌾', label:'旺季用工', value:'4 人', sub:'产犊季 2-4 月 · 旅游季 5-10 月', color:'#b3541e', bg:'#fbeee6'})}
      </div>
      ${card('雇工名单（可新增/编辑/删除）', tableHtml(['姓名','岗位','电话','工资','结算','状态','排班','备注','操作'],
        DB.workers.map(w=>[`<b>${w.name}</b>`, w.role, w.phone, w.wage+' 元', pill(w.wageType, w.wageType==='月薪'?'info':'warn'),
          pill(w.status, w.status==='在岗'?'ok':w.status==='休假'?'warn':'muted'),
          w.schedule, w.note||'—', editBtn('workers', w.id)+delBtn('workers', w.id)])))}
      <div style="margin:0 0 18px">${addBtn('添加雇工','workers')}</div>
      ${card('考勤工钱（可新增/删除）', tableHtml(['日期','工人','干活内容','工时','工钱','操作'],
        DB.attendance.map(a=>[a.date, a.worker, a.task, a.hours+' 小时', '¥'+fmt(a.pay), delBtn('attendance', a.id)])))}
      <div style="margin:0 0 18px">${addBtn('记考勤','attendance')}</div>
      <div class="card-note">💡 用工提醒：产犊季（2-4 月）至少 2 名技术工；工钱日结留签字/转账记录；旺季保险给临时工上一份意外险。</div>
    </div>`;
  }
  const workerFields = [
    {name:'name', label:'姓名', type:'text', required:true},
    {name:'role', label:'岗位', type:'select', options:['放牧工','产犊技术','兽医','挤奶工','牧户游服务员','厨师','司机'].map(v=>({v}))},
    {name:'phone', label:'电话', type:'text'},
    {name:'wage', label:'工资', type:'text', placeholder:'例：6000'},
    {name:'wageType', label:'结算方式', type:'select', options:[{v:'月薪'},{v:'日结'},{v:'按件'}]},
    {name:'status', label:'状态', type:'select', options:[{v:'在岗'},{v:'休假'},{v:'已离职'}]},
    {name:'schedule', label:'排班', type:'text'},
    {name:'note', label:'备注', type:'text'}
  ];
  function afterLabor(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'workers': { title:'编辑雇工', fields: workerFields } });
    $('#content').querySelectorAll('[data-add="workers"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('添加雇工', workerFields, v=>{ addRecord('workers', v); toast('雇工已添加'); render(current); });
    }));
    $('#content').querySelectorAll('[data-add="attendance"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('记考勤工钱', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16'},
        {name:'worker', label:'工人', type:'select', options: DB.workers.map(w=>({v:w.name}))},
        {name:'task', label:'干活内容', type:'text', placeholder:'例：产犊 + 巡圈'},
        {name:'hours', label:'工时', type:'number', placeholder:'小时'},
        {name:'pay', label:'工钱（元）', type:'number', required:true},
        {name:'note', label:'备注', type:'text'}
      ], v=>{
        if (!v.pay) { toast('请填写工钱','warn'); return false; }
        addRecord('attendance', {...v, hours:+v.hours||0, pay:+v.pay}); toast('考勤已记录'); render(current);
      });
    }));
  }

  /* ================= 保险理赔 ================= */
  function pageInsurance(){
    const claims = DB.insurances;
    const paying = claims.filter(x=>x.status==='已赔付');
    return `
    <div class="page">
      ${pageHeader('保险理赔 · 天灾有保险 损失有补偿', '政策性牲畜保险 · 冻死 / 狼害 / 疫病报案理赔', addBtn('新增报案','insurances'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🛡️', label:'投保范围', value:'全群 '+fmt(compute().totalAnimals)+' 头只', sub:'政策性保险 · 保费财政补贴', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'📞', label:'报案记录', value:claims.length+' 起', sub:'冻死/疫病/狼害', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'⏳', label:'理赔中', value:claims.filter(x=>x.status==='理赔中'||x.status==='已报案').length+' 起', sub:'保险员核验中', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'✅', label:'已赔付', value:paying.length+' 起', sub:'理赔金已到账', color:'#4f46e5', bg:'#eef2ff'})}
      </div>
      ${card('报案记录（可新增/编辑/删除）', tableHtml(['日期','畜种','数量','出险原因','预估损失','状态','备注','操作'],
        claims.map(x=>[x.date, x.species, x.head+' 头只', x.reason, x.est,
          pill(x.status, x.status==='已赔付'?'ok':x.status==='理赔中'?'warn':'danger'), x.note, editBtn('insurances', x.id)+delBtn('insurances', x.id)])))}
      <div style="margin:0 0 18px">${addBtn('新增报案','insurances')}</div>
      <div class="grid-3">
        <div class="col1">
          ${card('理赔流程', `
            <div class="flow-vert">
              <div class="fv"><b>1</b><span>发现损失立即报案（拍照/视频留证）</span></div>
              <div class="fv"><b>2</b><span>联系保险公司 · 报告村委/兽医</span></div>
              <div class="fv"><b>3</b><span>保险员现场核验 · 无害化处理</span></div>
              <div class="fv"><b>4</b><span>理赔材料齐全 → 赔款到账</span></div>
            </div>`)}
        </div>
        <div class="col1">
          ${card('拍照留证要点', `
            <div class="cold-list">
              <div class="cold-item">📷 现场全景 + 牲畜特写（耳标号清晰）</div>
              <div class="cold-item">⏰ 24 小时内报案，越早越好</div>
              <div class="cold-item">🧾 保留耳标、防疫记录、无害化处理单</div>
              <div class="cold-item">❄️ 冻死：注意拍摄积雪/低温现场</div>
              <div class="cold-item">🐺 狼害：拍摄伤口、足印、围栏破损</div>
            </div>`)}
        </div>
      </div>
    </div>`;
  }
  const insFields = [
    {name:'date', label:'日期', type:'date', value:'2026-02-16'},
    {name:'species', label:'畜种', type:'select', options:['牛','犊牛'].map(v=>({v}))},
    {name:'head', label:'数量', type:'number'},
    {name:'reason', label:'出险原因', type:'select', options:[{v:'冻死（白灾）'},{v:'狼害'},{v:'疫病'},{v:'其他意外'}]},
    {name:'est', label:'预估损失', type:'text', placeholder:'例：¥2,400'},
    {name:'status', label:'状态', type:'select', options:[{v:'已报案'},{v:'理赔中'},{v:'已赔付'},{v:'拒赔'}]},
    {name:'note', label:'备注', type:'textarea'}
  ];
  function afterInsurance(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'insurances': { title:'编辑报案', fields: insFields } });
    $('#content').querySelectorAll('[data-add="insurances"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增报案', insFields, v=>{ addRecord('insurances', {...v, head:+v.head||0}); toast('报案已登记'); render(current); });
    }));
  }

  /* ================= 牧场相册 ================= */
  let galFile = null;
  function ensureGalInput(){
    if (!galFile){
      galFile = document.createElement('input');
      galFile.type = 'file'; galFile.accept = 'image/*';
      galFile.style.display = 'none';
      document.body.appendChild(galFile);
    }
    return galFile;
  }
  function resizeImage(file, max, cb){
    const reader = new FileReader();
    reader.onload = e=>{
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, max/Math.max(img.width, img.height));
        const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
        const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function pageGallery(){
    return `
    <div class="page">
      ${pageHeader('牧场相册 · 每日一照', '牛群 / 草场 / 棚圈 / 设备照片存档，一年下来就是牧场影像档案', '')}
      <div class="gal-actions">
        <button class="btn solid" id="galUpload">📷 上传照片</button>
        <button class="btn ghost" id="galNote">💡 每日一照</button>
      </div>
      <div class="gal-grid">
        ${DB.photos.map(p=>`
          <div class="gal-card">
            <div class="gal-img"><img src="${p.url||p.data}" alt="${escTxt(p.title)}" loading="lazy"></div>
            <div class="gal-meta"><div class="gal-title">${escTxt(p.title)}</div><div class="gal-date">${p.date}${p.note?' · '+escTxt(p.note):''}</div></div>
            <div class="gal-del">${delBtn('photos', p.id)}</div>
          </div>`).join('')}
      </div>
      <div class="card-note">📷 建议每天拍一张：犊牛舍保温、TMR 拌料、打草、雪景……既是牧场档案，也是申报示范牧场的好材料。</div>
    </div>`;
  }
  function afterGallery(){
    bindDel($('#content'));
    const input = ensureGalInput();
    const up = $('#galUpload');
    if (up) up.addEventListener('click', ()=>input.click());
    const note = $('#galNote');
    if (note) note.addEventListener('click', ()=>toast('每日一照：拍下今天的牛群/棚圈，配一句备注','warn'));
    input.onchange = ()=>{
      const f = input.files[0]; if (!f) return;
      resizeImage(f, 720, data=>{
        try {
          addRecord('photos', { date:new Date().toISOString().slice(0,10), title:'今日一照', data, note:'' });
          toast('照片已存入牧场相册'); render(current);
        } catch(err){ toast('照片存储失败（过大），请换小一点的','warn'); }
      });
      input.value = '';
    };
  }

  /* ================= 后台管理 ================= */
  function dbCount(){
    let n = 0;
    const walk = o => {
      if (Array.isArray(o)) n += o.length;
      else if (o && typeof o === 'object') Object.values(o).forEach(walk);
    };
    walk(DB); return n;
  }
  function pageAdmin(){
    const c = compute();
    const livePort=(DB.ports||[]).find(p=>p.liveUrl||p.streamUrl);
    const gbPort=(DB.ports||[]).find(p=>/GB28181/i.test(p.protocol||''));
    const serverPort=location.port||(location.protocol==='https:'?'443':'80');
    return `
    <div class="page">
      ${pageHeader('后台管理 · 数据与权限', '数据维护 · 栏目设置 · 账号权限 · 系统日志', '')}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🗂️', label:'数据表', value:'20+ 张', sub:'牲畜/草场/装备/账本/订单', color:'#4f46e5', bg:'#eef2ff'})}
        ${statCard({icon:'🧾', label:'记录总数', value:dbCount()+' 条', sub:'可增删改 · 本机保存', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'👥', label:'账号角色', value:'4 类', sub:'场主/兽医/牧工/客服', color:'#f59e0b', bg:'#fef3c7'})}
        ${statCard({icon:'🕒', label:'系统版本', value:APP_VERSION, sub:'2026-09-19 · 伊拉特智慧牧场', color:'#64748b', bg:'#f1f5f9'})}
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('数据维护', `
            <div class="admin-actions">
              <button class="btn solid" data-admin="export">⬇️ 导出全部数据</button>
              <button class="btn ghost" data-admin="import">⬆️ 导入数据</button>
              <button class="btn ghost" data-admin="nav">✏️ 修改栏目名称</button>
              <button class="btn ghost" data-admin="reset">↺ 恢复出厂数据</button>
            </div>
            <div class="card-note">数据保存在本机浏览器；导出 JSON 可用于备份或迁移到其他设备。</div>`)}
          ${card('账号、角色权限与登录方式', tableHtml(['账号','角色','权限范围','推荐登录方式','状态'],
            [['伊拉特','场主 / 管理员','全部数据 · 栏目配置 · 端口连接 · 数据导入导出','手机号 + 密码 + 短信二次验证','<span class="pill ok">启用</span>'],
             ['吉日嘎拉','兽医','防疫 / 用药 / 繁育 / 犊牛看护','手机号验证码 + 微信小程序','<span class="pill ok">启用</span>'],
             ['巴特尔','牧工','牧事日志 / 考勤 / 草场作业 / 设备报修','微信小程序一键登录','<span class="pill ok">启用</span>'],
             ['萨仁','牧户游客服','订单 / 游客接待 / 房态 / 商品核销','微信小程序 + 手机号验证码','<span class="pill warn">旺季启用</span>']]))}
          ${card('权限与登录优化说明', `
            <div class="admin-actions">
              <span class="pill ok">菜单权限</span><span class="pill info">按钮权限</span><span class="pill warn">数据范围</span><span class="pill">操作留痕</span>
            </div>
            <div class="card-note">场主登录后进入全量驾驶舱；兽医只看到防疫、用药、繁殖和预警；牧工只看到日志、考勤、草场作业和设备报修；客服只看到文旅订单与接待。手机端优先微信小程序验证码登录，避免牧民记账号密码；员工离场后可一键停用账号。</div>`)}
          ${card('系统日志（近 4 条）', tableHtml(['时间','操作','对象','结果'],
            [['09-16 09:12','登录系统','场主 伊拉特','成功'],
             ['09-16 09:20','新增繁殖记录','产犊 4 头','成功'],
             ['09-16 09:35','上报免疫记录','犊牛腹泻疫苗 120 头份','成功'],
             ['09-16 10:02','数据导出','JSON 备份','成功']]))}
        </div>
        <div class="col1">
          ${card('端口连接配置 · 监控 / 耳标 / 农机', `
            <div class="ports">
              ${(DB.ports||[]).map(p=>`
                <div class="port-item">
                  <div class="port-head"><b>${p.kind} · ${p.name}</b>${pill(p.status, p.status==='已连接'?'ok':'warn')}</div>
                  <div class="port-body">
                    <span>协议：<b>${p.protocol}</b></span>
                    <span>地址：<code>${p.endpoint}</code></span>
                    ${p.account && p.account!=='—' ? `<span>账号：${p.account}</span>` : ''}
                    ${p.last ? `<span>最近连接：${p.last}</span>` : ''}
                  </div>
                  <div class="port-actions">
                    <button class="btn solid sm" data-port-connect="${p.id}">🔌 连接</button>
                    <button class="btn ghost sm" data-port-edit="${p.id}">✏️ 修改协议</button>
                  </div>
                </div>`).join('')}
            </div>
            <div class="card-actions"><button class="btn solid sm" data-device-scan>＋ 添加设备并自动识别</button></div>
            <div class="card-note">🔌 直接填写设备的连接协议与地址（如监控 RTSP 地址、耳标读写器 TCP 地址、农机 ISOBUS/Modbus 地址），点「连接」即完成端口对接；正式接入时替换为设备真实地址即可。</div>`)}
          ${card('牧场信息', `
            <div class="info-table">
              ${[['牧场名称', DB.meta.name],['牧场主', DB.meta.owner],['养殖方式', DB.meta.mode],['建设地点', DB.meta.location],['草场面积', fmt(DB.meta.area)+' 亩'],['开发单位', DB.meta.developer],['智慧化启动', DB.meta.smartSince+' 年']].map(([k,v])=>`<div class="info-row"><span>${k}</span><b>${v}</b></div>`).join('')}
            </div>`)}
          ${card('系统运行环境与视频服务器', `
            <div class="info-table">
              ${[
                ['当前访问地址', location.origin],
                ['当前主机/IP', location.hostname],
                ['当前端口', serverPort],
                ['安全协议', location.protocol==='https:'?'HTTPS':'HTTP（正式环境建议HTTPS）'],
                ['平台接口入口', location.origin+'/api'],
                ['监控直播网关', livePort?(livePort.liveUrl||livePort.streamUrl):'未配置'],
                ['GB28181服务器', gbPort?(gbPort.endpoint||'已配置端口'):'未配置']
              ].map(([k,v])=>`<div class="info-row"><span>${k}</span><b title="${escTxt(v)}">${escTxt(v)}</b></div>`).join('')}
            </div>
            <div class="card-note">🌐 这里显示的是当前浏览器实际访问的系统和视频网关地址。若系统部署到阿里云、腾讯云或牧场服务器，这里会自动显示对应公网IP或域名。</div>`)}
        </div>
      </div>
    </div>`;
  }
  function afterAdmin(){
    // 端口连接配置
    $('#content').querySelectorAll('[data-device-scan]').forEach(b=>b.addEventListener('click', ()=>openDeviceOnboardModal('')));
    $('#content').querySelectorAll('[data-port-connect]').forEach(b=>b.addEventListener('click', ()=>{
      const p = (DB.ports||[]).find(x=>x.id===b.dataset.portConnect); if(!p) return;
      const now = new Date().toLocaleString('zh-CN',{hour12:false});
      updateRecord('ports', p.id, { status:'已连接', last: now });
      toast(`${p.kind} 已连接（${p.protocol}）`);
      render(current);
    }));
    $('#content').querySelectorAll('[data-port-edit]').forEach(b=>b.addEventListener('click', ()=>{
      const p = (DB.ports||[]).find(x=>x.id===b.dataset.portEdit); if(!p) return;
      openModal(`修改协议 · ${p.kind}`, [
        { name:'protocol', label:'连接协议', type:'select', options:['RTSP','ONVIF','GB28181','TCP/IP','MQTT','Modbus RTU','Modbus TCP','ISOBUS','RFID 134.2kHz','北斗短报文'].map(v=>({v})), value:p.protocol },
        { name:'endpoint', label:'连接地址 / 端口', type:'text', value:p.endpoint, placeholder:'例：rtsp://192.168.1.64:554/... 或 modbus://192.168.1.90:502' },
        { name:'account', label:'账号 / 设备编号', type:'text', value:p.account||'' },
        { name:'liveUrl', label:'大屏直播地址（可选）', type:'text', value:p.liveUrl||'', placeholder:'WVP / go2rtc / HLS / WebRTC 网页地址' },
        { name:'name', label:'设备名称', type:'text', value:p.name }
      ], v=>{
        updateRecord('ports', p.id, { ...v, status:'未连接', last:'' });
        toast('协议已保存，点击「连接」即可对接');
        render(current);
      });
    }));
    const down = (name, text) => {
      const blob = new Blob([text], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
    };
    $('#content').querySelectorAll('[data-admin]').forEach(b=>b.addEventListener('click', ()=>{
      const act = b.dataset.admin;
      if (act === 'export'){ down('伊拉特智慧牧场数据-'+new Date().toISOString().slice(0,10)+'.json', JSON.stringify(DB, null, 2)); toast('数据已导出'); }
      else if (act === 'import'){
        const inp = document.createElement('input'); inp.type='file'; inp.accept='.json';
        inp.onchange = ()=>{
          const f = inp.files[0]; if(!f) return;
          const rd = new FileReader();
          rd.onload = e => {
            try { const d = JSON.parse(e.target.result); if(!d.meta) throw new Error('格式不对'); DB = d; saveDB(); toast('数据已导入'); render(current); }
            catch(err){ toast('导入失败：JSON 格式不正确','warn'); }
          };
          rd.readAsText(f);
        };
        inp.click();
      }
      else if (act === 'nav') openNavSettings();
      else if (act === 'reset') confirmDel('确定恢复出厂示例数据吗？当前录入内容将被覆盖。', ()=>{ resetData(); toast('已恢复出厂数据'); render(current); });
    }));
  }

  /* ================= 政务对接 ================= */
  const govApiSamples = {
    vaccine: `POST https://yqfk.gov-api.cn/v1/yqb/report
{
  "api": "yqb/report/immunization",
  "ranch": "YILATE-SMART-RANCH",
  "ranchCode": "1507260000001",
  "batch": "YB20260320001",
  "vaccine": "犊牛腹泻疫苗",
  "species": "牛",
  "dose": 84,
  "earTags": ["YL-0001","YL-0002"],
  "vet": "旗疫控中心",
  "time": "2026-03-20 09:32:00"
}
→ 响应：{ "code": 0, "receipt": "YB20260320001", "msg": "上报成功" }`,
    slaughter: `POST https://tzjg.gov-api.cn/v1/slaughter/batch
{
  "api": "tz/report/slaughter-batch",
  "ranch": "YILATE-SMART-RANCH",
  "batchNo": "TZ20260406018",
  "species": "牛",
  "head": 4,
  "weight": "1.4吨",
  "quarantineNo": "QZ20260406018",
  "coldChain": "-18℃",
  "trace": "一牛一码",
  "time": "2026-04-06 15:10:00"
}
→ 响应：{ "code": 0, "receipt": "TZ20260406018", "msg": "批次已备案" }`
  };
  const govSystemFields = [
    {name:'name', label:'系统名称', type:'text', required:true},
    {name:'scope', label:'对接范围', type:'text'},
    {name:'method', label:'对接方式', type:'select', options:[{v:'API 对接'},{v:'文件交换'},{v:'数据共享'}]},
    {name:'status', label:'状态', type:'select', options:[{v:'已对接'},{v:'对接中'},{v:'待申请'}]},
    {name:'freq', label:'上报频率', type:'text'},
    {name:'endpoint', label:'接口/端口', type:'text', placeholder:'例：POST https://xxx/api'},
    {name:'note', label:'备注', type:'text'}
  ];
  function pageGov(){
    const g = DB.gov;
    const done = g.systems.filter(x=>x.status==='已对接').length;
    return `
    <div class="page">
      ${pageHeader('政务对接 · 让数据多跑路 牧民少跑腿', '防疫直报 / 检疫出证 / 屠宰监管 / 耳标溯源，与旗、市、自治区监管平台一键对接', '')}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🏛️', label:'已对接系统', value:done+' 个', sub:'检疫/防疫/屠宰/溯源', color:'#0ea5e9', bg:'#e0f2fe'})}
        ${statCard({icon:'📤', label:'累计上报记录', value:g.reports.length+' 条', sub:'含防疫/出证/耳标/屠宰', color:'#0d9488', bg:'rgba(13,148,136,.12)'})}
        ${statCard({icon:'✅', label:'上报成功率', value:'100%', sub:'接口自动重试 · 回执留痕', color:'#f0b429', bg:'rgba(240,180,41,.16)'})}
        ${statCard({icon:'📋', label:'待对接', value:g.systems.filter(x=>x.status!=='已对接').length+' 个', sub:'投入品台账 / 兽药饲料监管', color:'#64748b', bg:'#f1f5f9'})}
      </div>
      ${card('上报中心 · 一键对接（演示）', `
        <div class="gov-send">
          <button class="gov-btn" data-gov="vaccine">💉 上报免疫记录</button>
          <button class="gov-btn" data-gov="quarantine">📄 申报检疫出证</button>
          <button class="gov-btn" data-gov="slaughter">🍖 上报屠宰批次</button>
          <button class="gov-btn" data-gov="tag">🏷️ 耳标备案同步</button>
        </div>
        <div class="card-note">🔌 点击按钮模拟通过政务接口自动上报，生成唯一回执号并留痕；生产环境接入后即为真实上报。</div>`)}
      ${card('上报记录（可删除）', tableHtml(['时间','目标系统','类型','业务内容','回执单号','状态','耗时','操作'],
        g.reports.map(r=>[r.time, r.target, pill(r.type,'info'), r.biz, `<code>${r.code}</code>`, pill(r.status,'ok'), r.cost, delBtn('gov.reports', r.id)])))}
      ${card('系统对接清单（可新增/编辑/删除）', tableHtml(['系统','对接范围','方式','状态','频率','接口/端口','操作'],
        g.systems.map(x=>[`<b>${x.name}</b>`, x.scope, pill(x.method, x.method==='API 对接'?'ok':'warn'),
          pill(x.status, x.status==='已对接'?'ok':x.status==='对接中'?'warn':'muted'),
          x.freq, `<span class="proto-mini">${x.endpoint}</span>`,
          editBtn('gov.systems', x.id) + delBtn('gov.systems', x.id)])))}
      <div style="margin:0 0 18px">${addBtn('新增对接系统','gov.systems')}</div>
      <div class="grid-3">
        <div class="col2">
          ${card('接口对接示例 · 防疫直报', `<pre class="code">${escTxt(govApiSamples.vaccine)}</pre>`)}
          ${card('接口对接示例 · 屠宰监管', `<pre class="code">${escTxt(govApiSamples.slaughter)}</pre>`)}
        </div>
        <div class="col1">
          ${card('对接申请流程', `
            <div class="flow-vert">
              <div class="fv"><b>1</b><span>联系旗农牧和科技局（兽医股）/ 旗疫控中心</span></div>
              <div class="fv"><b>2</b><span>申请检疫出证、疫病直报等系统账号（政务外网）</span></div>
              <div class="fv"><b>3</b><span>签订数据共享/授权协议 · 开展接口联调</span></div>
              <div class="fv"><b>4</b><span>测试环境联调 → 试运行 → 正式上线</span></div>
            </div>`)}
          ${card('对接要求与合规', `
            <div class="cold-list">
              <div class="cold-item">🏛️ 牧场须为依法备案养殖场（动物防疫条件合格证）</div>
              <div class="cold-item">🔐 政务外网专线/账号 · 加密传输 · 最小必要采集</div>
              <div class="cold-item">🧾 耳标号是唯一主键：免疫、检疫、屠宰全程挂耳标</div>
              <div class="cold-item">⏱️ 出栏提前 3 天申报检疫；屠宰批次即时备案</div>
              <div class="cold-item">🛡️ 数据授权协议明确数据范围、用途与期限</div>
            </div>`)}
        </div>
      </div>
    </div>`;
  }
  function afterGov(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'gov.systems': { title:'编辑对接系统', fields: govSystemFields } });
    $('#content').querySelectorAll('[data-add="gov.systems"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增对接系统', govSystemFields, v=>{ addRecord('gov.systems', v); toast('对接系统已新增'); render(current); });
    }));
    const defs = {
      vaccine:    { target:'动物疫病防控直报系统', type:'免疫记录上报', biz:'犊牛腹泻疫苗 · 84 头份', prefix:'YB' },
      quarantine: { target:'动物检疫电子出证', type:'检疫出证', biz:'出栏牛 4 头 · 检疫合格', prefix:'QZ' },
      slaughter:  { target:'定点屠宰监管平台', type:'屠宰批次上报', biz:'屠宰批次 · 冷鲜牛肉 1.4 吨', prefix:'TZ' },
      tag:        { target:'畜禽标识溯源系统', type:'耳标备案同步', biz:'耳标 200 枚（覆盖全场 186 头牛）', prefix:'EB' }
    };
    $('#content').querySelectorAll('[data-gov]').forEach(b=>b.addEventListener('click', ()=>{
      const d = defs[b.dataset.gov]; if (!d) return;
      confirmAction(`确认通过「${d.target}」接口上报？\n业务内容：${d.biz}\n上报后将生成回执单号并留痕。`, '确认上报', ()=>{
        const now = new Date();
        const code = d.prefix + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
        addRecord('gov.reports', { time: now.toLocaleString('zh-CN',{hour12:false}), target:d.target, type:d.type, biz:d.biz, code, status:'成功', cost:(Math.random()*0.8+0.5).toFixed(1)+'s' });
        toast(`✅ 上报成功 · 回执 ${code}`);
        render(current);
      });
    }));
  }

  /* ================= 路由 ================= */
  const pages = {
    bigscreen:  { title:'数据大屏', render:pageBigscreen, after:afterBigscreen },
    dashboard:  { title:'数据总览', render:pageDashboard, after:afterDashboard },
    log:        { title:'牧事日志', render:pageLog, after:afterLog },
    ledger:     { title:'经营账本', render:pageLedger, after:afterLedger },
    labor:      { title:'用工管理', render:pageLabor, after:afterLabor },
    insurance:  { title:'保险理赔', render:pageInsurance, after:afterInsurance },
    admin:      { title:'后台管理', render:pageAdmin, after:afterAdmin },
    gallery:    { title:'牧场相册', render:pageGallery, after:afterGallery },
    agent:      { title:'智能服务小伊', render:pageAgent, after:afterAgent },
    cycle:      { title:'四季循环', render:pageCycle, after:afterCycle },
    livestock:  { title:'养殖管理', render:pageLivestock, after:afterLivestock },
    grassland:  { title:'草场分类', render:pageGrassland, after:afterGrassland },
    forage:     { title:'饲草管理', render:pageForage, after:afterForage },
    slaughter:  { title:'屠宰加工', render:pageSlaughter, after:afterSlaughter },
    vaccine:    { title:'防疫管理', render:pageVaccine, after:afterVaccine },
    gov:        { title:'政务对接', render:pageGov, after:afterGov },
    devices:    { title:'智慧装备', render:pageDevices, after:afterDevices },
    products:   { title:'产品中心', render:pageProducts, after:afterProducts },
    tourism:    { title:'文旅牧游', render:pageTourism, after:afterTourism },
    profile:    { title:'牧场档案', render:pageProfile, after:afterProfile }
  };
  function bindPageSettings(){
    let btn = document.querySelector('[data-page-edit]');
    if (!btn){
      const host = current === 'bigscreen' ? document.querySelector('.bs-tools') : content.firstElementChild;
      if (!host) return;
      host.insertAdjacentHTML(current === 'bigscreen' ? 'afterbegin' : 'beforeend', '<button class="btn ghost sm page-edit-btn" data-page-edit>✏️ 编辑本页</button>');
      btn = document.querySelector('[data-page-edit]');
    }
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', e=>{
      e.preventDefault(); e.stopPropagation();
      const meta = pages[current] || { title: crumb.textContent || '栏目' };
      const saved = pageSetting(current);
      const sub = saved.subtitle || document.querySelector('.page-head p')?.textContent || document.querySelector('.bs-title-en')?.textContent || '';
      openModal('编辑本页 · '+meta.title, [
        {name:'title', label:'栏目标题', type:'text', value:saved.title || meta.title, required:true},
        {name:'subtitle', label:'栏目副标题 / 英文名', type:'text', value:sub}
      ], v=>{
        DB.pageSettings = DB.pageSettings || {};
        DB.pageSettings[current] = { title:(v.title||'').trim() || meta.title, subtitle:(v.subtitle||'').trim() };
        saveDB(); toast('本页标题与说明已更新'); render(current);
      });
    });
  }
  function render(name){
    current = name;
    const p = pages[name];
    const ps = pageSetting(name);
    crumb.textContent = ps.title || p.title;
    content.classList.remove('fade-in');
    content.innerHTML = p.render();
    requestAnimationFrame(()=>content.classList.add('fade-in'));
    if (p.after) p.after();
    bindPageSettings();
    renderNav();
    $('#sidebar').classList.remove('open'); $('#mask').classList.remove('show');
    window.scrollTo(0,0);
  }
  function initWeatherChip(){
    const w = DB.weather, m = DB.months[demoMonth-1];
    $('#weatherChip').innerHTML = `${w.icon} ${w.temp}℃ ${w.place} · ${m.season}季`;
    $('#noticeBadge').textContent = DB.tasks.filter(t=>t.level==='高').length;
  }
  $('#menuBtn').addEventListener('click', ()=>{ $('#sidebar').classList.add('open'); $('#mask').classList.add('show'); });
  $('#mask').addEventListener('click', ()=>{ $('#sidebar').classList.remove('open'); $('#mask').classList.remove('show'); });
  $('#settingsBtn').addEventListener('click', openNavSettings);
  /* 科技风主题切换（浅色 / 深色） */
  const THEME_KEY = 'yilate-theme';
  function applyTheme(t){
    document.body.dataset.theme = t;
    const b = $('#themeBtn');
    if (b){ b.textContent = t === 'dark' ? '☀️' : '🌙'; b.title = t === 'dark' ? '切换到科技浅色' : '切换到科技深色'; }
  }
  (function initTheme(){
    let t = 'light';
    try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch(e){}
    applyTheme(t);
  })();
  const themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', ()=>{
    const t = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, t); } catch(e){}
    applyTheme(t);
    toast(t === 'dark' ? '已切换到科技深色主题' : '已切换到科技浅色主题');
  });
  const fabBtn = $('#fabBtn');
  if (fabBtn) fabBtn.addEventListener('click', ()=>render('agent'));
  const iotChip = $('#iotChip');
  if (iotChip) iotChip.addEventListener('click', ()=>{
    live.on = !live.on;
    iotChip.textContent = live.on ? '● 实时采集' : '⏸ 采集已暂停';
    iotChip.classList.toggle('off', !live.on);
    if (live.on) { iotChip.textContent = '● 实时采集 ' + live.lastSync; }
    toast(live.on ? '已开启智能硬件实时采集' : '已暂停实时采集','warn');
  });
  window.addEventListener('ranch-cloud-data', ()=>{ renderNav(); render(current); initWeatherChip(); renderLive(); });
  initWeatherChip();
  renderNav();
  render('bigscreen');   /* 默认打开数据大屏（看板优先） */
  renderLive();
  refreshAuth();
  const userBox = document.querySelector('.user');
  if (userBox) userBox.addEventListener('click', ()=>{
    if (!authUser) return;
    confirmAction(`确认退出 ${authUser.name} 的登录吗？`, '退出登录', async ()=>{
      try { await fetch('/api/auth/logout',{method:'POST',credentials:'include'}); } catch(e){}
      try { localStorage.removeItem(AUTH_USER_KEY); } catch(e){}
      location.href='/login';
    });
  });
  startIot();
})();
