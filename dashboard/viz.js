/* viz.js — helpers compartidos por los artículos (tema azul & blanco) */
window.VIZ = (() => {
  const BLUE = {
    seq: ['#eaf2fd', '#c2dbfa', '#86b7f0', '#4a90e2', '#1e6fe0', '#0b3d91', '#0a2e6e'],
    p700: '#0b3d91', p600: '#1257bd', p500: '#1e6fe0', p400: '#4a90e2', p300: '#86b7f0', p200: '#c2dbfa',
    teal: '#2e8bc0', ink: '#0a2540', muted: '#6b7c93', line: '#e4ecf7', amber: '#c77d0a', red: '#c0392b', green: '#1e8f55',
  };
  const FONT = 'Inter, system-ui, sans-serif';
  const fmt = (n) => Number(n).toLocaleString('es-SV');
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const EDU_LABEL = { ninguno: 'Ninguno', primaria: 'Primaria', secundaria: 'Secundaria', bachillerato: 'Bachillerato', tecnico: 'Técnico', universitario: 'Universitario', posgrado: 'Posgrado' };
  const baseTooltip = {
    backgroundColor: '#fff', borderColor: BLUE.line, borderWidth: 1,
    textStyle: { color: BLUE.ink, fontFamily: FONT, fontSize: 13 },
    extraCssText: 'box-shadow:0 8px 28px rgba(11,61,145,.14); border-radius:12px; padding:10px 12px;',
  };
  const axisStyle = {
    axisLine: { lineStyle: { color: BLUE.line } }, axisTick: { show: false },
    axisLabel: { color: BLUE.muted, fontFamily: FONT, fontSize: 12 },
    splitLine: { lineStyle: { color: BLUE.line, type: 'dashed' } },
  };
  const charts = [];
  const make = (el) => { const c = echarts.init(el); charts.push(c); return c; };
  window.addEventListener('resize', () => charts.forEach((c) => c && c.resize()));

  function reveal() {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('r'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    document.querySelectorAll('.r').forEach((el) => io.observe(el));
  }
  function progress() {
    const bar = document.createElement('div'); bar.className = 'progressbar'; document.body.appendChild(bar);
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (100 * scrollY / (h || 1)) + '%'; };
    document.addEventListener('scroll', upd, { passive: true }); upd();
  }
  const load = (url) => fetch(url).then((r) => r.json());
  return { BLUE, FONT, fmt, truncate, EDU_LABEL, baseTooltip, axisStyle, make, reveal, progress, load };
})();
