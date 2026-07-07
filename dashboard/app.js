/* ============================================================
   El Salvador Sintético — app.js
   Dashboard interactivo (ECharts). Datos: dashboard/data/data.json
   ============================================================ */
const BLUE = {
  seq: ['#eaf2fd', '#c2dbfa', '#86b7f0', '#4a90e2', '#1e6fe0', '#0b3d91', '#0a2e6e'],
  p700: '#0b3d91', p600: '#1257bd', p500: '#1e6fe0', p400: '#4a90e2', p300: '#86b7f0',
  teal: '#2e8bc0', ink: '#0a2540', muted: '#6b7c93', line: '#e4ecf7',
};
const FONT = 'Inter, system-ui, sans-serif';
const charts = [];
const reg = (c) => { charts.push(c); return c; };
const fmt = (n) => Number(n).toLocaleString('es-SV');
const $ = (s) => document.querySelector(s);

const EDU_LABEL = { ninguno: 'Ninguno', primaria: 'Primaria', secundaria: 'Secundaria', bachillerato: 'Bachillerato', tecnico: 'Técnico', universitario: 'Universitario', posgrado: 'Posgrado' };
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const baseTooltip = {
  backgroundColor: '#fff', borderColor: BLUE.line, borderWidth: 1,
  textStyle: { color: BLUE.ink, fontFamily: FONT, fontSize: 13 },
  extraCssText: 'box-shadow:0 8px 28px rgba(11,61,145,.14); border-radius:12px; padding:10px 12px;',
};
const axisStyle = {
  axisLine: { lineStyle: { color: BLUE.line } },
  axisTick: { show: false },
  axisLabel: { color: BLUE.muted, fontFamily: FONT, fontSize: 12 },
  splitLine: { lineStyle: { color: BLUE.line, type: 'dashed' } },
};

let DATA = null;

async function main() {
  const [data, geo, geoMuni] = await Promise.all([
    fetch('data/data.json').then((r) => r.json()),
    fetch('data/departments.geojson').then((r) => r.json()),
    fetch('data/municipios.geojson').then((r) => r.json()),
  ]);
  DATA = data;
  echarts.registerMap('SV', geo);
  echarts.registerMap('SVmuni', geoMuni);
  renderKPIs();
  renderPyramid();
  renderDonut('#chartSex', data.distributions.sex, [BLUE.teal, BLUE.p700]);
  renderDonut('#chartArea', { urbano: data.distributions.area.urbano, rural: data.distributions.area.rural }, [BLUE.p500, BLUE.p300]);
  renderMap();
  renderEducation();
  renderEduByArea();
  renderOccupations();
  renderWordcloud('#wcSkills', data.skills.words);
  renderWordcloud('#wcHobbies', data.hobbies.words);
  renderICH();
  renderScatter();
  setupReveal();
  window.addEventListener('resize', () => charts.forEach((c) => c && c.resize()));
}

/* ---------- KPIs ---------- */
function renderKPIs() {
  const k = DATA.kpis;
  const items = [
    { v: fmt(k.totalPersonas), l: 'Personas sintéticas' },
    { v: k.nDepartamentos, l: 'Departamentos' },
    { v: k.nMunicipios, l: 'Municipios (nuevos)' },
    { v: k.nOcupaciones, l: 'Ocupaciones distintas' },
    { v: k.edadPromedio + ' años', l: 'Edad promedio' },
    { v: k.pctFemenino + '%', l: 'Femenino' },
    { v: k.pctUrbano + '%', l: 'Población urbana' },
    { v: k.eduYearsGlobal, l: 'Años de escolaridad (prom.)' },
  ];
  $('#kpis').innerHTML = items.map((i) => `<div class="kpi reveal"><div class="val">${i.v}</div><div class="lbl">${i.l}</div></div>`).join('');
}

/* ---------- Pirámide ---------- */
function renderPyramid() {
  const c = reg(echarts.init($('#chartPyramid')));
  const bins = DATA.pyramid.map((d) => d.bin);
  const male = DATA.pyramid.map((d) => -d.Masculino);
  const female = DATA.pyramid.map((d) => d.Femenino);
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `<b>${p[0].axisValue} años</b><br/>♂ Masculino: ${fmt(Math.abs(p[0].value))}<br/>♀ Femenino: ${fmt(p[1].value)}` },
    legend: { data: ['Masculino', 'Femenino'], top: 0, textStyle: { color: BLUE.muted, fontFamily: FONT } },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value', ...axisStyle, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => fmt(Math.abs(v)) } },
    yAxis: { type: 'category', data: bins, ...axisStyle, splitLine: { show: false } },
    series: [
      { name: 'Masculino', type: 'bar', stack: 't', data: male, itemStyle: { color: BLUE.p700, borderRadius: [0, 3, 3, 0] }, barWidth: '62%' },
      { name: 'Femenino', type: 'bar', stack: 't', data: female, itemStyle: { color: BLUE.teal, borderRadius: [0, 3, 3, 0] } },
    ],
  });
}

/* ---------- Donuts ---------- */
function renderDonut(sel, obj, colors) {
  const c = reg(echarts.init($(sel)));
  const data = Object.entries(obj).map(([k, v], i) => ({ name: k[0].toUpperCase() + k.slice(1), value: v, itemStyle: { color: colors[i % colors.length] } }));
  const total = data.reduce((s, d) => s + d.value, 0);
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'item', formatter: (p) => `<b>${p.name}</b><br/>${fmt(p.value)} (${(100 * p.value / total).toFixed(1)}%)` },
    legend: { bottom: 0, textStyle: { color: BLUE.muted, fontFamily: FONT } },
    series: [{
      type: 'pie', radius: ['52%', '78%'], center: ['50%', '46%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: (p) => `${(100 * p.value / total).toFixed(0)}%`, color: BLUE.ink, fontWeight: 700, fontFamily: FONT },
      data,
    }],
  });
}

/* ---------- MAPA ---------- */
const METRICS = {
  count: { label: 'Población', title: 'Población', fmt: (v) => fmt(v) },
  ich: { label: 'Índice ICH', title: 'Índice de Capital Humano (ICH)', fmt: (v) => v.toFixed(0) },
  eduYears: { label: 'Escolaridad', title: 'Años de escolaridad promedio', fmt: (v) => v.toFixed(1) + ' años' },
  pctUrban: { label: '% Urbano', title: 'Porcentaje de población urbana', fmt: (v) => v + '%' },
  pctFemale: { label: '% Femenino', title: 'Porcentaje de población femenina', fmt: (v) => v + '%' },
  pctHigher: { label: '% Ed. superior', title: 'Porcentaje con educación superior', fmt: (v) => v + '%' },
};
const LEVELS = {
  dept: { label: 'Departamento (14)', map: 'SV', prop: 'department', src: () => DATA.departments },
  muni: { label: 'Municipio (44)', map: 'SVmuni', prop: 'municipality', src: () => DATA.municipalities },
};
let mapChart, currentMetric = 'count', currentLevel = 'dept';

function renderMap() {
  $('#mapLevel').innerHTML = Object.entries(LEVELS).map(([k, l]) =>
    `<button class="pill${k === currentLevel ? ' active' : ''}" data-l="${k}">${l.label}</button>`).join('');
  $('#mapLevel').addEventListener('click', (e) => {
    const b = e.target.closest('.pill'); if (!b) return;
    currentLevel = b.dataset.l;
    document.querySelectorAll('#mapLevel .pill').forEach((p) => p.classList.toggle('active', p.dataset.l === currentLevel));
    resetDetail();
    mapChart.clear();
    updateMap();
  });

  $('#mapPills').innerHTML = Object.entries(METRICS).map(([k, m]) =>
    `<button class="pill${k === currentMetric ? ' active' : ''}" data-m="${k}">${m.label}</button>`).join('');
  $('#mapPills').addEventListener('click', (e) => {
    const b = e.target.closest('.pill'); if (!b) return;
    currentMetric = b.dataset.m;
    document.querySelectorAll('#mapPills .pill').forEach((p) => p.classList.toggle('active', p.dataset.m === currentMetric));
    updateMap();
  });

  mapChart = reg(echarts.init($('#chartMap')));
  updateMap();
  mapChart.on('click', (p) => { if (!p.name) return; currentLevel === 'dept' ? showDept(p.name) : showMuni(p.name); });
}

function updateMap() {
  const m = METRICS[currentMetric];
  const lv = LEVELS[currentLevel];
  const src = lv.src();
  const vals = src.map((d) => d[currentMetric]);
  const data = src.map((d) => ({ name: d.name, value: d[currentMetric], _d: d }));
  $('#mapTitle').textContent = m.title + (currentLevel === 'dept' ? ' por departamento' : ' por municipio');
  $('#mapSub').textContent = 'Haz clic en el mapa para explorar · ' + src.length + ' unidades';
  mapChart.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'item', formatter: (p) => {
      if (!p.data) return p.name;
      const d = p.data._d;
      return `<b>${d.name}</b>${currentLevel === 'muni' ? `<br/><span style="color:${BLUE.muted}">${d.department}</span>` : ''}<br/>${m.label}: <b>${m.fmt(p.value)}</b><br/>
        <span style="color:${BLUE.muted}">Población: ${fmt(d.count)} · Urbano: ${d.pctUrban}%<br/>
        Escolaridad: ${d.eduYears} años · ICH: ${d.ich}</span>` } },
    visualMap: {
      min: Math.min(...vals), max: Math.max(...vals), calculable: true, left: 12, bottom: 14,
      text: ['alto', 'bajo'], textStyle: { color: BLUE.muted, fontFamily: FONT },
      inRange: { color: BLUE.seq }, itemHeight: 120,
    },
    series: [{
      type: 'map', map: lv.map, nameProperty: lv.prop, roam: false, data,
      label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: currentLevel === 'muni' ? 0.5 : 1 },
      emphasis: { label: { show: true, color: BLUE.ink, fontWeight: 700, fontFamily: FONT },
        itemStyle: { areaColor: BLUE.p300, borderColor: '#fff', borderWidth: 2 } },
      select: { itemStyle: { areaColor: BLUE.p500 }, label: { show: true, color: '#fff' } },
    }],
  });
}

function resetDetail() {
  $('#deptDetail').innerHTML = '<div class="dept-name">Selecciona en el mapa</div><div class="hint">Haz clic en un ' + (currentLevel === 'dept' ? 'departamento' : 'municipio') + ' para ver su radiografía.</div>';
}

/* ---------- Detalle departamento ---------- */
let deptMuniChart;
function showDept(name) {
  const d = DATA.departments.find((x) => x.name === name);
  if (!d) return;
  const munis = DATA.municipalities.filter((m) => m.department === name).sort((a, b) => b.count - a.count);
  const occChips = d.topOccupations.slice(0, 4).map((o) => `<span class="chip" title="${o.name}">${truncate(o.name, 26)}</span>`).join('');
  $('#deptDetail').innerHTML = `
    <div>
      <div class="dept-name">${d.name}</div>
      <div class="hint">${munis.length} municipios · ${fmt(d.count)} personas sintéticas</div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="v">${d.eduYears}</div><div class="k">Años de escolaridad</div></div>
      <div class="stat"><div class="v">${d.ich}</div><div class="k">Índice ICH (0–100)</div></div>
      <div class="stat"><div class="v">${d.pctUrban}%</div><div class="k">Urbano</div></div>
      <div class="stat"><div class="v">${d.pctHigher}%</div><div class="k">Educación superior</div></div>
    </div>
    <div>
      <div class="k" style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:6px;">OCUPACIONES TOP</div>
      <div class="chips">${occChips}</div>
    </div>
    <div>
      <div class="k" style="font-size:12px;color:var(--muted);font-weight:600;margin:4px 0 2px;">MUNICIPIOS POR POBLACIÓN</div>
      <div id="deptMuni" style="height:${Math.max(120, munis.length * 26)}px;"></div>
    </div>`;
  if (deptMuniChart) deptMuniChart.dispose();
  deptMuniChart = echarts.init($('#deptMuni'));
  deptMuniChart.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `<b>${p[0].name}</b><br/>${fmt(p[0].value)} personas · ${munis[p[0].dataIndex].eduYears} años esc.` },
    grid: { left: 4, right: 40, top: 6, bottom: 6, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: munis.map((m) => m.name.replace(name, '').trim() || m.name),
      axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: BLUE.ink, fontFamily: FONT, fontSize: 12 } },
    series: [{ type: 'bar', data: munis.map((m) => m.count), barWidth: '58%',
      itemStyle: { color: BLUE.p500, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', formatter: (p) => fmt(p.value), color: BLUE.muted, fontFamily: FONT, fontSize: 11 } }],
  });
  charts.push(deptMuniChart);
}

/* ---------- Detalle municipio ---------- */
function showMuni(name) {
  const m = DATA.municipalities.find((x) => x.name === name);
  if (!m) return;
  if (deptMuniChart) { deptMuniChart.dispose(); deptMuniChart = null; }
  // ranking del municipio dentro de su métrica actual (percentil)
  const rankIch = [...DATA.municipalities].sort((a, b) => b.ich - a.ich).findIndex((x) => x.name === name) + 1;
  $('#deptDetail').innerHTML = `
    <div>
      <div class="dept-name">${m.name}</div>
      <div class="hint">Depto. de ${m.department} · ${fmt(m.count)} personas sintéticas</div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="v">${m.eduYears}</div><div class="k">Años de escolaridad</div></div>
      <div class="stat"><div class="v">${m.ich}</div><div class="k">Índice ICH (0–100)</div></div>
      <div class="stat"><div class="v">${m.pctUrban}%</div><div class="k">Urbano</div></div>
      <div class="stat"><div class="v">${m.pctHigher}%</div><div class="k">Educación superior</div></div>
      <div class="stat"><div class="v">${m.pctFemale}%</div><div class="k">Femenino</div></div>
      <div class="stat"><div class="v">#${rankIch}</div><div class="k">Ranking ICH (de 44)</div></div>
    </div>
    <div class="callout" style="margin-top:2px;font-size:13px;">
      <span class="ic">📊</span>
      <span>Edad promedio ${m.meanAge} años · dispersión educativa (riesgo) ${m.eduStd} años.</span>
    </div>`;
}

/* ---------- Educación ---------- */
function renderEducation() {
  const c = reg(echarts.init($('#chartEdu')));
  const order = DATA.eduOrder;
  const total = order.reduce((s, k) => s + (DATA.distributions.edu[k] || 0), 0);
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `<b>${p[0].name}</b><br/>${fmt(p[0].value)} (${(100 * p[0].value / total).toFixed(1)}%)` },
    grid: { left: 4, right: 20, top: 20, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: order.map((k) => EDU_LABEL[k]), ...axisStyle, axisLabel: { ...axisStyle.axisLabel, interval: 0, rotate: 24 } },
    yAxis: { type: 'value', ...axisStyle, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => (v / 1000) + 'k' } },
    series: [{ type: 'bar', data: order.map((k) => DATA.distributions.edu[k] || 0), barWidth: '58%',
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [{ offset: 0, color: BLUE.p400 }, { offset: 1, color: BLUE.p700 }]), borderRadius: [5, 5, 0, 0] } }],
  });
}

function renderEduByArea() {
  const c = reg(echarts.init($('#chartEduArea')));
  const order = DATA.eduOrder;
  const xt = DATA.crosstabs.eduByArea;
  const totU = order.reduce((s, k) => s + (xt[k]?.urbano || 0), 0);
  const totR = order.reduce((s, k) => s + (xt[k]?.rural || 0), 0);
  const urb = order.map((k) => +(100 * (xt[k]?.urbano || 0) / totU).toFixed(1));
  const rur = order.map((k) => +(100 * (xt[k]?.rural || 0) / totR).toFixed(1));
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => v + '%' },
    legend: { data: ['Urbano', 'Rural'], top: 0, textStyle: { color: BLUE.muted, fontFamily: FONT } },
    grid: { left: 4, right: 16, top: 34, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: order.map((k) => EDU_LABEL[k]), ...axisStyle, axisLabel: { ...axisStyle.axisLabel, interval: 0, rotate: 24 } },
    yAxis: { type: 'value', ...axisStyle, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => v + '%' } },
    series: [
      { name: 'Urbano', type: 'bar', data: urb, itemStyle: { color: BLUE.p600, borderRadius: [4, 4, 0, 0] } },
      { name: 'Rural', type: 'bar', data: rur, itemStyle: { color: BLUE.p300, borderRadius: [4, 4, 0, 0] } },
    ],
  });
}

/* ---------- Ocupaciones ---------- */
function renderOccupations() {
  const c = reg(echarts.init($('#chartOcc')));
  const top = DATA.occupations.top.slice(0, 15).reverse();
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `${p[0].name}<br/><b>${fmt(p[0].value)}</b> personas` },
    grid: { left: 4, right: 60, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: top.map((o) => truncate(o.name, 42)),
      axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: BLUE.ink, fontFamily: FONT, fontSize: 12 } },
    series: [{ type: 'bar', data: top.map((o) => o.count), barWidth: '62%',
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: BLUE.p700 }, { offset: 1, color: BLUE.p400 }]), borderRadius: [0, 5, 5, 0] },
      label: { show: true, position: 'right', formatter: (p) => fmt(p.value), color: BLUE.muted, fontFamily: FONT, fontSize: 11 } }],
  });
}

/* ---------- Wordclouds ---------- */
function renderWordcloud(sel, words) {
  const c = reg(echarts.init($(sel)));
  c.setOption({
    tooltip: { ...baseTooltip, formatter: (p) => `<b>${p.name}</b>: ${fmt(p.value)}` },
    series: [{
      type: 'wordCloud', shape: 'circle', width: '96%', height: '92%', left: 'center', top: 'center',
      sizeRange: [14, 62], rotationRange: [0, 0], gridSize: 8, drawOutOfBound: false,
      textStyle: { fontFamily: FONT, fontWeight: 700, color: () => BLUE.seq[3 + Math.floor(Math.random() * 3)] },
      emphasis: { textStyle: { color: BLUE.p700 } },
      data: words.map((w) => ({ name: w.name, value: w.count })),
    }],
  });
}

/* ---------- ICH ranking ---------- */
function renderICH() {
  const c = reg(echarts.init($('#chartICH')));
  const d = [...DATA.departments].sort((a, b) => a.ich - b.ich);
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => { const x = d[p[0].dataIndex]; return `<b>${x.name}</b><br/>ICH: <b>${x.ich}</b><br/><span style="color:${BLUE.muted}">Escolaridad ${x.eduYears} · Urbano ${x.pctUrban}% · Sup. ${x.pctHigher}%</span>` } },
    grid: { left: 4, right: 46, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', max: 100, ...axisStyle },
    yAxis: { type: 'category', data: d.map((x) => x.name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: BLUE.ink, fontFamily: FONT, fontSize: 12 } },
    visualMap: { show: false, min: 0, max: 100, dimension: 0, inRange: { color: [BLUE.p300, BLUE.p700] } },
    series: [{ type: 'bar', data: d.map((x) => x.ich), barWidth: '60%', itemStyle: { borderRadius: [0, 5, 5, 0] },
      label: { show: true, position: 'right', formatter: (p) => p.value, color: BLUE.ink, fontWeight: 700, fontFamily: FONT, fontSize: 12 } }],
  });
}

/* ---------- Scatter escolaridad vs urbano ---------- */
function renderScatter() {
  const c = reg(echarts.init($('#chartScatter')));
  const maxN = Math.max(...DATA.departments.map((d) => d.count));
  const data = DATA.departments.map((d) => ({
    name: d.name, value: [d.eduYears, d.pctUrban, d.count, d.ich],
    symbolSize: 14 + 46 * Math.sqrt(d.count / maxN),
    itemStyle: { color: BLUE.p500, opacity: .8, borderColor: '#fff', borderWidth: 1.5 },
  }));
  c.setOption({
    textStyle: { fontFamily: FONT },
    tooltip: { ...baseTooltip, trigger: 'item',
      formatter: (p) => `<b>${p.data.name}</b><br/>Escolaridad: ${p.value[0]} años<br/>Urbano: ${p.value[1]}%<br/>Población: ${fmt(p.value[2])}<br/>ICH: ${p.value[3]}` },
    grid: { left: 8, right: 20, top: 20, bottom: 30, containLabel: true },
    xAxis: { type: 'value', name: 'Años de escolaridad', nameLocation: 'middle', nameGap: 28, nameTextStyle: { color: BLUE.muted, fontFamily: FONT }, ...axisStyle, scale: true },
    yAxis: { type: 'value', name: '% urbano', nameTextStyle: { color: BLUE.muted, fontFamily: FONT }, ...axisStyle, scale: true, axisLabel: { ...axisStyle.axisLabel, formatter: (v) => v + '%' } },
    series: [{ type: 'scatter', data,
      label: { show: true, formatter: (p) => p.data.name, position: 'top', color: BLUE.ink, fontFamily: FONT, fontSize: 11, fontWeight: 600 },
      emphasis: { itemStyle: { color: BLUE.p700, opacity: 1 }, scale: 1.15 } }],
  });
}

/* ---------- reveal on scroll ---------- */
function setupReveal() {
  document.querySelectorAll('.card, .sec-head, .step, .kpi').forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

main().catch((e) => { console.error(e); document.querySelectorAll('.loading').forEach((l) => l.textContent = 'Error cargando datos: ' + e.message); });
