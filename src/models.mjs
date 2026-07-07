// models.mjs
// Calcula modelos REALES sobre los microdatos sintéticos y los guarda para las publicaciones:
//   1) OLS: años de educación ~ edad + edad² + mujer + urbano + dummies de departamento
//   2) LPM: prob(educación superior) ~ mismas covariables (modelo de probabilidad lineal)
//   3) Moran's I global + local (LISA) del capital humano entre departamentos (autocorrelación espacial)
//   4) Brechas cruda vs. condicional (mujer, urbano)
// Salida: data/processed/models.json  y  dashboard/data/models.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

const EDU_YEARS = { ninguno: 0, primaria: 6, secundaria: 9, bachillerato: 12, tecnico: 14, universitario: 16, posgrado: 18 }
const HIGHER = new Set(['tecnico', 'universitario', 'posgrado'])
const DEPTS = ['San Salvador', 'La Libertad', 'Santa Ana', 'Sonsonate', 'San Miguel', 'Ahuachapán', 'Usulután', 'La Paz', 'Cuscatlán', 'La Unión', 'Chalatenango', 'Morazán', 'San Vicente', 'Cabañas'];
const REF = 'San Salvador'
const DUM = DEPTS.filter((d) => d !== REF) // 13 dummies, ref = San Salvador

// ---------- álgebra lineal ----------
function matInverse(A) {
  const n = A.length
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    if (Math.abs(M[piv][col]) < 1e-12) throw new Error('matriz singular en col ' + col)
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const d = M[col][col]
    for (let j = 0; j < 2 * n; j++) M[col][j] /= d
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col]
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[col][j]
    }
  }
  return M.map((r) => r.slice(n))
}
const matVec = (A, v) => A.map((r) => r.reduce((s, a, j) => s + a * v[j], 0))
// CDF normal (Abramowitz-Stegun) -> p-valor bilateral
function normCdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p }
const pValue = (t) => 2 * (1 - normCdf(Math.abs(t)))
const stars = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : '')

// ---------- construcción de features ----------
const NAMES = ['(intercepto)', 'edad', 'edad²/100', 'mujer', 'urbano', ...DUM.map((d) => 'dep:' + d)]
function buildX(row) {
  const age = Number(row.age)
  const x = [1, age, (age * age) / 100, row.sex === 'Femenino' ? 1 : 0, row.area === 'urbano' ? 1 : 0]
  for (const d of DUM) x.push(row.department === d ? 1 : 0)
  return x
}

// OLS por acumulación de X'X y X'y (streaming)
function makeAccum(k) { return { XtX: Array.from({ length: k }, () => new Array(k).fill(0)), Xty: new Array(k).fill(0), yty: 0, sy: 0, n: 0 } }
function accum(a, x, y) {
  const k = x.length
  for (let i = 0; i < k; i++) { a.Xty[i] += x[i] * y; const xi = x[i]; const row = a.XtX[i]; for (let j = i; j < k; j++) row[j] += xi * x[j] }
  a.yty += y * y; a.sy += y; a.n++
}
function solveOLS(a) {
  const k = a.Xty.length
  for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) a.XtX[i][j] = a.XtX[j][i] // simetrizar
  const inv = matInverse(a.XtX)
  const beta = matVec(inv, a.Xty)
  const rss = a.yty - beta.reduce((s, b, i) => s + b * a.Xty[i], 0)
  const dof = a.n - k
  const sigma2 = rss / dof
  const ybar = a.sy / a.n
  const tss = a.yty - a.n * ybar * ybar
  const r2 = 1 - rss / tss
  const coef = NAMES.map((name, i) => {
    const se = Math.sqrt(sigma2 * inv[i][i])
    const t = beta[i] / se
    const p = pValue(t)
    return { name, beta: +beta[i].toFixed(4), se: +se.toFixed(4), t: +t.toFixed(2), p: +p.toFixed(4), sig: stars(p) }
  })
  return { coef, r2: +r2.toFixed(4), n: a.n, rmse: +Math.sqrt(sigma2).toFixed(3) }
}

// ---------- lectura microdatos ----------
const COLS = ['age', 'sex', 'education_level', 'area', 'department']
const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
const eduAcc = makeAccum(NAMES.length)
const higAcc = makeAccum(NAMES.length)
// brechas crudas
const g = { M: { n: 0, edu: 0 }, F: { n: 0, edu: 0 }, U: { n: 0, edu: 0 }, R: { n: 0, edu: 0 } }

console.log('Leyendo microdatos para modelos...')
for (const file of files) {
  const buf = readFileSync(`data/raw/${file}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rows = await parquetReadObjects({ file: ab, columns: COLS, compressors })
  for (const r of rows) {
    const yEdu = EDU_YEARS[r.education_level] ?? 0
    const yHig = HIGHER.has(r.education_level) ? 1 : 0
    const x = buildX(r)
    accum(eduAcc, x, yEdu)
    accum(higAcc, x, yHig)
    const gg = r.sex === 'Femenino' ? g.F : g.M; gg.n++; gg.edu += yEdu
    const ga = r.area === 'urbano' ? g.U : g.R; ga.n++; ga.edu += yEdu
  }
  console.log('  ' + file + ' ok')
}
const olsEdu = solveOLS(eduAcc)
const lpmHig = solveOLS(higAcc)

// brechas cruda vs condicional (coeficientes del OLS de educación)
const cFemale = olsEdu.coef.find((c) => c.name === 'mujer')
const cUrban = olsEdu.coef.find((c) => c.name === 'urbano')
const gaps = {
  gender: { raw: +((g.F.edu / g.F.n) - (g.M.edu / g.M.n)).toFixed(3), conditional: cFemale.beta, sig: cFemale.sig },
  area: { raw: +((g.U.edu / g.U.n) - (g.R.edu / g.R.n)).toFixed(3), conditional: cUrban.beta, sig: cUrban.sig },
}

// ---------- Moran's I (espacial) — reutilizable para depto y municipio ----------
const agg = JSON.parse(readFileSync('data/processed/aggregates.json', 'utf8'))
const QN = ['—', 'Alto-Alto', 'Bajo-Bajo', 'Alto-Bajo', 'Bajo-Alto']
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[b[i], b[j]] = [b[j], b[i]] } return b }
function coordsOf(feat) {
  const out = []; const g = feat.geometry
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  for (const poly of polys) for (const ring of poly) for (let i = 0; i < ring.length; i += 2) out.push(ring[i]) // downsample x2
  return out
}
// units: [{name, value}] ; geojson con properties[nameProp]
function computeMoran(units, geojson, nameProp, eps, PERM = 999) {
  const names = units.map((u) => u.name)
  const valByName = Object.fromEntries(units.map((u) => [u.name, u.value]))
  const pts = {}; geojson.features.forEach((f) => { const nm = f.properties[nameProp]; if (valByName[nm] != null) pts[nm] = coordsOf(f) })
  const present = names.filter((nm) => pts[nm])
  const n = present.length
  const near = (a, b) => { const A = pts[a], B = pts[b]; for (const p of A) for (const q of B) { const dx = p[0] - q[0], dy = p[1] - q[1]; if (dx * dx + dy * dy < eps * eps) return true } return false }
  const W = Array.from({ length: n }, () => new Array(n).fill(0))
  const neighborList = {}
  for (let i = 0; i < n; i++) { neighborList[present[i]] = []; for (let j = 0; j < n; j++) if (i !== j && near(present[i], present[j])) { W[i][j] = 1; neighborList[present[i]].push(present[j]) } }
  const Wrs = W.map((row) => { const s = row.reduce((a, b) => a + b, 0); return row.map((v) => (s ? v / s : 0)) })
  const x = present.map((nm) => valByName[nm])
  const xbar = x.reduce((a, b) => a + b, 0) / n
  const z = x.map((v) => v - xbar)
  const denom = z.reduce((s, v) => s + v * v, 0)
  const moranI = (zv) => { let num = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) num += Wrs[i][j] * zv[i] * zv[j]; return num / zv.reduce((s, v) => s + v * v, 0) }
  const I = moranI(z)
  let ge = 0; for (let r = 0; r < PERM; r++) if (moranI(shuffle(z)) >= I) ge++
  const pPerm = (ge + 1) / (PERM + 1)
  const expectedI = -1 / (n - 1)
  const sd = Math.sqrt(denom / n)
  const zz = z.map((v) => v / sd)
  const lag = zz.map((_, i) => Wrs[i].reduce((s, w, j) => s + w * zz[j], 0))
  const avgNb = Object.values(neighborList).reduce((s, a) => s + a.length, 0) / n
  const local = present.map((nm, i) => {
    const q = zz[i] > 0 ? (lag[i] > 0 ? 1 : 3) : (lag[i] > 0 ? 4 : 2)
    return { name: nm, value: +valByName[nm].toFixed(1), z: +zz[i].toFixed(3), lag: +lag[i].toFixed(3), quadrant: QN[q], Ii: +(zz[i] * lag[i]).toFixed(3) }
  })
  return {
    I: +I.toFixed(4), expected: +expectedI.toFixed(4), pseudoP: +pPerm.toFixed(3), nPerm: PERM, n, avgNeighbors: +avgNb.toFixed(1),
    significativo: pPerm < 0.05,
    scatter: local.map((d) => ({ name: d.name, z: d.z, lag: d.lag })), local, neighborList,
  }
}

const geoDept = JSON.parse(readFileSync('dashboard/data/departments.geojson', 'utf8'))
const geoMuni = JSON.parse(readFileSync('dashboard/data/municipios.geojson', 'utf8'))
const moranDept = computeMoran(agg.departments.map((d) => ({ name: d.name, value: d.ich })), geoDept, 'department', 0.035)
const moranMuni = computeMoran(agg.municipalities.map((m) => ({ name: m.name, value: m.ich })), geoMuni, 'municipality', 0.02)

// ---------- Portafolio de capital humano (trader x economista) ----------
// "retorno potencial" = necesidad (100 - ICH) ; "riesgo" = dispersión educativa (eduStd) ; peso = necesidad x población
const totPop = agg.departments.reduce((s, d) => s + d.count, 0)
const rawW = agg.departments.map((d) => (100 - d.ich) * d.count)
const sumW = rawW.reduce((a, b) => a + b, 0)
const portfolio = agg.departments.map((d, i) => ({
  name: d.name, ich: d.ich, retornoPotencial: +(100 - d.ich).toFixed(1),
  riesgo: d.eduStd, escolaridad: d.eduYears, poblacion: d.count,
  pesoPoblacion: +(100 * d.count / totPop).toFixed(1),
  asignacion: +(100 * rawW[i] / sumW).toFixed(1),
})).sort((a, b) => b.asignacion - a.asignacion)

// ---------- salida ----------
const out = {
  meta: { nota: 'Modelos sobre datos SINTÉTICOS: ilustran método, no efectos causales reales.', n: eduAcc.n, ref_departamento: REF },
  olsEducacion: olsEdu,
  lpmSuperior: lpmHig,
  gaps,
  moran: { variable: 'ICH por departamento (14 unidades)', ...moranDept },
  moranMuni: { variable: 'ICH por municipio (44 unidades)', ...moranMuni },
  portfolio,
}
writeFileSync('data/processed/models.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/models.json', JSON.stringify(out))

// ---------- resumen en consola ----------
console.log('\n== OLS años de educación (ref: San Salvador) ==  R²=' + olsEdu.r2 + '  n=' + olsEdu.n)
olsEdu.coef.slice(0, 5).forEach((c) => console.log(`  ${c.name.padEnd(12)} β=${c.beta}  se=${c.se}  t=${c.t} ${c.sig}`))
console.log('\n== Brechas ==  género: cruda=' + gaps.gender.raw + ' cond=' + gaps.gender.conditional + '  |  urbano: cruda=' + gaps.area.raw + ' cond=' + gaps.area.conditional)
console.log('\n== Moran I DEPTO (14) ==  I=' + moranDept.I + '  E=' + moranDept.expected + '  p=' + moranDept.pseudoP + '  vecinos_prom=' + moranDept.avgNeighbors)
console.log('== Moran I MUNI (44) ==  I=' + moranMuni.I + '  E=' + moranMuni.expected + '  p=' + moranMuni.pseudoP + '  vecinos_prom=' + moranMuni.avgNeighbors + (moranMuni.significativo ? '  *** SIGNIFICATIVO' : ''))
console.log('\n== Portafolio (top 5 asignación) ==')
portfolio.slice(0, 5).forEach((p) => console.log('  ' + p.name.padEnd(14) + ' asig=' + p.asignacion + '%  retornoPot=' + p.retornoPotencial + '  riesgo=' + p.riesgo))
console.log('\nEscrito: data/processed/models.json y dashboard/data/models.json')
