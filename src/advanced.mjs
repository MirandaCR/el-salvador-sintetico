// advanced.mjs — modelos avanzados del roadmap sobre los microdatos sintéticos.
//  1) Logit ORDENADO de nivel educativo (MLE)
//  2) Logit MULTINOMIAL de sector ocupacional (elección discreta, MLE softmax)
//  3) Árbol de decisión (CART) para P(educación superior) + importancias
//  4) SAR (spatial lag) e 5) GWR (regresión geográficamente ponderada) a nivel municipio
//  6) Clustering k-means de municipios (tipología territorial)
//  7) Monte Carlo: estabilidad del ranking municipal de ICH
//  8) Escenarios estructurales (recomputa ICH subiendo escolaridad)
// Salida: data/processed/advanced.json y dashboard/data/advanced.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

// ---------- diccionarios ----------
const EDU_ORDER = ['ninguno', 'primaria', 'secundaria', 'bachillerato', 'tecnico', 'universitario', 'posgrado']
const EDU_IDX = Object.fromEntries(EDU_ORDER.map((k, i) => [k, i]))
const HIGHER_MIN = 4 // tecnico o más
const DEPTS = ['San Salvador', 'La Libertad', 'Santa Ana', 'Sonsonate', 'San Miguel', 'Ahuachapán', 'Usulután', 'La Paz', 'Cuscatlán', 'La Unión', 'Chalatenango', 'Morazán', 'San Vicente', 'Cabañas']
const DEPT_IDX = Object.fromEntries(DEPTS.map((d, i) => [d, i]))

// ocupación -> sector (keywords, minúsculas sin tildes)
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const SECTORS = ['Agro', 'Comercio', 'Comida y hogar', 'Industria y construcción', 'Transporte', 'Servicios y Estado']
function sectorOf(occ) {
  const o = norm(occ)
  if (/cultivo|agricol|ganad|pesca|silvicult|pecuari|cafe|forestal/.test(o)) return 0
  if (/restaurante|comida|hogares como|alojamiento|bebidas|hospeda/.test(o)) return 2
  if (/transporte|almacenamiento|mensajeri|correo|logistic/.test(o)) return 4
  if (/fabricacion|elaboracion|construccion|prendas|confeccion|textil|manufactur|instalacion|reparacion|panaderia|metal|madera|calzado/.test(o)) return 3
  if (/administracion publica|ensenanza|educacion|salud|hospital|financ|seguro|juridic|contab|profesional|cientific|tecnic|informacion|telecomunic|inmobili|publicidad|consultor/.test(o)) return 5
  if (/venta al por menor|venta al por mayor|comercio|reparacion de vehiculos/.test(o)) return 1
  return 5 // resto -> servicios
}

// ---------- álgebra ----------
function matInverse(A) {
  const n = A.length
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r
    if (Math.abs(M[piv][c]) < 1e-12) { M[piv][c] = 1e-9 }
    ;[M[c], M[piv]] = [M[piv], M[c]]
    const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j] }
  }
  return M.map((r) => r.slice(n))
}
const sigmoid = (z) => 1 / (1 + Math.exp(-z))

// ---------- leer microdatos ----------
console.log('Leyendo microdatos...')
const COLS = ['age', 'sex', 'education_level', 'area', 'department', 'occupation']
const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
const rows = []
for (const f of files) {
  const buf = readFileSync(`data/raw/${f}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rs = await parquetReadObjects({ file: ab, columns: COLS, compressors })
  for (const r of rs) rows.push(r)
}
const N = rows.length
// features base
const ageArr = rows.map((r) => Number(r.age))
const ageMean = ageArr.reduce((a, b) => a + b, 0) / N
const ageSd = Math.sqrt(ageArr.reduce((s, a) => s + (a - ageMean) ** 2, 0) / N)
const feat = rows.map((r) => {
  const ac = (Number(r.age) - ageMean) / ageSd
  const base = [ac, ac * ac, r.sex === 'Femenino' ? 1 : 0, r.area === 'urbano' ? 1 : 0]
  const dum = new Array(13).fill(0); const di = DEPT_IDX[r.department]; if (di > 0) dum[di - 1] = 1
  return base.concat(dum)
})
const FNAMES = ['edad', 'edad²', 'mujer', 'urbano', ...DEPTS.slice(1).map((d) => 'dep:' + d)]
const eduY = rows.map((r) => EDU_IDX[r.education_level])
const higher = rows.map((r) => (EDU_IDX[r.education_level] >= HIGHER_MIN ? 1 : 0))
const sectorY = rows.map((r) => sectorOf(r.occupation))
console.log(`N=${N}, features=${FNAMES.length}`)

const out = { meta: { n: N, nota: 'Modelos avanzados sobre datos SINTÉTICOS: ilustran método, no efectos reales.' } }

// ============================================================
// 1) LOGIT ORDENADO (educación, 7 categorías) — MLE por Adam
// ============================================================
{
  const K = 7, P = feat.length ? feat[0].length : 0
  let beta = new Array(P).fill(0)
  // cutpoints via reparam: tau_1=a0, tau_j=tau_{j-1}+exp(a_j)
  let a = new Array(K - 1).fill(0); for (let j = 0; j < K - 1; j++) a[j] = j === 0 ? -2 : Math.log(0.9)
  const cutsFromA = (a) => { const t = [a[0]]; for (let j = 1; j < K - 1; j++) t.push(t[j - 1] + Math.exp(a[j])); return t }
  const F = sigmoid
  function grad() {
    const tau = cutsFromA(a)
    const gB = new Array(P).fill(0); const gA = new Array(K - 1).fill(0); let ll = 0
    for (let i = 0; i < N; i++) {
      const xb = feat[i].reduce((s, x, k) => s + x * beta[k], 0)
      const j = eduY[i]
      const aHi = j < K - 1 ? tau[j] - xb : Infinity
      const aLo = j > 0 ? tau[j - 1] - xb : -Infinity
      const Fhi = j < K - 1 ? F(aHi) : 1, Flo = j > 0 ? F(aLo) : 0
      const p = Math.max(1e-12, Fhi - Flo)
      ll += Math.log(p)
      const fhi = j < K - 1 ? Fhi * (1 - Fhi) : 0, flo = j > 0 ? Flo * (1 - Flo) : 0
      const dB = -(fhi - flo) / p // ∂logp/∂xb * (∂xb/∂β=x) ; ∂logp/∂β = -x(fhi-flo)/p
      for (let k = 0; k < P; k++) gB[k] += dB * feat[i][k]
      // wrt cutpoints (chain to a via reparam)
      if (j < K - 1) { const dTauHi = fhi / p; // ∂logp/∂tau_j
        // tau_j depends on a_0..a_j
        gA[0] += dTauHi; for (let m = 1; m <= j; m++) gA[m] += dTauHi * Math.exp(a[m]) }
      if (j > 0) { const dTauLo = -flo / p; gA[0] += dTauLo; for (let m = 1; m <= j - 1; m++) gA[m] += dTauLo * Math.exp(a[m]) }
    }
    return { gB, gA, ll }
  }
  // Adam
  const lr = 0.05, b1 = 0.9, b2 = 0.999, eps = 1e-8
  let mB = new Array(P).fill(0), vB = new Array(P).fill(0), mA = new Array(K - 1).fill(0), vA = new Array(K - 1).fill(0)
  let ll0 = -Infinity
  for (let t = 1; t <= 300; t++) {
    const { gB, gA, ll } = grad()
    for (let k = 0; k < P; k++) { const g = gB[k] / N; mB[k] = b1 * mB[k] + (1 - b1) * g; vB[k] = b2 * vB[k] + (1 - b2) * g * g; beta[k] += lr * (mB[k] / (1 - b1 ** t)) / (Math.sqrt(vB[k] / (1 - b2 ** t)) + eps) }
    for (let k = 0; k < K - 1; k++) { const g = gA[k] / N; mA[k] = b1 * mA[k] + (1 - b1) * g; vA[k] = b2 * vA[k] + (1 - b2) * g * g; a[k] += lr * (mA[k] / (1 - b1 ** t)) / (Math.sqrt(vA[k] / (1 - b2 ** t)) + eps) }
    if (t % 100 === 0) { ll0 = ll }
  }
  const { ll } = grad()
  const coef = FNAMES.map((name, k) => ({ name, beta: +beta[k].toFixed(4), oddsRatio: +Math.exp(beta[k]).toFixed(3) }))
  out.orderedLogit = { ll: +ll.toFixed(0), cutpoints: cutsFromA(a).map((v) => +v.toFixed(3)), coef, key: { urbano: +beta[3].toFixed(3), mujer: +beta[2].toFixed(3) } }
  console.log(`[ordered logit] LL=${ll.toFixed(0)} urbano β=${beta[3].toFixed(3)} (OR=${Math.exp(beta[3]).toFixed(2)}) mujer β=${beta[2].toFixed(3)} cutpoints ok=${cutsFromA(a).every((v, i, arr) => i === 0 || v > arr[i - 1])}`)
}

// ============================================================
// 2) LOGIT MULTINOMIAL (sector ocupacional) — softmax MLE
// ============================================================
{
  const C = SECTORS.length, P = feat[0].length + 1 // +1 intercepto
  const X = feat.map((f) => [1, ...f])
  let W = Array.from({ length: C }, () => new Array(P).fill(0))
  const lr = 0.1
  for (let t = 1; t <= 250; t++) {
    const G = Array.from({ length: C }, () => new Array(P).fill(0))
    for (let i = 0; i < N; i++) {
      const z = W.map((w) => X[i].reduce((s, x, k) => s + x * w[k], 0))
      const mx = Math.max(...z); const ex = z.map((v) => Math.exp(v - mx)); const Z = ex.reduce((a, b) => a + b, 0)
      const pr = ex.map((v) => v / Z)
      for (let c = 0; c < C; c++) { const d = pr[c] - (sectorY[i] === c ? 1 : 0); const xi = X[i]; const gc = G[c]; for (let k = 0; k < P; k++) gc[k] += d * xi[k] }
    }
    for (let c = 0; c < C; c++) for (let k = 0; k < P; k++) W[c][k] -= lr * G[c][k] / N
  }
  // efectos: probabilidad media por sector, y cambio al fijar urbano=1/0 y mujer=1/0
  function avgProb(mod) {
    const acc = new Array(C).fill(0)
    for (let i = 0; i < N; i++) {
      const x = [1, ...feat[i]]; if (mod) mod(x)
      const z = W.map((w) => x.reduce((s, v, k) => s + v * w[k], 0)); const mx = Math.max(...z); const ex = z.map((v) => Math.exp(v - mx)); const Z = ex.reduce((a, b) => a + b, 0)
      for (let c = 0; c < C; c++) acc[c] += ex[c] / Z
    }
    return acc.map((v) => v / N)
  }
  const base = avgProb(null)
  const urb1 = avgProb((x) => { x[4] = 1 }), urb0 = avgProb((x) => { x[4] = 0 }) // idx: [1,edad,edad2,mujer(idx3),urbano(idx4)]
  const fem1 = avgProb((x) => { x[3] = 1 }), fem0 = avgProb((x) => { x[3] = 0 })
  out.multinomial = {
    sectors: SECTORS,
    baseProb: base.map((v) => +(100 * v).toFixed(1)),
    urbanEffect: SECTORS.map((s, c) => +(100 * (urb1[c] - urb0[c])).toFixed(1)),
    femaleEffect: SECTORS.map((s, c) => +(100 * (fem1[c] - fem0[c])).toFixed(1)),
  }
  console.log(`[multinomial] base%=${out.multinomial.baseProb.join(',')}  femaleEffect(pp)=${out.multinomial.femaleEffect.join(',')}`)
}

// ============================================================
// 3) ÁRBOL DE DECISIÓN (CART) para educación superior
// ============================================================
{
  // features reducidas e interpretables
  const TF = ['edad', 'mujer', 'urbano', 'depSanSalvador', 'depLaLibertad']
  const Xt = rows.map((r) => [Number(r.age), r.sex === 'Femenino' ? 1 : 0, r.area === 'urbano' ? 1 : 0, r.department === 'San Salvador' ? 1 : 0, r.department === 'La Libertad' ? 1 : 0])
  // split train/test determinista (por índice)
  const tr = [], te = []
  for (let i = 0; i < N; i++) (i % 5 === 0 ? te : tr).push(i)
  const gini = (idx) => { let p = 0; for (const i of idx) p += higher[i]; p /= idx.length || 1; return 1 - p * p - (1 - p) ** 2 }
  const imp = new Array(TF.length).fill(0)
  function build(idx, depth) {
    const n = idx.length; let pos = 0; for (const i of idx) pos += higher[i]
    const node = { n, p: +(pos / n).toFixed(3) }
    if (depth >= 3 || n < 2000 || pos === 0 || pos === n) { node.leaf = true; node.pred = pos / n >= 0.5 ? 1 : 0; return node }
    const g0 = gini(idx); let best = null
    for (let f = 0; f < TF.length; f++) {
      const cont = f === 0
      const thresholds = cont ? [25, 30, 40, 50] : [0.5]
      for (const th of thresholds) {
        const L = [], R = []; for (const i of idx) (Xt[i][f] <= th ? L : R).push(i)
        if (L.length < 500 || R.length < 500) continue
        const g = (L.length * gini(L) + R.length * gini(R)) / n
        const gain = g0 - g
        if (!best || gain > best.gain) best = { f, th, L, R, gain }
      }
    }
    if (!best || best.gain < 1e-4) { node.leaf = true; node.pred = pos / n >= 0.5 ? 1 : 0; return node }
    imp[best.f] += best.gain * n
    node.feature = TF[best.f]; node.threshold = best.th; node.gain = +best.gain.toFixed(4)
    node.left = build(best.L, depth + 1); node.right = build(best.R, depth + 1)
    return node
  }
  const tree = build(tr, 0)
  function predict(node, i) { if (node.leaf) return node.pred; const f = TF.indexOf(node.feature); return Xt[i][f] <= node.threshold ? predict(node.left, i) : predict(node.right, i) }
  let correct = 0, tp = 0, fp = 0, fn = 0
  for (const i of te) { const yhat = predict(tree, i); if (yhat === higher[i]) correct++; if (yhat === 1 && higher[i] === 1) tp++; if (yhat === 1 && higher[i] === 0) fp++; if (yhat === 0 && higher[i] === 1) fn++ }
  const impSum = imp.reduce((a, b) => a + b, 0) || 1
  out.tree = {
    accuracy: +(correct / te.length).toFixed(3),
    baseRate: +(higher.reduce((a, b) => a + b, 0) / N).toFixed(3),
    importances: TF.map((f, k) => ({ name: f, importance: +(imp[k] / impSum).toFixed(3) })).sort((a, b) => b.importance - a.importance),
    tree,
  }
  console.log(`[tree] accuracy=${out.tree.accuracy} baseRate=${out.tree.baseRate} topFeat=${out.tree.importances[0].name}`)
}

// ============================================================
// 4-6) ESPACIAL (SAR, GWR) + CLUSTERING — nivel municipio
// ============================================================
{
  const agg = JSON.parse(readFileSync('data/processed/aggregates.json', 'utf8'))
  const cent = JSON.parse(readFileSync('dashboard/data/muni_centroids.json', 'utf8'))
  const M = agg.municipalities.filter((m) => cent[m.name])
  const names = M.map((m) => m.name)
  const n = M.length
  const lon = M.map((m) => cent[m.name][0]), lat = M.map((m) => cent[m.name][1])
  const dist = (i, j) => Math.hypot(lon[i] - lon[j], lat[i] - lat[j])

  // matriz W por k vecinos más cercanos (k=5), fila-estandarizada
  const k = 5
  const W = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    const d = names.map((_, j) => ({ j, d: dist(i, j) })).filter((o) => o.j !== i).sort((x, y) => x.d - y.d).slice(0, k)
    for (const o of d) W[i][o.j] = 1 / k
  }
  const Wy = (v) => v.map((_, i) => W[i].reduce((s, w, j) => s + w * v[j], 0))

  // ----- SAR: ICH = ρ W·ICH + Xβ  (grid MLE sobre ρ) -----
  const y = M.map((m) => m.ich)
  const X = M.map((m) => [1, m.pctUrban, m.pctHigher])
  const p = 3
  function ols(yv, Xm) {
    const XtX = Array.from({ length: p }, () => new Array(p).fill(0)); const Xty = new Array(p).fill(0)
    for (let i = 0; i < yv.length; i++) { for (let a = 0; a < p; a++) { Xty[a] += Xm[i][a] * yv[i]; for (let b = 0; b < p; b++) XtX[a][b] += Xm[i][a] * Xm[i][b] } }
    const inv = matInverse(XtX); const beta = inv.map((r) => r.reduce((s, v, j) => s + v * Xty[j], 0))
    let rss = 0; for (let i = 0; i < yv.length; i++) { const yh = Xm[i].reduce((s, v, j) => s + v * beta[j], 0); rss += (yv[i] - yh) ** 2 }
    return { beta, rss }
  }
  function logdetIminusRhoW(rho) {
    // det(I - rho W) por eliminación
    const A = Array.from({ length: n }, (_, i) => W[i].map((w, j) => (i === j ? 1 : 0) - rho * w))
    let logdet = 0
    for (let c = 0; c < n; c++) {
      let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
      if (piv !== c) { [A[c], A[piv]] = [A[piv], A[c]]; logdet += Math.log(1) } // signo no afecta magnitud del LL aquí
      const d = A[c][c]; if (Math.abs(d) < 1e-12) return -Infinity
      logdet += Math.log(Math.abs(d))
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / d; for (let j = c; j < n; j++) A[r][j] -= f * A[c][j] }
    }
    return logdet
  }
  let bestRho = 0, bestLL = -Infinity, bestBeta = null
  for (let rho = -0.9; rho <= 0.9; rho += 0.01) {
    const ystar = y.map((v, i) => v - rho * Wy(y)[i])
    const { beta, rss } = ols(ystar, X)
    const sig2 = rss / n
    const ll = logdetIminusRhoW(rho) - (n / 2) * Math.log(2 * Math.PI * sig2) - rss / (2 * sig2)
    if (ll > bestLL) { bestLL = ll; bestRho = rho; bestBeta = beta }
  }
  out.sar = { rho: +bestRho.toFixed(3), beta: bestBeta.map((b) => +b.toFixed(3)), vars: ['const', 'pctUrban', 'pctHigher'], interpret: bestRho > 0 ? 'positivo: el nivel de un municipio es "arrastrado" por sus vecinos (derrames)' : 'sin arrastre espacial' }
  console.log(`[SAR] rho=${bestRho.toFixed(3)} (${out.sar.interpret.slice(0, 30)}...)`)

  // ----- GWR: eduYears ~ pctUrban, coeficiente local por municipio (kernel gaussiano) -----
  const yg = M.map((m) => m.eduYears), xg = M.map((m) => m.pctUrban)
  const dmax = Math.max(...names.map((_, i) => Math.max(...names.map((_, j) => dist(i, j)))))
  const bw = dmax * 0.35
  const gwr = M.map((m, i) => {
    let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0
    for (let j = 0; j < n; j++) { const w = Math.exp(-0.5 * (dist(i, j) / bw) ** 2); sw += w; swx += w * xg[j]; swy += w * yg[j]; swxx += w * xg[j] * xg[j]; swxy += w * xg[j] * yg[j] }
    const denom = sw * swxx - swx * swx
    const slope = denom !== 0 ? (sw * swxy - swx * swy) / denom : 0
    return { name: m.name, slope: +slope.toFixed(4) }
  })
  out.gwr = { variable: 'pendiente local escolaridad~%urbano', local: gwr, range: [Math.min(...gwr.map((g) => g.slope)), Math.max(...gwr.map((g) => g.slope))].map((v) => +v.toFixed(3)) }
  console.log(`[GWR] pendiente local rango=[${out.gwr.range.join(', ')}]`)

  // ----- k-means clustering (tipología) -----
  const featM = M.map((m) => [m.eduYears, m.pctUrban, m.pctHigher, m.meanAge])
  const dims = 4
  const mean = new Array(dims).fill(0), sd = new Array(dims).fill(0)
  for (const f of featM) for (let d = 0; d < dims; d++) mean[d] += f[d] / n
  for (const f of featM) for (let d = 0; d < dims; d++) sd[d] += (f[d] - mean[d]) ** 2 / n
  for (let d = 0; d < dims; d++) sd[d] = Math.sqrt(sd[d]) || 1
  const Z = featM.map((f) => f.map((v, d) => (v - mean[d]) / sd[d]))
  const K = 4
  // init determinista: percentiles del ICH
  const orderByIch = M.map((m, i) => ({ i, ich: m.ich })).sort((a, b) => a.ich - b.ich)
  let cents = [0, 1, 2, 3].map((q) => Z[orderByIch[Math.floor((q + 0.5) / K * n)].i].slice())
  let assign = new Array(n).fill(0)
  for (let it = 0; it < 50; it++) {
    for (let i = 0; i < n; i++) { let bd = Infinity, bc = 0; for (let c = 0; c < K; c++) { const d = Z[i].reduce((s, v, k2) => s + (v - cents[c][k2]) ** 2, 0); if (d < bd) { bd = d; bc = c } } assign[i] = bc }
    const nc = new Array(K).fill(0); const sums = Array.from({ length: K }, () => new Array(dims).fill(0))
    for (let i = 0; i < n; i++) { nc[assign[i]]++; for (let d = 0; d < dims; d++) sums[assign[i]][d] += Z[i][d] }
    for (let c = 0; c < K; c++) if (nc[c]) cents[c] = sums[c].map((s) => s / nc[c])
  }
  // etiquetar clusters por ICH medio
  const clusterIch = new Array(K).fill(0), clusterN = new Array(K).fill(0)
  for (let i = 0; i < n; i++) { clusterIch[assign[i]] += M[i].ich; clusterN[assign[i]]++ }
  const clusterMean = clusterIch.map((s, c) => s / (clusterN[c] || 1))
  const rank = [...clusterMean.keys()].sort((a, b) => clusterMean[a] - clusterMean[b])
  const LABELS = {}; const labelText = ['Rezago rural', 'En desarrollo', 'Emergente urbano', 'Núcleo desarrollado']
  rank.forEach((c, r) => LABELS[c] = labelText[r])
  out.clusters = {
    k: K,
    assignment: M.map((m, i) => ({ name: m.name, cluster: LABELS[assign[i]], ich: m.ich })),
    summary: rank.map((c, r) => ({ label: labelText[r], nMunis: clusterN[c], ichMedio: +clusterMean[c].toFixed(1) })),
  }
  console.log(`[k-means] ${out.clusters.summary.map((s) => s.label + ':' + s.nMunis).join(' | ')}`)

  // ----- 7) Monte Carlo: estabilidad del ranking ICH municipal -----
  // usa SE del promedio educativo (eduStd/sqrt(n)) como fuente de incertidumbre
  const rankCount = M.map(() => new Array(n).fill(0))
  const T = 1000
  function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
  for (let t = 0; t < T; t++) {
    const sim = M.map((m) => { const se = m.eduStd / Math.sqrt(m.count); return { name: m.name, v: m.eduYears + se * randn() } })
    sim.sort((a, b) => b.v - a.v)
    sim.forEach((s, r) => { const idx = names.indexOf(s.name); rankCount[idx][r]++ })
  }
  const mc = M.map((m, i) => {
    let er = 0, top5 = 0; for (let r = 0; r < n; r++) { er += (r + 1) * rankCount[i][r] / T; if (r < 5) top5 += rankCount[i][r] / T }
    return { name: m.name, eduYears: m.eduYears, rankProm: +er.toFixed(1), probTop5: +(100 * top5).toFixed(0) }
  }).sort((a, b) => a.rankProm - b.rankProm)
  out.monteCarlo = { T, ranking: mc }
  console.log(`[monteCarlo] top1=${mc[0].name} (P(top5)=${mc[0].probTop5}%)`)

  // ----- 8) Escenario: componentes para recomputar ICH client-side -----
  out.scenario = {
    formula: 'ICH = 100·(0.5·norm(eduYears) + 0.3·norm(pctHigher) + 0.2·norm(pctUrban))',
    municipios: M.map((m) => ({ name: m.name, department: m.department, eduYears: m.eduYears, pctHigher: m.pctHigher, pctUrban: m.pctUrban, ich: m.ich })),
  }
}

writeFileSync('data/processed/advanced.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/advanced.json', JSON.stringify(out))
console.log('\nEscrito: data/processed/advanced.json y dashboard/data/advanced.json')
