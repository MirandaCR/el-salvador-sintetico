// process.mjs
// Lee los 3 parquet del dataset sintetico y produce agregados JSON para el dashboard.
// Solo lee columnas estructuradas + listas (skills/hobbies) -> liviano en memoria.
// Salidas: data/processed/aggregates.json  y  dashboard/data/data.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

// ---------- diccionarios ----------
const EDU_YEARS = { ninguno: 0, primaria: 6, secundaria: 9, bachillerato: 12, tecnico: 14, universitario: 16, posgrado: 18 }
const EDU_ORDER = ['ninguno', 'primaria', 'secundaria', 'bachillerato', 'tecnico', 'universitario', 'posgrado']
const HIGHER = new Set(['tecnico', 'universitario', 'posgrado'])
const AGE_BINS = ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85+']
function ageBin(a) {
  if (a <= 24) return '18-24'
  if (a >= 85) return '85+'
  const lo = Math.floor(a / 5) * 5
  return `${lo}-${lo + 4}`
}
const STOP = new Set(('de la el en y a los las del un una con por para su sus al lo se que como mas más o e u ni ademas además tambien también sobre entre desde hasta muy sin sus le les mi tu es son ser estar cada donde cuando quien cual todo toda todos todas otro otra este esta ese esa').split(' '))

// ---------- acumuladores ----------
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n }
const totals = { n: 0, ageSum: 0, female: 0, urban: 0 }
const sex = {}, area = {}, edu = {}, marital = {}, household = {}, langs = {}
const pyramid = {}                              // bin -> {Masculino,Femenino}
const eduBySex = {}, eduByArea = {}, maritalBySex = {}
const occCount = {}                             // occupation -> n
const dept = {}                                 // department -> acumulador
const muni = {}                                 // municipality -> acumulador
const skillTerms = {}, hobbyTerms = {}
const skillPhrases = {}, hobbyPhrases = {}
const occBySex = {}                             // ocupacion -> {Masculino,Femenino}  (para sesgos)
const hobbyWordsBySex = { Masculino: {}, Femenino: {} } // palabra hobby por sexo (para sesgos)

function deptAcc(d) {
  if (!dept[d]) dept[d] = { name: d, n: 0, ageSum: 0, female: 0, urban: 0, edu: {}, marital: {}, household: {}, higher: 0, occ: {} }
  return dept[d]
}
function muniAcc(m, d) {
  if (!muni[m]) muni[m] = { name: m, department: d, n: 0, ageSum: 0, female: 0, urban: 0, eduYearsSum: 0, eduY2: 0, higher: 0 }
  return muni[m]
}

function tokenize(text) {
  return String(text).toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
}
function parseList(s) {
  if (!s) return []
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : [] } catch { return [] }
}

// ---------- lectura ----------
const COLS = ['sex', 'age', 'education_level', 'occupation', 'area', 'municipality', 'department',
  'marital_status', 'household_type', 'languages_spoken', 'skills_and_expertise_list', 'hobbies_and_interests_list']

const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
console.log(`Archivos parquet: ${files.length}`)

for (const file of files) {
  console.log(`  procesando ${file} ...`)
  const buf = readFileSync(`data/raw/${file}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rows = await parquetReadObjects({ file: ab, columns: COLS, compressors })

  for (const r of rows) {
    const age = Number(r.age)
    const s = r.sex, ar = r.area, ed = r.education_level, d = r.department, m = r.municipality
    totals.n++; totals.ageSum += age
    if (s === 'Femenino') totals.female++
    if (ar === 'urbano') totals.urban++

    inc(sex, s); inc(area, ar); inc(edu, ed); inc(marital, r.marital_status)
    inc(household, r.household_type); inc(langs, r.languages_spoken)
    inc(occCount, r.occupation)
    occBySex[r.occupation] = occBySex[r.occupation] || { Masculino: 0, Femenino: 0 }; occBySex[r.occupation][s]++

    const b = ageBin(age)
    pyramid[b] = pyramid[b] || {}; inc(pyramid[b], s)
    eduBySex[ed] = eduBySex[ed] || {}; inc(eduBySex[ed], s)
    eduByArea[ed] = eduByArea[ed] || {}; inc(eduByArea[ed], ar)
    maritalBySex[r.marital_status] = maritalBySex[r.marital_status] || {}; inc(maritalBySex[r.marital_status], s)

    const da = deptAcc(d)
    da.n++; da.ageSum += age
    if (s === 'Femenino') da.female++
    if (ar === 'urbano') da.urban++
    inc(da.edu, ed); inc(da.marital, r.marital_status); inc(da.household, r.household_type)
    if (HIGHER.has(ed)) da.higher++
    inc(da.occ, r.occupation)

    const ma = muniAcc(m, d)
    ma.n++; ma.ageSum += age
    if (s === 'Femenino') ma.female++
    if (ar === 'urbano') ma.urban++
    const yEdu = EDU_YEARS[ed] ?? 0
    ma.eduYearsSum += yEdu; ma.eduY2 += yEdu * yEdu
    if (HIGHER.has(ed)) ma.higher++

    // listas: frecuencia de frases y de palabras
    for (const p of parseList(r.skills_and_expertise_list)) { inc(skillPhrases, p); for (const w of tokenize(p)) inc(skillTerms, w) }
    for (const p of parseList(r.hobbies_and_interests_list)) { inc(hobbyPhrases, p); for (const w of tokenize(p)) { inc(hobbyTerms, w); inc(hobbyWordsBySex[s], w) } }
  }
}

// ---------- derivados ----------
const meanEduYears = (dist) => {
  let sum = 0, n = 0
  for (const k of EDU_ORDER) { const c = dist[k] || 0; sum += (EDU_YEARS[k] * c); n += c }
  return n ? sum / n : 0
}
const stdEduYears = (dist, mean) => {
  let s = 0, n = 0
  for (const k of EDU_ORDER) { const c = dist[k] || 0; s += c * (EDU_YEARS[k] - mean) ** 2; n += c }
  return n ? Math.sqrt(s / n) : 0
}
const topN = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))

// departamentos con indice de capital humano (min-max entre deptos)
const deptList = Object.values(dept).map((d) => ({
  name: d.name,
  count: d.n,
  pctFemale: +(100 * d.female / d.n).toFixed(1),
  pctUrban: +(100 * d.urban / d.n).toFixed(1),
  meanAge: +(d.ageSum / d.n).toFixed(1),
  eduYears: +meanEduYears(d.edu).toFixed(2),
  eduStd: +stdEduYears(d.edu, meanEduYears(d.edu)).toFixed(2),
  pctHigher: +(100 * d.higher / d.n).toFixed(1),
  eduDist: d.edu,
  marital: d.marital,
  household: d.household,
  topOccupations: topN(d.occ, 6),
}))

// Indice de Capital Humano Sintetico (ICH): min-max de 3 componentes -> 0..100 (ilustrativo)
function minmax(vals) { const mn = Math.min(...vals), mx = Math.max(...vals); return (v) => mx === mn ? 50 : (v - mn) / (mx - mn) }
const nEdu = minmax(deptList.map((d) => d.eduYears))
const nHi = minmax(deptList.map((d) => d.pctHigher))
const nUrb = minmax(deptList.map((d) => d.pctUrban))
for (const d of deptList) {
  d.ich = +(100 * (0.5 * nEdu(d.eduYears) + 0.3 * nHi(d.pctHigher) + 0.2 * nUrb(d.pctUrban))).toFixed(1)
}
deptList.sort((a, b) => b.count - a.count)

const muniList = Object.values(muni).map((m) => {
  const mean = m.eduYearsSum / m.n
  return {
    name: m.name,
    department: m.department,
    count: m.n,
    pctFemale: +(100 * m.female / m.n).toFixed(1),
    pctUrban: +(100 * m.urban / m.n).toFixed(1),
    meanAge: +(m.ageSum / m.n).toFixed(1),
    eduYears: +mean.toFixed(2),
    eduStd: +Math.sqrt(Math.max(0, m.eduY2 / m.n - mean * mean)).toFixed(2),
    pctHigher: +(100 * m.higher / m.n).toFixed(1),
  }
}).sort((a, b) => b.count - a.count)

// índice ICH municipal (min-max entre municipios, misma fórmula que deptos)
const nMEdu = minmax(muniList.map((m) => m.eduYears))
const nMHi = minmax(muniList.map((m) => m.pctHigher))
const nMUrb = minmax(muniList.map((m) => m.pctUrban))
for (const m of muniList) m.ich = +(100 * (0.5 * nMEdu(m.eduYears) + 0.3 * nMHi(m.pctHigher) + 0.2 * nMUrb(m.pctUrban))).toFixed(1)

// ---------- sesgos (bias) ----------
const baselineFemale = +(100 * totals.female / totals.n).toFixed(1)
const occGender = Object.entries(occBySex).map(([name, s]) => { const nn = s.Masculino + s.Femenino; return { name, n: nn, pctFemale: +(100 * s.Femenino / nn).toFixed(1) } }).filter((o) => o.n >= 400)
const hobbyAll = new Set([...Object.keys(hobbyWordsBySex.Masculino), ...Object.keys(hobbyWordsBySex.Femenino)])
const hobbyGender = [...hobbyAll].map((w) => { const M = hobbyWordsBySex.Masculino[w] || 0, F = hobbyWordsBySex.Femenino[w] || 0, nn = M + F; return { w, n: nn, pctFemale: +(100 * F / nn).toFixed(1) } }).filter((x) => x.n >= 300)
const bias = {
  baselineFemale,
  occupation: {
    mostFemale: [...occGender].sort((a, b) => b.pctFemale - a.pctFemale).slice(0, 8),
    mostMale: [...occGender].sort((a, b) => a.pctFemale - b.pctFemale).slice(0, 8),
  },
  hobbies: {
    female: [...hobbyGender].sort((a, b) => b.pctFemale - a.pctFemale).slice(0, 12),
    male: [...hobbyGender].sort((a, b) => a.pctFemale - b.pctFemale).slice(0, 12),
  },
}

const pyramidArr = AGE_BINS.map((b) => ({ bin: b, Masculino: pyramid[b]?.Masculino || 0, Femenino: pyramid[b]?.Femenino || 0 }))

// ---------- salida ----------
const out = {
  meta: {
    dataset: 'nvidia/Nemotron-Personas-El-Salvador',
    license: 'CC-BY-4.0',
    naturaleza: 'SINTETICO: personas generadas por IA, calibradas a distribuciones demograficas. No son individuos reales.',
    totalPersonas: totals.n,
    nDepartamentos: deptList.length,
    nMunicipios: muniList.length,
    nOcupaciones: Object.keys(occCount).length,
    geometria: 'geoBoundaries ADM1 (solo lienzo cartografico)',
  },
  kpis: {
    totalPersonas: totals.n,
    edadPromedio: +(totals.ageSum / totals.n).toFixed(1),
    pctFemenino: +(100 * totals.female / totals.n).toFixed(1),
    pctUrbano: +(100 * totals.urban / totals.n).toFixed(1),
    nDepartamentos: deptList.length,
    nMunicipios: muniList.length,
    nOcupaciones: Object.keys(occCount).length,
    eduYearsGlobal: +meanEduYears(edu).toFixed(2),
    pctHigherGlobal: +(100 * EDU_ORDER.filter((k) => HIGHER.has(k)).reduce((s, k) => s + (edu[k] || 0), 0) / totals.n).toFixed(1),
  },
  distributions: { sex, area, edu, marital, household, langs },
  eduOrder: EDU_ORDER,
  pyramid: pyramidArr,
  crosstabs: { eduBySex, eduByArea, maritalBySex },
  departments: deptList,
  municipalities: muniList,
  occupations: { top: topN(occCount, 20) },
  skills: { words: topN(skillTerms, 60), phrases: topN(skillPhrases, 25) },
  hobbies: { words: topN(hobbyTerms, 60), phrases: topN(hobbyPhrases, 25) },
  bias,
}

writeFileSync('data/processed/aggregates.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/data.json', JSON.stringify(out))
console.log(`\nListo. Personas: ${totals.n} | Deptos: ${deptList.length} | Municipios: ${muniList.length} | Ocupaciones: ${out.meta.nOcupaciones}`)
console.log('Escrito: data/processed/aggregates.json y dashboard/data/data.json')
