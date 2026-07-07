// survival.mjs — análisis de supervivencia (datos de estado actual / current-status).
// Evento: primera unión conyugal (marital_status != 'soltero'). Reloj: la EDAD.
// Como no hay fechas, tratamos la foto transversal como current-status data:
//   S(a) = proporción que sigue soltera a la edad a  (supervivencia de la soltería).
// Salidas: data/processed/survival.json y dashboard/data/survival.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

const HIGHER = new Set(['tecnico', 'universitario', 'posgrado'])
const AMIN = 18, AMAX = 80

// acumuladores: por edad, total y solteros, global y por grupo
function mk() { const t = {}, s = {}; for (let a = AMIN; a <= AMAX; a++) { t[a] = 0; s[a] = 0 } return { t, s } }
const G = { all: mk(), male: mk(), female: mk(), urban: mk(), rural: mk(), higher: mk(), nonHigher: mk() }
const muni = {} // name -> {t,s} + department

console.log('Leyendo microdatos...')
const COLS = ['age', 'sex', 'area', 'education_level', 'department', 'municipality', 'marital_status']
const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
// para la regresión logística (partnered ~ edad + edad² + mujer + urbano + superior)
const X = [], Y = []
let ageSum = 0, ageN = 0, age2Sum = 0
for (const f of files) {
  const buf = readFileSync(`data/raw/${f}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rs = await parquetReadObjects({ file: ab, columns: COLS, compressors })
  for (const r of rs) {
    const a = Number(r.age); if (a < AMIN || a > AMAX) continue
    const single = r.marital_status === 'soltero' ? 1 : 0
    const partnered = 1 - single
    const isF = r.sex === 'Femenino', isU = r.area === 'urbano', isH = HIGHER.has(r.education_level)
    G.all.t[a]++; if (single) G.all.s[a]++
    const g2 = isF ? G.female : G.male; g2.t[a]++; if (single) g2.s[a]++
    const g3 = isU ? G.urban : G.rural; g3.t[a]++; if (single) g3.s[a]++
    const g4 = isH ? G.higher : G.nonHigher; g4.t[a]++; if (single) g4.s[a]++
    const m = r.municipality; if (!muni[m]) muni[m] = { name: m, department: r.department, ...mk() }
    muni[m].t[a]++; if (single) muni[m].s[a]++
    ageSum += a; age2Sum += a * a; ageN++
    X.push([a, isF ? 1 : 0, isU ? 1 : 0, isH ? 1 : 0]); Y.push(partnered)
  }
  console.log('  ' + f + ' ok')
}

// curva de supervivencia S(a) con suavizado (media móvil 3) y mediana por interpolación
function curve(acc) {
  const ages = [], S = []
  for (let a = AMIN; a <= AMAX; a++) { ages.push(a); S.push(acc.t[a] ? acc.s[a] / acc.t[a] : null) }
  // suavizar
  const Sm = S.map((v, i) => {
    const win = [S[i - 1], S[i], S[i + 1]].filter((x) => x != null)
    return win.length ? win.reduce((p, q) => p + q, 0) / win.length : v
  })
  return { ages, S: Sm.map((v) => v == null ? null : +v.toFixed(4)) }
}
function median(acc) {
  let prev = null
  for (let a = AMIN; a <= AMAX; a++) {
    if (!acc.t[a]) continue
    const s = acc.s[a] / acc.t[a]
    if (s <= 0.5) {
      if (prev && prev.s > 0.5) { // interpolar entre prev.a y a
        const frac = (prev.s - 0.5) / (prev.s - s)
        return +(prev.a + frac * (a - prev.a)).toFixed(1)
      }
      return a
    }
    prev = { a, s }
  }
  return null
}

// ---------- regresión logística (current-status) por Adam ----------
const ageMean = ageSum / ageN, ageSd = Math.sqrt(age2Sum / ageN - ageMean * ageMean)
const feats = X.map(([a, f, u, h]) => { const ac = (a - ageMean) / ageSd; return [1, ac, ac * ac, f, u, h] })
const FN = ['(int)', 'edad', 'edad²', 'mujer', 'urbano', 'superior']
let beta = new Array(6).fill(0)
{
  const P = 6, n = feats.length; const b1 = 0.9, b2 = 0.999, eps = 1e-8, lr = 0.1
  let m = new Array(P).fill(0), v = new Array(P).fill(0)
  for (let t = 1; t <= 300; t++) {
    const g = new Array(P).fill(0)
    for (let i = 0; i < n; i++) { const z = feats[i].reduce((s, x, k) => s + x * beta[k], 0); const p = 1 / (1 + Math.exp(-z)); const d = p - Y[i]; const fi = feats[i]; for (let k = 0; k < P; k++) g[k] += d * fi[k] }
    for (let k = 0; k < P; k++) { const gg = g[k] / n; m[k] = b1 * m[k] + (1 - b1) * gg; v[k] = b2 * v[k] + (1 - b2) * gg * gg; beta[k] -= lr * (m[k] / (1 - b1 ** t)) / (Math.sqrt(v[k] / (1 - b2 ** t)) + eps) }
  }
}
const logit = { coef: FN.map((name, k) => ({ name, beta: +beta[k].toFixed(3), oddsRatio: +Math.exp(beta[k]).toFixed(3) })) }

// mediana por municipio (para el mapa)
const muniMedian = Object.values(muni).map((m) => ({ name: m.name, department: m.department, median: median(m) })).filter((x) => x.median != null)

const out = {
  meta: {
    nota: 'Supervivencia de la soltería sobre datos SINTÉTICOS y de estado actual (timing inferido de una foto, no observado). Doble cautela: dato sintético + current-status.',
    evento: 'primera unión (casado/unión libre/separado/viudo/divorciado)', reloj: 'edad',
  },
  medians: {
    overall: median(G.all), male: median(G.male), female: median(G.female),
    urban: median(G.urban), rural: median(G.rural), higher: median(G.higher), nonHigher: median(G.nonHigher),
  },
  curves: {
    ages: curve(G.all).ages,
    all: curve(G.all).S, male: curve(G.male).S, female: curve(G.female).S,
    urban: curve(G.urban).S, rural: curve(G.rural).S, higher: curve(G.higher).S, nonHigher: curve(G.nonHigher).S,
  },
  logit,
  muniMedian,
}
writeFileSync('data/processed/survival.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/survival.json', JSON.stringify(out))
console.log('\nMediana edad primera unión — global:', out.medians.overall, '| M:', out.medians.male, 'F:', out.medians.female, '| urbano:', out.medians.urban, 'rural:', out.medians.rural, '| superior:', out.medians.higher, 'no:', out.medians.nonHigher)
console.log('Logit (odds ratios): ' + logit.coef.slice(1).map((c) => `${c.name}=${c.oddsRatio}`).join(' '))
console.log('Muni con unión más temprana/tardía:', muniMedian.slice().sort((a, b) => a.median - b.median)[0], muniMedian.slice().sort((a, b) => b.median - a.median)[0])
console.log('Escrito: data/processed/survival.json y dashboard/data/survival.json')
