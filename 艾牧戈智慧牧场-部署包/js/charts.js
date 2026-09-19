/* ============ 轻量 SVG 图表库（无外部依赖） ============ */
const Charts = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  function el(container, svg) { container.innerHTML = svg; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---------- 环形图 ---------- */
  function donut(container, opt) {
    const o = Object.assign({ size:170, thickness:26, centerTitle:'', centerValue:'', segments:[] }, opt);
    const size = o.size, r = (size - o.thickness) / 2, c = 2 * Math.PI * r;
    const cx = size/2, cy = size/2;
    const total = o.segments.reduce((s,x)=>s+x.value,0) || 1;
    let acc = 0, arcs = '';
    o.segments.forEach(seg => {
      const frac = seg.value / total;
      const len = frac * c;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${o.thickness}"
        stroke-dasharray="${len} ${c-len}" stroke-dashoffset="${-acc*c}" transform="rotate(-90 ${cx} ${cy})"
        opacity="${seg.opacity||1}"><title>${esc(seg.label||'')} ${seg.value}</title></circle>`;
      acc += frac;
    });
    el(container, `<svg class="chart-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="${NS}">
      ${arcs}
      <text x="${cx}" y="${cy-4}" text-anchor="middle" class="c-donut-val">${esc(o.centerValue)}</text>
      <text x="${cx}" y="${cy+16}" text-anchor="middle" class="c-donut-title">${esc(o.centerTitle)}</text>
    </svg>`);
    if (o.legend !== false) {
      const lg = document.createElement('div'); lg.className = 'chart-legend';
      lg.innerHTML = o.segments.map(s=>`<span class="lg-item"><i style="background:${s.color}"></i>${esc(s.label)}<b>${s.value}${s.unit||''}</b></span>`).join('');
      container.appendChild(lg);
    }
  }

  /* ---------- 折线/面积图 ---------- */
  function line(container, opt) {
    const o = Object.assign({ labels:[], series:[], height:220, yFormat:v=>v, fill:true, smooth:true, yTicks:4, unit:'' }, opt);
    const W = 620, H = o.height, padL = 46, padR = 14, padT = 14, padB = 30;
    let min=Infinity, max=-Infinity;
    o.series.forEach(s=>s.values.forEach(v=>{ if(v<min)min=v; if(v>max)max=v; }));
    if (min===max){ min-=1; max+=1; }
    const span = max-min, pad = span*0.12 || 1;
    min-=pad; max+=pad;
    const x = i => padL + i*(W-padL-padR)/(Math.max(o.labels.length-1,1));
    const y = v => padT + (max-v)/(max-min)*(H-padT-padB);
    let g = '';
    const ticks = [];
    for (let i=0;i<=o.yTicks;i++){ ticks.push(min + (max-min)*i/o.yTicks); }
    ticks.forEach(t=>{
      g += `<line x1="${padL}" y1="${y(t)}" x2="${W-padR}" y2="${y(t)}" class="c-grid"/>
        <text x="${padL-8}" y="${y(t)+4}" text-anchor="end" class="c-axis">${esc(o.yFormat(t))}</text>`;
    });
    o.labels.forEach((lb,i)=>{
      g += `<text x="${x(i)}" y="${H-8}" text-anchor="middle" class="c-axis">${esc(lb)}</text>`;
    });
    const path = (vals) => vals.map((v,i)=>`${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    o.series.forEach((s,si)=>{
      if (o.fill && si===0){
        g += `<path d="${path(s.values)} L${x(o.labels.length-1)},${H-padB} L${x(0)},${H-padB} Z" fill="${s.color}" opacity="0.12"/>`;
      }
      g += `<path d="${path(s.values)}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (o.labels.length <= 12){
        s.values.forEach((v,i)=>{
          g += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#fff" stroke="${s.color}" stroke-width="2"><title>${esc(o.labels[i])} ${v}${o.unit}</title></circle>`;
        });
      }
    });
    const legend = o.series.length>1 ? `<div class="chart-legend">${o.series.map(s=>`<span class="lg-item"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
    el(container, `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" xmlns="${NS}">${g}</svg>${legend}`);
  }

  /* ---------- 柱状图（支持分组/堆叠） ---------- */
  function bars(container, opt) {
    const o = Object.assign({ labels:[], series:[], height:220, yFormat:v=>v, stacked:false, horizontal:false, yTicks:4, unit:'' }, opt);
    const W=620, H=o.height, padL=46, padR=14, padT=14, padB=30;
    let max = 0;
    o.series.forEach(s=>s.values.forEach(v=>{ if(v>max)max=v; }));
    max = max*1.15 || 1;
    const y = v => padT + (1 - v/max)*(H-padT-padB);
    let g='';
    const ticks=[];
    for(let i=0;i<=o.yTicks;i++) ticks.push(max*i/o.yTicks);
    ticks.forEach(t=>{
      g += `<line x1="${padL}" y1="${y(t)}" x2="${W-padR}" y2="${y(t)}" class="c-grid"/>
        <text x="${padL-8}" y="${y(t)+4}" text-anchor="end" class="c-axis">${esc(o.yFormat(t))}</text>`;
    });
    const n = o.labels.length, band = (W-padL-padR)/n;
    const gw = o.stacked ? band*0.55 : band*0.62/o.series.length;
    o.labels.forEach((lb,i)=>{
      const cx0 = padL + band*i + band/2;
      o.series.forEach((s,si)=>{
        const v = s.values[i]||0;
        const w = o.stacked ? band*0.55 : gw;
        const hx = o.stacked ? cx0-w/2 : cx0 - (o.series.length/2 - si)*gw - gw/2;
        const baseY = o.stacked ? (()=>{ let acc=0; for(let k=0;k<si;k++) acc+=(o.series[k].values[i]||0); return y(acc); })() : H-padB;
        const h = o.stacked ? baseY - y(acc0(o.series,si,i)) : H-padB - y(v);
        g += `<rect x="${hx}" y="${o.stacked ? baseY-h : y(v)}" width="${w}" height="${o.stacked ? h : H-padB-y(v)}" rx="4" fill="${s.color}" opacity="0.9">
          <title>${esc(lb)} ${s.name||''} ${v}${o.unit}</title></rect>`;
      });
      g += `<text x="${cx0}" y="${H-8}" text-anchor="middle" class="c-axis">${esc(lb)}</text>`;
    });
    function acc0(series, si, i){ let a=0; for(let k=0;k<=si;k++) a+=series[k].values[i]||0; return a; }
    const legend = o.series.length>1 ? `<div class="chart-legend">${o.series.map(s=>`<span class="lg-item"><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
    el(container, `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" xmlns="${NS}">${g}</svg>${legend}`);
  }

  /* ---------- 半圆仪表盘 ---------- */
  function gauge(container, opt) {
    const o = Object.assign({ value:85, min:0, max:100, label:'', sub:'', color:'#3f8f4f', size:200 }, opt);
    const size=o.size, cx=size/2, cy=size/2, r=size/2-18;
    const pct = Math.max(0, Math.min(1, (o.value-o.min)/(o.max-o.min)));
    const polar = (a,r0)=>[cx + r0*Math.cos(a), cy + r0*Math.sin(a)];
    const arc = (from,to,r0)=>{
      const p1=polar(from,r0), p2=polar(to,r0), large = (to-from)>Math.PI?1:0;
      return `M${p1[0]},${p1[1]} A${r0},${r0} 0 ${large} 1 ${p2[0]},${p2[1]}`;
    };
    const a0 = Math.PI, a1 = 0;
    const bg = arc(a0, a1, r);
    const val = arc(a0, a0 - pct*Math.PI, r);
    el(container, `<svg class="chart-svg" viewBox="0 0 ${size} ${size/2+26}" width="${size}" xmlns="${NS}">
      <path d="${bg}" fill="none" stroke="#e8efe8" stroke-width="16" stroke-linecap="round"/>
      <path d="${val}" fill="none" stroke="${o.color}" stroke-width="16" stroke-linecap="round"/>
      <text x="${cx}" y="${cy-2}" text-anchor="middle" class="c-gauge-val">${esc(o.value)}${o.unit||'%'}</text>
      <text x="${cx}" y="${cy+18}" text-anchor="middle" class="c-gauge-label">${esc(o.label)}</text>
      ${o.sub?`<text x="${cx}" y="${cy+34}" text-anchor="middle" class="c-gauge-sub">${esc(o.sub)}</text>`:''}
    </svg>`);
  }

  /* ---------- 横向进度条 ---------- */
  function hbar(container, opt) {
    const o = Object.assign({ label:'', value:0, max:100, color:'#3f8f4f', text:'' }, opt);
    const pct = Math.max(0, Math.min(100, o.value/o.max*100));
    el(container, `<div class="hbar">
      <div class="hbar-head"><span>${esc(o.label)}</span><b style="color:${o.color}">${esc(o.text||o.value)}</b></div>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${o.color}"></div></div>
    </div>`);
  }

  return { donut, line, bars, gauge, hbar };
})();
