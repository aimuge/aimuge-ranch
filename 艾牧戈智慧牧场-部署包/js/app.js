/* ============ 艾牧戈智慧牧场 · 应用主逻辑 v3 ============ */
(() => {
  const $ = s => document.querySelector(s);
  const content = $('#content');
  const navBox = $('#nav');
  const crumb = $('#crumb');
  const fmt = n => Number(n).toLocaleString('zh-CN');
  const money = n => '¥' + Number(n).toLocaleString('zh-CN');
  let current = 'dashboard';
  let demoMonth = new Date().getMonth() + 1;
  const SEASON_COLOR = { '春':'#7fb069', '夏':'#3f8f4f', '秋':'#c8925a', '冬':'#5b7fa6' };
  const monthName = m => ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][m-1];

  /* ================= IoT 实时采集引擎（模拟智能硬件自动上报） ================= */
  const live = { on:true, lastSync:'—', t:DB.weather.temp, shed:24.3, sheepT:39.2, online:0, ndvi:0.74, hum:58, visitors:48 };
  let iotTimer = null;
  function liveOnline(){ return DB.deviceList.filter(x=>x.state==='在线').reduce((s,x)=>s+x.count,0); }
  live.online = liveOnline();
  function startIot(){
    if (iotTimer) clearInterval(iotTimer);
    iotTimer = setInterval(()=>{
      if (!live.on) return;
      live.t = +(DB.weather.temp + (Math.random()*0.6-0.3)).toFixed(1);
      live.shed = +(24 + Math.random()*0.8).toFixed(1);
      live.sheepT = +(39.2 + (Math.random()*0.4-0.2)).toFixed(1);
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
      wtemp: live.t+'℃', shed: live.shed+'℃', sheepT: live.sheepT+'℃',
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
  const pill = (text, cls='ok') => `<span class="pill ${cls}">${text}</span>`;
  const statCard = o => `
    <div class="stat-card">
      <div class="stat-ico" style="background:${o.bg||'#eaf4ee'};color:${o.color||'#3f8f4f'}">${o.icon}</div>
      <div class="stat-body"><div class="stat-label">${o.label}</div><div class="stat-value">${o.value}</div><div class="stat-sub">${o.sub||''}</div></div>
    </div>`;
  const card = (title, body, cls='') => `
    <div class="card ${cls}">${title?`<div class="card-head"><h3>${title}</h3></div>`:''}<div class="card-body">${body}</div></div>`;
  const tableHtml = (headers, rows) => `
    <div class="table-wrap"><table class="tbl"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const addBtn = (label, path) => `<button class="btn solid sm" data-add="${path||label}">＋ ${label}</button>`;
  const pageHeader = (title, sub, actions='') => `
    <div class="page-head"><div><h2>${title}</h2><p>${sub}</p></div><div class="page-actions">${actions}</div></div>`;
  const weatherHtml = () => {
    const w = DB.weather;
    return `<div class="weather-card">
      <div class="w-main"><span class="w-ico">${w.icon}</span><span class="w-temp">${w.temp}℃</span></div>
      <div class="w-info"><div>${w.text} · 体感 ${w.feels}℃</div><div>${w.wind} · ${w.snow}</div><div class="w-range">最高 ${w.high}℃ / 最低 ${w.low}℃</div></div>
      <div class="w-alert">⚠️ ${w.alert}</div></div>`;
  };
  const taskHtml = list => `<div class="task-list">${list.map(t=>`
      <div class="task-item"><span class="task-ico">${t.icon}</span>
        <div class="task-main"><div class="task-txt">${t.text}</div><div class="task-time">${t.time}</div></div>
        <span class="pill ${t.level==='高'?'danger':t.level==='中'?'warn':'muted'}">${t.level}</span></div>`).join('')}</div>`;

  /* ================= 导航（可配置栏目） ================= */
  function renderNav(){
    navBox.innerHTML = DB.nav.map(n=>`
      <a class="nav-item ${n.key===current?'active':''}" data-page="${n.key}">
        <span class="nav-ico">${n.icon}</span><span class="nav-title">${n.title}</span>
      </a>`).join('');
    navBox.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click', ()=>render(n.dataset.page)));
  }
  function openNavSettings(){
    openModal('栏目设置 · 每个栏目名都可以修改', DB.nav.map(n=>({ name:'t_'+n.key, label:n.icon+' '+n.title, type:'text', value:n.title })), vals=>{
      DB.nav.forEach(n=>{ const v=(vals['t_'+n.key]||'').trim(); if (v) n.title = v; });
      saveDB(); toast('栏目名称已更新'); renderNav(); render(current);
    });
  }

  /* ================= 数据大屏 ================= */
  function pageBigscreen(){
    const c = compute(), m = DB.months[demoMonth-1], se = DB.seasons.find(x=>x.key===m.season);
    return `
    <div class="bigscreen">
      <div class="bs-top">
        <div class="bs-brand">
          <img src="assets/logo.png" alt="AimuGo">
          <div><div class="bs-name">${DB.meta.name} · 智慧牧场数据大屏</div><div class="bs-en">AIMUGO SMART RANCH BIG DATA SCREEN</div></div>
        </div>
        <div class="bs-title">畜牧产业一体化 · 数据驾驶舱</div>
        <div class="bs-tools">
          <div class="bs-time" id="bsTime"></div>
          <button class="btn ghost sm bs-full" id="bsFull">⛶ 全屏</button>
        </div>
      </div>
      <div class="bs-body">
        <div class="bs-col">
          <div class="bs-panel">
            <div class="bsp-title">🐄 牲畜存栏（头只）</div>
            <div class="bsp-big">${fmt(c.totalAnimals)}</div>
            <div id="bsStock" class="bs-chart"></div>
          </div>
          <div class="bs-panel">
            <div class="bsp-title">📡 智慧装备在线率</div>
            <div id="bsGauge" class="bs-chart center"></div>
            <div class="bsp-sub">在线 ${fmt(c.devOnline)} / ${fmt(c.devTotal)} 台 · 成套装备 ${fmt(c.kit)} 台套</div>
          </div>
        </div>
        <div class="bs-col bs-mid">
          <div class="bs-panel bs-season">
            <div class="bsp-title">🍃 当前：${monthName(demoMonth)} · ${m.season}季 · ${m.name}</div>
            <div class="bs-season-name" style="color:${se.color}">${m.season}季</div>
            <div class="bs-season-focus">${se.focus}</div>
            <div class="year-cycle bs-yc">
              ${DB.months.map((mm,i)=>`<div class="yc-cell ${i===demoMonth-1?'now':''}" style="--yc:${SEASON_COLOR[mm.season]}" data-m="${i+1}">${mm.m}</div>`).join('')}
            </div>
            <div class="bs-tasks">
              ${m.tasks.map(t=>`<div class="bs-task"><span>◆</span>${t}</div>`).join('')}
            </div>
          </div>
          <div class="bs-panel">
            <div class="bsp-title">🌾 草场利用（亩）</div>
            <div id="bsPasture" class="bs-chart"></div>
          </div>
        </div>
        <div class="bs-col">
          <div class="bs-panel">
            <div class="bsp-title">💰 今日经营</div>
            <div class="bs-rows">
              <div class="bs-row"><span>牧游订单</span><b>${c.todayOrders} 单</b></div>
              <div class="bs-row"><span>今日游客</span><b data-live="visitors">48 人</b></div>
              <div class="bs-row"><span>设备在线</span><b data-live="online">${fmt(liveOnline())} 台</b></div>
              <div class="bs-row"><span>产品销售收入</span><b>${money(c.saleAmount)}</b></div>
              <div class="bs-row"><span>本季出栏屠宰</span><b>${c.slHead} 头只</b></div>
              <div class="bs-row"><span>饲草储备</span><b>${c.foragePct}%</b></div>
              <div class="bs-row"><span>草畜平衡</span><b>${DB.grassland.balance.rate}%</b></div>
            </div>
          </div>
          <div class="bs-panel bs-weather">
            <div class="bsp-title">🌦️ ${DB.weather.place}</div>
            <div class="bs-w-main"><span>${DB.weather.icon}</span><b>${DB.weather.temp}℃</b></div>
            <div class="bs-w-info">${DB.weather.text} · ${DB.weather.wind} · ${DB.weather.snow}</div>
            <div class="bs-w-alert">⚠️ ${DB.weather.alert}</div>
          </div>
          <div class="bs-panel bs-ticker">
            <div class="bsp-title">🔔 实时预警</div>
            <div class="bs-ticker-list">
              ${DB.tasks.map(t=>`<div class="bs-tick"><span class="pill ${t.level==='高'?'danger':'warn'}">${t.level}</span>${t.text}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="bs-foot">
        <div class="bs-flow">
          ${['🌱 种草养地','🐑 四季轮牧','🌾 打草储备','🍼 繁殖育肥','🍖 出栏屠宰','🛍️ 产品品牌','🏕️ 牧户文旅','💰 反哺草场'].map((x,i)=>`<span>${x}</span>${i<7?'<i>→</i>':''}`).join('')}
        </div>
        <div class="bs-copy">© 2026 内蒙古艾牧戈数智科技有限公司 · ${DB.meta.location} · 数据实时更新</div>
      </div>
      <svg class="bs-silhouette" viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 70 C 180 30 360 85 560 60 S 900 15 1120 55 S 1360 90 1440 60 L1440 120 L0 120 Z" fill="rgba(255,255,255,.05)"/>
        <path d="M0 92 C 240 60 480 100 760 82 S 1180 62 1440 88 L1440 120 L0 120 Z" fill="rgba(255,255,255,.08)"/>
      </svg>
    </div>`;
  }
  function afterBigscreen(){
    Charts.donut($('#bsStock'), { size:150, thickness:20, centerValue:fmt(compute().totalAnimals), centerTitle:'存栏',
      segments: DB.species.map(x=>({ label:x.name, value:x.count, color:x.color })) });
    Charts.gauge($('#bsGauge'), { value: compute().devRate, label:'设备在线率', color:'#57a464', size:170 });
    Charts.bars($('#bsPasture'), {
      labels:['冬·东','冬·南','夏·北','夏·西','秋·高草','春·返青'],
      series:[{ name:'载畜量利用率 %', color:'#ffd98a', values:[78,72,58,0,0,0] }],
      height:170, yFormat:v=>Math.round(v)+'%' });
    $('#content').querySelectorAll('.bs-yc .yc-cell').forEach(c=>c.addEventListener('click', ()=>{ demoMonth=+c.dataset.m; render(current); }));
    const fs = $('#bsFull');
    if (fs) fs.addEventListener('click', ()=>{
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    });
    const tick = ()=>{
      const el = $('#bsTime'); if (el){
        const d = new Date();
        el.textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
      }
    };
    tick(); setInterval(tick, 1000);
  }

  /* ================= 数据总览 ================= */
  function pageDashboard() {
    const c = compute(), m = DB.months[demoMonth-1], se = DB.seasons.find(x=>x.key===m.season);
    const vaccineDone = DB.vaccineRecords.filter(r=>r.status==='完成').length;
    return `
    <div class="page">
      <div class="hero-banner">
        <div class="hero-txt">
          <h2>${monthName(demoMonth)} · ${m.season}季（${m.name}）</h2>
          <p>${DB.meta.slogan}</p>
        </div>
        <div class="hero-badges">
          <div class="hero-badge">今日值班：满都拉 · 兽医</div>
          <div class="hero-badge">演示月份：${demoMonth}月 · ${m.season}季</div>
        </div>
      </div>
      <div class="kpi-grid">
        ${statCard({icon:'🐄', label:'牲畜存栏', value:fmt(c.totalAnimals)+' 头只', sub:'牛1,286 · 羊8,540 · 马320 · 驼86', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🌾', label:'草场面积', value:fmt(DB.meta.area)+' 亩', sub:'放牧 '+fmt(DB.meta.grazingArea)+' · 打草 '+fmt(DB.meta.hayArea), color:'#7a5230', bg:'#f5efe6'})}
        ${statCard({icon:'🧊', label:'饲草储备', value:c.foragePct+'%', sub:'干草 420/500 吨 · 备战寒冬', color:'#5b7fa6', bg:'#eaf0f7'})}
        ${statCard({icon:'📡', label:'智慧装备在线', value:c.devRate+'%', sub:'在线 '+fmt(c.devOnline)+'/'+fmt(c.devTotal)+' · 成套 '+fmt(c.kit)+' 台套', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'🍖', label:'本季出栏屠宰', value:c.slHead+' 头只', sub:'检疫合格率 100%', color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'🛍️', label:'产品销售收入', value:money(c.saleAmount), sub:'冷鲜肉/奶食/绒品/文创', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'🏕️', label:'牧游订单', value:c.todayOrders+' 单', sub:'今日游客 48 人 · 评分 4.9', color:'#8a5a9e', bg:'#f3edf7'})}
        ${statCard({icon:'⚖️', label:'草畜平衡', value:c.sheepUnits.toLocaleString()+' 羊单位', sub:'安全线内 '+DB.grassland.balance.rate+'%', color:'#3f8f4f', bg:'#eaf4ee'})}
      </div>
      <div class="live-strip">
        <div class="ls-title">● 实时采集 <small>智能硬件自动上报 · 无需人工录入</small></div>
        <div class="ls-chips">
          <span>🐑 羊均体温 <b data-live="sheepT">39.2℃</b></span>
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
          ${card('今日天气 · 陈巴尔虎旗', weatherHtml())}
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
      series:[{ name:'存栏', color:'#3f8f4f', values:[9464,9588,9708,9824,9916,9996,10060,10108,10144,10176,10204,10232] }],
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
      ${pageHeader('四季循环生产 · 全年生产模拟', '从接羔到出栏、从打草到牧游，一个家庭牧场的完整年度循环', `
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
                ['🍼','繁殖饲养','接羔产犊 · 暖棚越冬'],
                ['⚖️','育肥管理','称重分群 · 智能补饲'],
                ['🍖','出栏屠宰','定点屠宰 · 检疫合格'],
                ['📦','产品加工','分割冷藏 · 品牌销售'],
                ['💰','经营反哺','收入投入草场与设备']
              ].map(([ico,tt,dd],i)=>`
                <div class="flow-node ${i===7?'loop':''}">
                  <div class="fn-ico">${ico}</div><div class="fn-name">${tt}</div><div class="fn-desc">${dd}</div>
                </div>${i<7?'<div class="flow-arrow">→</div>':''}`).join('')}
            </div>
            <div class="card-note">💡 一年四季闭环：春接羔防疫 → 夏轮牧打草 → 秋防疫出栏 → 冬补饲牧游，收入反哺草场与智慧装备，草原越养越好。</div>`)}
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
    <div class="page">
      ${pageHeader('养殖管理', '四畜分群 · 电子档案 · 繁殖动态 · 智能监测', addBtn('登记牲畜个体'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🐾', label:'总存栏', value:fmt(c.totalAnimals)+' 头只', sub:'羊单位 '+fmt(c.sheepUnits), color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🏷️', label:'电子耳标覆盖率', value:'98.8%', sub:'全群 10,232 头只', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'🍼', label:'本年度繁殖', value:'3,344 头只', sub:'接羔2,860 · 产犊402 · 驹64 · 驼羔18', color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'💉', label:'免疫率', value:'96.8%', sub:'春秋两防 · 应免尽免', color:'#7a5230', bg:'#f5efe6'})}
      </div>
      <div class="card">
        <div class="card-head split"><h3>畜群分类</h3>
          <div class="tabs" id="speciesTabs">
            <button class="tab active" data-key="all">全部</button>
            ${DB.species.map(x=>`<button class="tab" data-key="${x.key}">${x.emoji} ${x.name}</button>`).join('')}
          </div>
        </div>
        <div class="species-grid" id="speciesGrid"></div>
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('繁殖与接羔记录', tableHtml(['日期','畜种','事项','成活率','负责人','备注'],
            DB.birthRecords.map(r=>[r.date, r.species, r.item, r.survival, r.operator, r.note])) + `
            <div style="margin-top:12px"><button class="btn solid sm" data-modal="birth">＋ 新增繁殖记录</button></div>`)}
          ${card('个体档案（可登记/删除）', tableHtml(['耳标号','畜种','品种','性别','年龄','体重','健康','位置','体温','设备','操作'],
            DB.animals.map(a=>[`<code>${a.id}</code>`, a.species, a.breed, a.sex, a.age, a.weight,
              pill(a.health, a.health==='健康'?'ok':a.health==='发情预警'?'danger':'warn'),
              a.location, a.temp, `<span class="dev-on">${a.device}</span>`, delBtn('animals', a.id)])))}
          <div style="margin-top:12px">${addBtn('登记牲畜个体')}</div>
        </div>
        <div class="col1">
          ${card('分群管理', tableHtml(['畜群','存栏','状态'], DB.groups.map(g=>[`<b>${g.name}</b>`, fmt(g.count)+' 头只', pill(g.status, g.status==='正常'?'ok':'warn')])))}
          ${card('今日繁殖关注', `
            <div class="mini-alerts">
              <div class="ma-item"><span>🐂</span><div><b>1 头发情预警</b><p>AN-10234 · 今日 14:00 配种</p></div></div>
              <div class="ma-item"><span>🐑</span><div><b>5 只母羊待产</b><p>产羔暖棚 2 号 · 温度 24℃</p></div></div>
              <div class="ma-item"><span>🐴</span><div><b>马群繁殖记录</b><p>本季配种 12 匹 · 受胎率 91%</p></div></div>
            </div>`)}
        </div>
      </div>
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
  function afterLivestock(){
    renderSpeciesGrid();
    $('#speciesTabs').addEventListener('click', e=>{
      const b = e.target.closest('.tab'); if (!b) return;
      speciesKey = b.dataset.key;
      document.querySelectorAll('#speciesTabs .tab').forEach(x=>x.classList.toggle('active', x===b));
      renderSpeciesGrid();
    });
    bindDel($('#content'));
    $('#content').querySelectorAll('[data-add="登记牲畜个体"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('登记牲畜个体', [
        {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
        {name:'breed', label:'品种', type:'text', value:'呼伦贝尔羊'},
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
        {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
        {name:'item', label:'事项', type:'text', placeholder:'例：接羔 100 只', required:true},
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
        ${statCard({icon:'🌾', label:'草场总面积', value:fmt(g.total)+' 亩', sub:'放牧 '+fmt(g.grazing)+' · 打草 '+fmt(g.hay), color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🧭', label:'生态类型', value:gt.length+' 类', sub:'分类经营 · 精准管护', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'⚖️', label:'载畜量使用率', value:g.balance.rate+'%', sub:'羊单位 '+fmt(g.balance.actual)+' / '+fmt(g.balance.capacity), color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'🛡️', label:'休牧/禁牧地块', value:g.pastures.filter(p=>p.util===0&&p.usage==='放牧场').length+' 块', sub:'返青保护 + 留茬休牧', color:'#7a5230', bg:'#f5efe6'})}
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
          ${card('地块台账（可新增/编辑/删除）', tableHtml(['地块','生态类型','利用方式','面积','载畜(羊单位)','草高','状态','操作'],
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
    {name:'su', label:'载畜量（羊单位）', type:'number'},
    {name:'height', label:'牧草高度', type:'text', placeholder:'例：28cm'},
    {name:'status', label:'状态', type:'text', placeholder:'例：轮牧中'},
    {name:'util', label:'利用率 %', type:'number'}
  ];
  function afterGrassland(){
    Charts.gauge($('#chGB'), { value: DB.grassland.balance.rate, label:'载畜量使用率', sub:'安全线 90%', color:'#3f8f4f' });
    Charts.line($('#chNdvi'), { labels:['3月','4月','5月','6月','7月','8月','本周'],
      series:[{ name:'NDVI', color:'#3f8f4f', values:DB.grassland.ndvi.trend }],
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
        ${statCard({icon:'🌾', label:'打草场', value:fmt(DB.meta.hayArea)+' 亩', sub:'年产干草约 980 吨', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'🧊', label:'饲草储备', value:compute().foragePct+'%', sub:'总库存 / 总目标', color:'#5b7fa6', bg:'#eaf0f7'})}
        ${statCard({icon:'📦', label:'库存品类', value:inv.length+' 类', sub:'干草 · 青贮 · 精料 · 舔砖', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'❄️', label:'冬季补饲', value:'已启动', sub:'12月-3月 · 每日定时投喂', color:'#2e86ab', bg:'#e8f3f8'})}
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
                <div class="hbar-track"><div class="hbar-fill" style="width:${Math.round(x.stock/x.target*100)}%;background:${x.stock/x.target>=0.8?'#c8925a':x.stock/x.target>=0.6?'#8a9a5b':'#d9534f'}"></div></div></div>`).join('')}
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
        ${statCard({icon:'🍖', label:'已屠宰（本季）', value:sl.reduce((a,r)=>a+r.head,0)+' 头只', sub:'牛10 · 羊180', color:'#b3541e', bg:'#fbeee6'})}
        ${statCard({icon:'✅', label:'检疫合格率', value:'100%', sub:'旗动物检疫所出证', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'❄️', label:'冷库容量', value:'40 吨', sub:'-18℃ 冻库 · 0-4℃ 排酸间', color:'#5b7fa6', bg:'#eaf0f7'})}
        ${statCard({icon:'📋', label:'出栏计划', value:sp.reduce((a,x)=>a+x.head,0)+' 头只', sub:'秋冬季（10-12月）', color:'#c8925a', bg:'#fbf3e4'})}
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
        {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
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
        ${statCard({icon:'💉', label:'免疫程序', value:DB.vaccinePlans.length+' 项', sub:'口蹄疫 · 小反刍 · 炭疽等', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'✅', label:'已完成记录', value:done+' 项', sub:'共 '+vr.length+' 条防疫台账', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🧴', label:'消毒作业', value:ds.length+' 次', sub:'圈舍 · 暖棚 · 屠宰车间', color:'#7a5230', bg:'#f5efe6'})}
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
              <div class="cold-item">🧴 每周圈舍消毒 1 次 · 接羔前后重点消毒</div>
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
        {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
        {name:'group', label:'群体', type:'text', placeholder:'例：全群 / 羔羊'},
        {name:'vaccine', label:'疫苗/项目', type:'select', options:['口蹄疫 O 型','口蹄疫 A 型','羊三联四防','小反刍兽疫','炭疽','布病监测','出栏前检疫'].map(v=>({v}))},
        {name:'dose', label:'剂量', type:'text', placeholder:'例：1,200 头份'},
        {name:'operator', label:'操作人', type:'text'},
        {name:'status', label:'状态', type:'select', options:[{v:'完成'},{v:'计划中'}]}
      ], v=>{ addRecord('vaccineRecords', v); toast('防疫记录已保存'); render(current); });
    }));
    const medBtn = $('#content').querySelector('[data-modal="med"]');
    if (medBtn) medBtn.addEventListener('click', ()=>{
      openModal('登记用药（含休药期）', [
        {name:'date', label:'日期', type:'date', value:'2026-02-16'},
        {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
        {name:'group', label:'群体', type:'text', placeholder:'例：育肥羊 60 只'},
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

  /* ================= 智慧装备 ================= */
  const deviceFields = [
    {name:'name', label:'设备名称', type:'text', required:true},
    {name:'cat', label:'装备分类', type:'select', options: DB.deviceCats.map(c=>({v:c.id, t:c.name}))},
    {name:'model', label:'品牌/型号', type:'text'},
    {name:'count', label:'数量', type:'number'},
    {name:'where', label:'安装位置', type:'text'},
    {name:'state', label:'运行状态', type:'select', options:[{v:'在线'},{v:'离线'},{v:'检修'}]},
    {name:'protocol', label:'对接协议/端口', type:'text', placeholder:'例：ONVIF / RTSP · LoRa · Modbus'},
    {name:'battery', label:'供电/电量', type:'text'},
    {name:'last', label:'最近上报', type:'text'}
  ];
  function pageDevices() {
    const c = compute();
    return `
    <div class="page">
      ${pageHeader('智慧装备 · 全系统一张网', 'AI 识别 · 电子标识 · 无人设备 · 农机机械 · 棚圈设施 · 网关供电，全部接入一个系统', addBtn('新增装备', 'deviceList'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'📡', label:'联网终端', value:fmt(c.devTotal)+' 台', sub:'含耳标/项圈/终端', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'🟢', label:'设备在线率', value:c.devRate+'%', sub:'在线 '+fmt(c.devOnline)+' 台', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🔴', label:'离线/检修', value:fmt(c.devOffline)+' 台', sub:'电子哨兵 4 · 清粪机器人 2', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'🔌', label:'成套装备', value:fmt(c.kit)+' 台套', sub:'6 大分类 · 农机/棚圈/无人设备', color:'#c8925a', bg:'#fbf3e4'})}
      </div>
      ${card('数据自动采集 · 智能硬件自动上报链路', `
        <div class="iot-pipe">
          ${[['📡','感知层','传感器/摄像头/项圈/耳标'],['📶','传输层','LoRa · 4G · 北斗短报文'],['🧠','平台层','AI 解析 · 清洗 · 规则引擎'],['📺','应用层','大屏 · 手机 · 预警中心']].map((x,i)=>`
            <div class="pipe-node"><span>${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></div>${i<3?'<i>→</i>':''}`).join('')}
        </div>
        <div class="card-note">🔌 生产环境：硬件设备通过标准协议实时上报 → 平台 API 入库 → 数据大屏/手机端自动更新，全程无需人工录入。演示版已内置实时采集引擎，以下指标每 ${(DB.iot.interval/1000)} 秒自动刷新。</div>`)}
      ${card('自动采集指标 · 数据来源', tableHtml(['指标','来源设备','协议/端口','采集频率'],
        DB.iot.sources.map(s=>[s.metric, s.device, `<span class="proto-mini">${s.protocol}</span>`, pill(s.freq,'info')])))}
      ${card('端口对接 · 市场主流设备全兼容', `
        <div class="proto-row">
          ${[
            ['🎥','视频监控','海康威视 / 大华 · ONVIF / RTSP / GB28181'],
            ['🏷️','电子标识','RFID 134.2kHz / UHF 920M · 耳标读写器'],
            ['🛰️','定位导航','北斗 / GPS · 4G · 北斗短报文'],
            ['🛸','无人设备','大疆无人机 · 宇树机器人 · 自主导航'],
            ['🚜','农机装备','ISOBUS / CAN 总线 · 北斗作业监测'],
            ['🏠','棚圈环控','Modbus / PLC · 温度/氨气/饮水'],
            ['📶','组网传输','LoRaWAN / 4G/5G / 太阳能供电'],
            ['🧠','AI 平台','行为识别 · 明火烟雾 · 周界入侵算法']
          ].map(x=>`<div class="proto-item"><span>${x[0]}</span><div><b>${x[1]}</b><p>${x[2]}</p></div></div>`).join('')}
        </div>
        <div class="card-note">🔌 平台提供标准数据接口（API/协议适配层），市场上符合 ONVIF、GB28181、LoRaWAN、Modbus、ISOBUS、北斗短报文等标准的设备均可即插即用接入。</div>`)}
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
      ${card('装备台账（可新增/编辑/删除）', tableHtml(['设备名称','分类','品牌/型号','数量','位置','状态','对接协议','供电','操作'],
        DB.deviceList.map(d=>[
          `<b>${d.name}</b>`,
          `<span class="cat-tag" style="--cc:${(DB.deviceCats.find(x=>x.id===d.cat)||{}).color||'#8a9a5b'}">${(DB.deviceCats.find(x=>x.id===d.cat)||{}).name||d.cat}</span>`,
          `<code>${d.model}</code>`, fmt(d.count)+' 台', d.where,
          pill(d.state, d.state==='在线'?'ok':d.state==='离线'?'danger':'warn'),
          `<span class="proto-mini">${d.protocol}</span>`, d.battery,
          editBtn('deviceList', d.id) + delBtn('deviceList', d.id)
        ])))}
    </div>`;
  }
  function afterDevices(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'deviceList': { title:'编辑装备', fields: deviceFields } });
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
        ${statCard({icon:'🛍️', label:'在售品类', value:inv.length+' 类', sub:'6 大产品线', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'💰', label:'累计销售收入', value:money(sales), sub:'按销售记录实时汇总', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'🧾', label:'销售/入库记录', value:pr.length+' 条', sub:'屠宰入库自动联动', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'📱', label:'溯源', value:'一品一码', sub:'批次 → 耳标 → 草场可查', color:'#8a5a9e', bg:'#f3edf7'})}
      </div>
      <div class="card">
        <div class="card-head"><h3>产品库存</h3></div>
        <div class="prod-stock">
          ${inv.map(x=>`<div class="ps-item"><div class="ps-ico">${x.name.includes('肉')?'🥩':x.name.includes('奶')||x.name.includes('奶酪')?'🧀':x.name.includes('绒')?'🧣':x.name.includes('羊毛')?'🧶':'🎁'}</div>
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
    <div class="page">
      ${pageHeader('文旅牧游', '牧户游 · 全季运营：蒙古包 / 骑马 / 研学 / 冰雪那达慕', addBtn('新增订单'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🎫', label:'今日订单', value:t.orders.length+' 单', sub:'待接待 1 单', color:'#8a5a9e', bg:'#f3edf7'})}
        ${statCard({icon:'👨‍👩‍👧', label:'今日游客', value:'48 人', sub:'亲子 2 团 · 散客 5 组', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'💰', label:'近 7 日收入', value:'¥1.27 万', sub:'住宿 40% · 体验 35% · 餐饮 25%', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'⭐', label:'游客评分', value:'4.9 分', sub:'近 30 天 128 条评价', color:'#2e86ab', bg:'#e8f3f8'})}
      </div>
      <div class="grid-3">
        <div class="col2">${card('近 7 日牧游收入', `<div id="chRev" class="chart-box"></div>`)}</div>
        <div class="col1">${card('蒙古包 / 毡房', `
          <div class="yurt-list">${t.yurts.map(y=>`<div class="yurt-item"><div class="yurt-top"><span>⛺ ${y.name}</span>${pill(y.status, y.status==='营业中'?'ok':'muted')}</div><div class="yurt-fac">${y.fac}</div></div>`).join('')}</div>
          <div class="card-note">❄️ 冬季全屋地暖 + 火墙，室内恒温 22℃。</div>`)}</div>
      </div>
      ${card('旅游产品 · 全季运营', `
        <div class="prod-grid">${t.products.map(p=>`
          <div class="prod-card"><div class="prod-ico">${p.icon}</div><div class="prod-name">${p.name}</div>
          <div class="prod-desc">${p.desc}</div><div class="prod-foot"><span class="prod-price">${p.price}</span><span class="prod-season">${p.season}</span></div></div>`).join('')}</div>`)}
      ${card('民俗节庆日历 · 四季活动（可新增/编辑/删除）', tableHtml(['时间','活动','地点','类型','状态','说明','操作'],
        DB.hulunbuir.events.map(e=>[e.date, `<b>${e.name}</b>`, e.place,
          pill(e.type, e.type==='那达慕'?'danger':e.type==='冰雪'?'info':'warn'),
          pill(e.status, e.status==='筹备'?'warn':'muted'), e.note,
          editBtn('hulunbuir.events', e.id) + delBtn('hulunbuir.events', e.id)])) + `
        <div style="margin-top:12px">${addBtn('新增节庆活动','hulunbuir.events')}</div>`)}
      <div class="grid-3">
        <div class="col2">${card('订单管理（可新增/删除）', tableHtml(['订单号','项目','游客','时间','金额','状态','操作'],
          t.orders.map(o=>[`<code>${o.id}</code>`, o.item, o.guest, o.date, o.amount,
            pill(o.status, o.status==='已付款'?'ok':o.status==='已确认'?'info':'warn'), delBtn('tourism.orders', o.id)])))}
          <div style="margin-top:12px">${addBtn('新增订单')}</div>
        </div>
        <div class="col1">
          ${card('安全保障', `<div class="cold-list"><div class="cold-item">🛡️ ${t.safety}</div>
            <div class="cold-item">🚑 与镇卫生院 18km 急救联动 · 救援车 2 台</div>
            <div class="cold-item">🧭 全部向导持证 · 骑乘线路投保</div></div>`)}
          ${card('四季旅游路线', `
            <div class="season-list">
              ${[['春','草原苏醒 · 接羔研学','4-5月'],['夏','绿海深处 · 深度游牧','6-8月'],['秋','金色草原 · 打草体验','9-10月'],['冬','雪原秘境 · 冰雪那达慕','11-2月']].map(x=>`
                <div class="sl-row" style="--sl:${SEASON_COLOR[x[0]]}"><span class="sl-m">${x[0]}</span><span class="sl-t">${x[1]}（${x[2]}）</span></div>`).join('')}
            </div>`)}
        </div>
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
      series:[{ name:'收入', color:'#c8925a', values:[3260,4180,5230,6110,7480,8920,12680] }],
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
    return `
    <div class="page">
      <div class="ranch-hero">
        <div class="rh-inner">
          <div class="rh-logo"><img src="assets/logo.png" alt="AimuGo"></div>
          <div class="rh-name">${r.name}</div>
          <div class="rh-en">${r.nameEn} · 新一代家庭牧场</div>
          <div class="rh-loc">📍 ${r.location}</div>
          <div class="rh-chips">${['🐄 养殖','🌾 草场','📡 智慧装备','🍖 屠宰加工','🧀 产品中心','🏕️ 牧户游'].map(x=>`<span>${x}</span>`).join('')}</div>
        </div>
      </div>
      <div class="grid-3">
        <div class="col2">
          ${card('牧场简介', `
            <p class="prose">${r.name}位于呼伦贝尔草原核心区，${r.founded} 年由牧民巴特尔一家创办，形成<strong>「养殖 + 草场 + 饲草 + 屠宰 + 防疫 + 产品 + 文旅」</strong>一体化的新一代家庭牧场经营模式。${r.smartSince} 年起全面接入物联网与 AI，用一台手机管理 ${fmt(r.area)} 亩草场、10,000 余头只牲畜与 ${fmt(compute().devTotal)} 台联网终端。</p>
            <p class="prose">牧场坚持<strong>草畜平衡、以草定畜、四季循环</strong>：春季接羔防疫、夏季轮牧打草、秋季出栏储备、冬季补饲牧游，全年循环闭环、草原越养越好。</p>
            <div class="honor-row">${['呼伦贝尔市智慧牧场示范点','陈旗乡村振兴示范家庭牧场','自治区级家庭牧场示范场','绿色畜产品认证基地'].map(h=>`<span class="honor">🏅 ${h}</span>`).join('')}</div>`)}
          ${card('智慧化建设历程', `
            <div class="timeline">
              ${[['1998','三代传承','家庭牧场起步 · 传统四季转场'],['2016','规模经营','草场确权 30,000 亩 · 打草场与饲草库'],['2020','智慧牧场 1.0','GPS 项圈 / 电子耳标 / 气象站'],['2022','智慧牧场 2.0','电子围栏 / 无人机 / 防冻饮水'],['2024','牧旅融合','牧户游小程序 · 冬季冰雪那达慕'],['2026','AI 一体化平台','AI 识别 · 无人设备 · 六业一体全打通']].map(([y,tt,dd],i)=>`
                <div class="tl-item"><div class="tl-dot ${i===5?'now':''}"></div><div class="tl-year">${y}</div><div class="tl-body"><b>${tt}</b><p>${dd}</p></div></div>`).join('')}
            </div>`)}
        </div>
        <div class="col1">
          ${card('牧场档案卡', `
            <div class="info-table">
              ${[['牧场名称', r.name], ['牧场主', r.owner], ['行政区划', '呼伦贝尔市 · 陈巴尔虎旗'], ['坐标', r.gps], ['草场面积', fmt(r.area)+' 亩（放牧 '+fmt(r.grazingArea)+' / 打草 '+fmt(r.hayArea)+'）'], ['气候特点', r.climate], ['成立年份', r.founded+' 年'], ['智慧化启动', r.smartSince+' 年']].map(([k,v])=>`<div class="info-row"><span>${k}</span><b>${v}</b></div>`).join('')}
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
              <div class="cold-item">🌾 冬储饲草至 3 月底 · 干草 420 吨 + 青贮 180 吨</div>
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


  /* ================= 畜牧业智能体 ================= */
  const agentMsgs = [ {role:'bot', text:'你好，我是「艾牧戈」畜牧业智能体 🤖\n我可以基于牧场实时数据回答：存栏、饲草、防疫、屠宰、产品、牧游、设备、转场、天气预警等问题，并给出寒冷地区饲养建议。试试下面的快捷问题，或直接打字问我。'} ];
  const escTxt = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function msgHtml(m){
    return `<div class="am ${m.role==='user'?'user':'bot'}"><div class="am-ava">${m.role==='user'?'🧑':'🤖'}</div><div class="am-bubble">${escTxt(m.text).replace(/\n/g,'<br>')}</div></div>`;
  }
  function agentReply(q){
    const c = compute(), m = DB.months[demoMonth-1];
    const has = (...ks)=>ks.some(k=>q.includes(k));
    if (has('存栏','多少头','牲畜','有几','结构') && !has('转场')){
      return `📊 当前存栏 ${fmt(c.totalAnimals)} 头只（折合羊单位 ${fmt(c.sheepUnits)}）\n🐂 牛 ${fmt(DB.species[0].count)} · 🐑 羊 ${fmt(DB.species[1].count)} · 🐴 马 ${fmt(DB.species[2].count)} · 🐫 骆驼 ${fmt(DB.species[3].count)}\n繁殖季：本年度接羔 2,860 · 产犊 402 · 马驹 64 · 驼羔 18，成活率 97.6%。`;
    }
    if (has('饲草','过冬','储备','干草','青贮','饲料')){
      const inv = DB.forageInventory.map(x=>`· ${x.name} ${x.stock}/${x.target}${x.unit}`).join('\n');
      return `🧊 饲草储备整体 ${c.foragePct}%\n${inv}\n❄️ 寒冷地区提示：冬储须覆盖至 3 月底，当前干草 420/500 吨，3 月缺口约 80 吨，建议 9 月打草季补足或提前采购。`;
    }
    if (has('设备','在线率','离线','装备','项圈','耳标','监控','无人机','机器人')){
      return `📡 联网终端 ${fmt(c.devTotal)} 台，在线率 ${c.devRate}%（在线 ${fmt(c.devOnline)} 台）\n成套装备 ${fmt(c.kit)} 台套 · 离线/检修 ${fmt(c.devOffline)} 台（电子哨兵 4、清粪机器人 2）\n已派巡检工单，1 小时内响应。`;
    }
    if (has('防疫','疫苗','口蹄疫','免疫','布病','驱虫','炭疽')){
      return `💉 年度免疫程序 ${DB.vaccinePlans.length} 项：春秋两防，含口蹄疫（O/A 型）、羊三联四防、小反刍兽疫、炭疽、布病监测。\n已完成记录 ${DB.vaccineRecords.filter(r=>r.status==='完成').length} 条，免疫率 96.8%。\n口蹄疫防控要点：新购牲畜隔离 21 天、圈舍每周消毒、发现口蹄水疱立即上报旗疫控中心。`;
    }
    if (has('屠宰','出栏','检疫','杀')){
      const sl = DB.slaughterRecords.reduce((a,r)=>a+r.head,0);
      return `🍖 本季已屠宰 ${sl} 头只，检疫合格率 100%（旗动物检疫所出证）。\n秋冬季出栏计划：牛 60 · 羊 800 · 马 20 · 骆驼 5。\n流程：停用药物 14 天 → 产地检疫 → 定点屠宰 → 排酸 → 分割 → 溯源入库。`;
    }
    if (has('产品','销售','收入','多少钱','收益')){
      return `🛍️ 产品销售收入累计 ${money(c.saleAmount)}\n在售：冷鲜牛羊肉、奶豆腐/奶皮子、手工奶酪、羊绒制品、驼绒礼盒、草原文创。\n每件产品一品一码可溯源：批次 → 耳标 → 草场。`;
    }
    if (has('牧户游','订单','游客','旅游','住宿','那达慕','活动','节庆')){
      const events = DB.hulunbuir.events.filter(e=>e.status!=='已完成').map(e=>`· ${e.date} ${e.name}（${e.place}）`).join('\n');
      return `🏕️ 今日订单 ${c.todayOrders} 单 · 今日游客 ${live.visitors} 人 · 评分 4.9\n近期活动：\n${events||'· 暂无'}\n冬季主推：地暖蒙古包、雪原穿越、冰雪那达慕。`;
    }
    if (has('转场','营盘','轮牧','放牧','走敖特尔','该不该')){
      const next = DB.hulunbuir.migration.find(x=>x.status!=='已完成');
      return `🔄 当前 ${demoMonth} 月 · ${m.season}季（${m.name}）\n本季任务：${m.tasks.join('；')}\n下次转场：${next?`${next.season} ${next.route}（${next.distance} · ${next.time}）`:'暂无'}\n转场原则：春避返青、夏逐水草、秋储冬草、冬御风雪。`;
    }
    if (has('接羔','产犊','繁殖','产羔','小牛','小羊','产驹')){
      return `🍼 本年度繁殖：接羔 2,860 · 产犊 402 · 马驹 64 · 驼羔 18，成活率 97.6%\n当前冬季接羔季注意：\n1）产羔暖棚恒温 24℃，初乳 2 小时内饲喂\n2）羔羊补铁、防脐带感染\n3）母畜产后补水补料，观察胎衣是否排出。`;
    }
    if (has('天气','温度','降温','寒潮','冷','下雪','白灾','雪灾')){
      return `🌦️ ${DB.weather.place}：${DB.weather.icon} ${live.t}℃（体感 ${DB.weather.feels}℃）\n${DB.weather.wind} · ${DB.weather.snow}\n⚠️ ${DB.weather.alert}\n❄️ 今夜最低 ${DB.weather.low}℃，请确保犊羊暖棚加温、饮水槽防冻正常。`;
    }
    if (has('草场','载畜量','NDVI','植被','退化','打草','亩')){
      return `🌾 草场 ${fmt(DB.meta.area)} 亩（放牧 ${fmt(DB.meta.grazingArea)} · 打草 ${fmt(DB.meta.hayArea)}）\n载畜量使用率 ${DB.grassland.balance.rate}%（安全线 90%）· 羊单位 ${fmt(c.sheepUnits)}/${fmt(DB.grassland.balance.capacity)}\nNDVI ${live.ndvi.toFixed(3)} · 植被优良\n分类：草甸/典型/低湿地/改良/沙化 6 类，以类定用。`;
    }
    if (has('预警','告警','风险','紧急')){
      const hi = DB.tasks.filter(t=>t.level==='高');
      return `🔔 当前预警 ${DB.tasks.length} 项，其中高优先级 ${hi.length} 项：\n${hi.map(t=>`· ${t.text}（${t.time}）`).join('\n')}\n生态监测：白灾预警、草原防火、鼠害防治、野生动物保护均已接入平台。`;
    }
    if (has('溯源','扫码','耳标号','安全','绿色')){
      return `📱 一畜一码全程溯源：出生 → 免疫 → 转场 → 出栏检疫 → 分割加工 → 销售，全链路可查。\n消费者扫码即可看到耳标号、草场、防疫记录，绿色畜产品认证基地。`;
    }
    if (has('帮助','你会','能干什么','功能','怎么用')){
      return `🤖 我可以帮你：\n· 查存栏 / 草场 / 饲草 / 防疫 / 屠宰 / 产品 / 订单 / 设备\n· 给寒冷地区饲养建议（接羔、防寒、防疫、补饲）\n· 查预警与转场计划\n直接问我，或点下方快捷问题。`;
    }
    if (has('你好','在吗','hi','嗨','哈喽')){
      return `你好呀！我是艾牧戈畜牧业智能体 🤖\n想了解牧场的任何情况都可以问我，比如「饲草够不够过冬」「该不该转场了」。`;
    }
    if (has('整体','情况','总结','日报','今天','汇总','汇报','快报')){
      return `📋 今日牧场快报\n· 存栏 ${fmt(c.totalAnimals)} 头只 · 当前 ${monthName(demoMonth)} ${m.season}季（${m.name}）\n· 设备在线率 ${c.devRate}%（${fmt(live.online)} 台在线）\n· 饲草储备 ${c.foragePct}% · 产品收入 ${money(c.saleAmount)}\n· 牧游订单 ${c.todayOrders} 单 · 游客 ${live.visitors} 人\n· 高优先级预警 ${DB.tasks.filter(t=>t.level==='高').length} 项\n· 建议：今夜最低 -31℃，暖棚加温至 26℃，早晚巡圈。`;
    }
    return `我暂时没太听懂这个问题 😅 你可以问我：\n· 「今天牧场整体情况怎么样？」\n· 「饲草储备够不够过冬？」\n· 「口蹄疫怎么防？」\n· 「该不该转场了？」\n也可以试试下方的快捷问题。`;
  }
  function pageAgent(){
    const c = compute(), m = DB.months[demoMonth-1];
    const brief = `📋 ${monthName(demoMonth)} · ${m.season}季快报　存栏 ${fmt(c.totalAnimals)} · 设备在线 ${c.devRate}% · 饲草 ${c.foragePct}% · 游客 ${live.visitors} 人`;
    return `
    <div class="page agent-page">
      <div class="agent-head">
        <div class="ah-avatar">🤖</div>
        <div class="ah-txt"><b>畜牧业智能体</b><span>艾牧戈 · 牧场数据问答 · 寒冷地区饲养顾问</span></div>
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
      typing.innerHTML = '<div class="am-ava">🤖</div><div class="am-bubble typing"><i></i><i></i><i></i></div>';
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
      ${pageHeader('牧事日志 · 牧民的一天', '每天记一记：巡栏打卡 + 今天干了啥 + 明天要干啥，接羔季再也不乱', addBtn('写日志','logs'))}
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
            <div class="card-note">接羔季口诀：初乳 2 小时内、暖棚恒温 24℃、羔羊补铁防脐带炎。</div>`)}
          ${card('牧民经验库（老话新用）', `
            <div class="cold-list">
              <div class="cold-item">🌙 "马不吃夜草不肥，羊不看夜圈不实" —— 冬季夜间巡圈最重要</div>
              <div class="cold-item">🧊 "冬储草，春不慌" —— 饲草备到 3 月底是底线</div>
              <div class="cold-item">🐏 "看膘定料，看天转场" —— 依据天气和体况决定补饲与转场</div>
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
        ${statCard({icon:'📥', label:'收入合计', value:'¥'+fmt(income), sub:'产品/牧游/补贴', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'📤', label:'支出合计', value:'¥'+fmt(expense), sub:'饲草/防疫/设备/人工', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'🏦', label:'结余', value:'¥'+fmt(income-expense), sub:'当前记录口径', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'🧾', label:'记账笔数', value:DB.ledger.length+' 笔', sub:'支持增删改', color:'#c8925a', bg:'#fbf3e4'})}
      </div>
      ${card('收支明细（可新增/编辑/删除）', tableHtml(['日期','类型','分类','项目','金额','备注','操作'],
        DB.ledger.map(x=>[x.date, pill(x.type, x.type==='收入'?'ok':'danger'), x.category, x.item,
          `<b style="color:${x.type==='收入'?'#3f8f4f':'#d9534f'}">${x.type==='收入'?'+':'−'}¥${fmt(x.amount)}</b>`, x.note||'—',
          editBtn('ledger', x.id)+delBtn('ledger', x.id)])))}
      <div style="margin:0 0 18px">${addBtn('记一笔','ledger')}</div>
      <div class="grid-3">
        <div class="col2">
          ${card('出栏收益测算 · 现在卖还是再等等？', `
            <div class="calc-box">
              <div class="calc-row">
                <label><span>畜种</span><select id="calSpecies"><option>牛</option><option>羊</option><option>马</option><option>骆驼</option></select></label>
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
      <div class="card-note">⛽ 一次转场少则几百、多则上千：油料、车马费、路上饲草都要记。全年转场 4 次，合计约 ¥3,000-5,000。</div>
    </div>`;
  }
  const ledgerFields = [
    {name:'date', label:'日期', type:'date', value:'2026-02-16'},
    {name:'type', label:'类型', type:'select', options:[{v:'收入'},{v:'支出'}]},
    {name:'category', label:'分类', type:'select', options:['产品','牧游','饲草','防疫','设备','人工','保险','其他'].map(v=>({v}))},
    {name:'item', label:'项目', type:'text', required:true, placeholder:'例：冷鲜牛羊肉'},
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
        {name:'item', label:'项目', type:'select', options:[{v:'油料'},{v:'车马费'},{v:'路上饲草'},{v:'住宿'},{v:'其他'}]},
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
        ${statCard({icon:'🧑‍🌾', label:'在岗雇工', value:on+' 人', sub:'共 '+DB.workers.length+' 人', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'💰', label:'考勤工钱合计', value:'¥'+fmt(pay), sub:'按考勤记录实时汇总', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'📋', label:'考勤记录', value:DB.attendance.length+' 条', sub:'接羔季每日记', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'🌾', label:'旺季用工', value:'4 人', sub:'接羔季 2-4 月 · 旅游季 5-10 月', color:'#b3541e', bg:'#fbeee6'})}
      </div>
      ${card('雇工名单（可新增/编辑/删除）', tableHtml(['姓名','岗位','电话','工资','结算','状态','排班','备注','操作'],
        DB.workers.map(w=>[`<b>${w.name}</b>`, w.role, w.phone, w.wage+' 元', pill(w.wageType, w.wageType==='月薪'?'info':'warn'),
          pill(w.status, w.status==='在岗'?'ok':w.status==='休假'?'warn':'muted'),
          w.schedule, w.note||'—', editBtn('workers', w.id)+delBtn('workers', w.id)])))}
      <div style="margin:0 0 18px">${addBtn('添加雇工','workers')}</div>
      ${card('考勤工钱（可新增/删除）', tableHtml(['日期','工人','干活内容','工时','工钱','操作'],
        DB.attendance.map(a=>[a.date, a.worker, a.task, a.hours+' 小时', '¥'+fmt(a.pay), delBtn('attendance', a.id)])))}
      <div style="margin:0 0 18px">${addBtn('记考勤','attendance')}</div>
      <div class="card-note">💡 用工提醒：接羔季（2-4 月）至少 2 名技术工；工钱日结留签字/转账记录；旺季保险给临时工上一份意外险。</div>
    </div>`;
  }
  const workerFields = [
    {name:'name', label:'姓名', type:'text', required:true},
    {name:'role', label:'岗位', type:'select', options:['放牧工','接羔技术','兽医','挤奶工','牧户游服务员','厨师','司机'].map(v=>({v}))},
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
        {name:'task', label:'干活内容', type:'text', placeholder:'例：接羔 + 巡圈'},
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
        ${statCard({icon:'🛡️', label:'投保范围', value:'全群 10,232', sub:'财政补贴保费 80%', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'📞', label:'报案记录', value:claims.length+' 起', sub:'冻死/疫病/狼害', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'⏳', label:'理赔中', value:claims.filter(x=>x.status==='理赔中'||x.status==='已报案').length+' 起', sub:'保险员核验中', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'✅', label:'已赔付', value:paying.length+' 起', sub:'理赔金已到账', color:'#3f8f4f', bg:'#eaf4ee'})}
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
    {name:'species', label:'畜种', type:'select', options:['牛','羊','马','骆驼'].map(v=>({v}))},
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

  /* ================= 防狼防盗 ================= */
  function pageSafety(){
    const ev = DB.safety.events;
    return `
    <div class="page">
      ${pageHeader('防狼防盗 · 夜间安防联动', 'AI 狼影识别 / 电子围栏 / 无人机夜巡 / 犬群驱离 / 手机推送', addBtn('新增安防事件','safety.events'))}
      <div class="kpi-grid kpi-4">
        ${statCard({icon:'🚨', label:'安防事件', value:ev.length+' 起', sub:'狼害/闯入/围栏告警', color:'#d9534f', bg:'#fdeeee'})}
        ${statCard({icon:'🔔', label:'今日高警', value:ev.filter(x=>x.level==='高').length+' 起', sub:'已推送场主手机', color:'#c8925a', bg:'#fbf3e4'})}
        ${statCard({icon:'🎥', label:'监控在线', value:'35/36 路', sub:'太阳能夜视 + AI 识别', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'⚡', label:'电子围栏', value:'11/12 套', sub:'1 处离线已派单', color:'#3f8f4f', bg:'#eaf4ee'})}
      </div>
      ${card('安防事件台账（可新增/编辑/删除）', tableHtml(['时间','类型','位置','级别','状态','处置记录','操作'],
        ev.map(x=>[x.time, pill(x.type, x.type==='狼害预警'?'danger':'warn'), x.location,
          pill(x.level, x.level==='高'?'danger':x.level==='中'?'warn':'muted'),
          pill(x.status, x.status==='已处置'?'ok':'warn'), x.note, editBtn('safety.events', x.id)+delBtn('safety.events', x.id)])))}
      <div style="margin:0 0 18px">${addBtn('新增安防事件','safety.events')}</div>
      ${card('防控措施', `
        <div class="cat-grid">
          ${DB.safety.measures.map(m=>`
            <div class="cat-card" style="--cc:#b3541e">
              <div class="cat-head"><span class="cat-ico">${m.icon}</span><div><div class="cat-name">${m.name}</div><div class="cat-desc">${m.desc}</div></div></div>
            </div>`).join('')}
        </div>`)}
      <div class="card-note">🚨 联动流程：夜间红外/AI 识别目标 → 平台 30 秒内判定 → 声光驱离 + 犬群出动 → 推送场主手机 → 无人机复核现场。狼害高发期（冬季）加强夜巡。</div>
    </div>`;
  }
  const safetyFields = [
    {name:'time', label:'时间', type:'text', placeholder:'例：2026-02-16 03:12'},
    {name:'type', label:'类型', type:'select', options:[{v:'狼害预警'},{v:'异常闯入'},{v:'围栏告警'},{v:'无人机发现'}]},
    {name:'location', label:'位置', type:'text'},
    {name:'level', label:'级别', type:'select', options:[{v:'高'},{v:'中'},{v:'低'}]},
    {name:'status', label:'状态', type:'select', options:[{v:'待处置'},{v:'处置中'},{v:'已处置'}]},
    {name:'note', label:'处置记录', type:'textarea'}
  ];
  function afterSafety(){
    bindDel($('#content'));
    bindEdit($('#content'), { 'safety.events': { title:'编辑安防事件', fields: safetyFields } });
    $('#content').querySelectorAll('[data-add="safety.events"]').forEach(b=>b.addEventListener('click', ()=>{
      openModal('新增安防事件', safetyFields, v=>{ addRecord('safety.events', v); toast('安防事件已登记'); render(current); });
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
      ${pageHeader('牧场相册 · 每日一照', '羊群 / 草场 / 转场照片存档，年底回看一年的草原', '')}
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
      <div class="card-note">📷 建议每天拍一张：接羔、打草、转场、雪景……一年下来就是牧场的影像档案，也是申报示范牧场的好材料。</div>
    </div>`;
  }
  function afterGallery(){
    bindDel($('#content'));
    const input = ensureGalInput();
    $('#galUpload').addEventListener('click', ()=>input.click());
    $('#galNote').addEventListener('click', ()=>toast('每日一照：拍下今天的羊群/草场，配一句备注','warn'));
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

  /* ================= 政务对接 ================= */
  const govApiSamples = {
    vaccine: `POST https://yqfk.gov-api.cn/v1/yqb/report
{
  "api": "yqb/report/immunization",
  "ranch": "AIMUGE-FAMILY-RANCH",
  "ranchCode": "1507210000001",
  "batch": "YB20260216001",
  "vaccine": "口蹄疫 A 型",
  "species": "牛/羊",
  "dose": 6430,
  "earTags": ["NM25-10218","NM25-20387"],
  "vet": "旗疫控中心",
  "time": "2026-02-16 09:32:00"
}
→ 响应：{ "code": 0, "receipt": "YB20260216001", "msg": "上报成功" }`,
    slaughter: `POST https://tzjg.gov-api.cn/v1/slaughter/batch
{
  "api": "tz/report/slaughter-batch",
  "ranch": "AIMUGE-FAMILY-RANCH",
  "batchNo": "TZ20260214021",
  "species": "羊",
  "head": 120,
  "weight": "2.4吨",
  "quarantineNo": "QZ20260215018",
  "coldChain": "-18℃",
  "trace": "一畜一码",
  "time": "2026-02-14 11:05:00"
}
→ 响应：{ "code": 0, "receipt": "TZ20260214021", "msg": "批次已备案" }`
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
        ${statCard({icon:'🏛️', label:'已对接系统', value:done+' 个', sub:'检疫/防疫/屠宰/溯源', color:'#2e86ab', bg:'#e8f3f8'})}
        ${statCard({icon:'📤', label:'累计上报记录', value:g.reports.length+' 条', sub:'含防疫/出证/屠宰/耳标', color:'#3f8f4f', bg:'#eaf4ee'})}
        ${statCard({icon:'✅', label:'上报成功率', value:'100%', sub:'接口自动重试 · 回执留痕', color:'#7a5230', bg:'#f5efe6'})}
        ${statCard({icon:'📋', label:'待对接', value:g.systems.filter(x=>x.status!=='已对接').length+' 个', sub:'投入品 / 政务数据共享', color:'#c8925a', bg:'#fbf3e4'})}
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
      vaccine:    { target:'动物疫病防控直报系统', type:'免疫记录上报', biz:'春季口蹄疫 O 型 · 全群 6,430 头份', prefix:'YB' },
      quarantine: { target:'动物检疫电子出证', type:'检疫出证', biz:'出栏羊 60 只 · 检疫合格', prefix:'QZ' },
      slaughter:  { target:'定点屠宰监管平台', type:'屠宰批次上报', biz:'屠宰批次 SL20260216 · 羊肉 1.2 吨', prefix:'TZ' },
      tag:        { target:'畜禽标识溯源系统', type:'耳标备案同步', biz:'新增耳标 300 枚', prefix:'EB' }
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
    safety:     { title:'防狼防盗', render:pageSafety, after:afterSafety },
    gallery:    { title:'牧场相册', render:pageGallery, after:afterGallery },
    agent:      { title:'畜牧业智能体', render:pageAgent, after:afterAgent },
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
  function render(name){
    current = name;
    const p = pages[name];
    crumb.textContent = p.title;
    content.classList.remove('fade-in');
    content.innerHTML = p.render();
    requestAnimationFrame(()=>content.classList.add('fade-in'));
    if (p.after) p.after();
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
  initWeatherChip();
  renderNav();
  render('dashboard');
  renderLive();
  startIot();
})();
