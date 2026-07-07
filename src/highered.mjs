// highered.mjs — análisis de educación superior (tercer y cuarto nivel).
//  A) Sobreeducación: % de universitarios/posgrado en actividades NO intensivas en conocimiento
//  B) Embudo educativo + techo de cristal (% mujeres por nivel, cae en posgrado?)
//  C) Concentración territorial (tasa de superior por municipio + cuánto se concentra el posgrado)
//  D) Proxy de utilización (share en alta calificación) — el retorno monetario queda para v2 (necesita ingresos)
// Salidas: data/processed/highered.json y dashboard/data/highered.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

const EDU_ORDER = ['ninguno', 'primaria', 'secundaria', 'bachillerato', 'tecnico', 'universitario', 'posgrado']
const EDU_LABEL = { ninguno: 'Ninguno', primaria: 'Primaria', secundaria: 'Secundaria', bachillerato: 'Bachillerato', tecnico: 'Técnico', universitario: 'Universitario', posgrado: 'Posgrado' }
const TERTIARY = new Set(['tecnico', 'universitario', 'posgrado'])  // tercer + cuarto nivel
const UNIV = new Set(['universitario', 'posgrado'])                 // para sobreeducación (deberían ser profesionales)

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
// actividad intensiva en conocimiento (que "requiere" superior)
function isHighSkill(occ) {
  return /ensen|educaci|hospital|salud|medic|enfermer|financ|banc|seguro|jurid|abogac|contab|cientif|ingenier|arquitect|profesional|consultor|informacion|telecomunic|program|software|investigaci|universidad|contabilidad|auditor/.test(norm(occ))
}

const inc = (o, k) => { o[k] = (o[k] || 0) + 1 }
const eduCount = {}, eduFemale = {}
let nAdults = 0
// sobreeducación
const over = { total: 0, mismatch: 0, M: { t: 0, m: 0 }, F: { t: 0, m: 0 }, urb: { t: 0, m: 0 }, rur: { t: 0, m: 0 } }
// territorial
const muni = {}, dept = {}
let totPosgrado = 0

console.log('Leyendo microdatos...')
const COLS = ['sex', 'education_level', 'area', 'department', 'municipality', 'occupation']
const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
for (const f of files) {
  const buf = readFileSync(`data/raw/${f}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rs = await parquetReadObjects({ file: ab, columns: COLS, compressors })
  for (const r of rs) {
    const ed = r.education_level, isF = r.sex === 'Femenino'
    nAdults++; inc(eduCount, ed); if (isF) inc(eduFemale, ed)

    if (UNIV.has(ed)) {
      const mm = !isHighSkill(r.occupation) ? 1 : 0
      over.total++; over.mismatch += mm
      const g = isF ? over.F : over.M; g.t++; g.m += mm
      const a = r.area === 'urbano' ? over.urb : over.rur; a.t++; a.m += mm
    }
    // territorial
    const m = r.municipality; if (!muni[m]) muni[m] = { name: m, department: r.department, n: 0, ter: 0 }
    muni[m].n++; if (TERTIARY.has(ed)) muni[m].ter++
    const d = r.department; if (!dept[d]) dept[d] = { name: d, n: 0, ter: 0, pos: 0 }
    dept[d].n++; if (TERTIARY.has(ed)) dept[d].ter++; if (ed === 'posgrado') { dept[d].pos++; totPosgrado++ }
  }
  console.log('  ' + f + ' ok')
}

// A) sobreeducación
const pct = (a, b) => +(100 * a / b).toFixed(1)
const overeducation = {
  rateOverall: pct(over.mismatch, over.total),
  nUniv: over.total,
  bySex: { Femenino: pct(over.F.m, over.F.t), Masculino: pct(over.M.m, over.M.t) },
  byArea: { urbano: pct(over.urb.m, over.urb.t), rural: pct(over.rur.m, over.rur.t) },
  nota: 'Aproximación: el dato de ocupación es por actividad económica (no cargo), así que mide "trabaja en actividad no intensiva en conocimiento".',
}

// B) embudo + techo de cristal
const funnel = EDU_ORDER.map((k) => ({ level: k, label: EDU_LABEL[k], count: eduCount[k] || 0, pctOfAdults: pct(eduCount[k] || 0, nAdults), pctFemale: pct(eduFemale[k] || 0, eduCount[k] || 1) }))
const glassCeiling = {
  pctFemaleBachillerato: pct(eduFemale['bachillerato'] || 0, eduCount['bachillerato'] || 1),
  pctFemaleUniversitario: pct(eduFemale['universitario'] || 0, eduCount['universitario'] || 1),
  pctFemalePosgrado: pct(eduFemale['posgrado'] || 0, eduCount['posgrado'] || 1),
}

// C) territorial
const muniList = Object.values(muni).map((m) => ({ name: m.name, department: m.department, tertiaryRate: pct(m.ter, m.n) })).sort((a, b) => b.tertiaryRate - a.tertiaryRate)
const deptList = Object.values(dept).map((d) => ({ name: d.name, tertiaryRate: pct(d.ter, d.n), shareOfPosgrado: pct(d.pos, totPosgrado) })).sort((a, b) => b.shareOfPosgrado - a.shareOfPosgrado)
const hhi = +deptList.reduce((s, d) => s + (d.shareOfPosgrado) ** 2, 0).toFixed(0) // HHI (0-10000) sobre shares en %
const concentration = {
  pctPosgradoTop3Dept: +deptList.slice(0, 3).reduce((s, d) => s + d.shareOfPosgrado, 0).toFixed(1),
  pctPosgradoSanSalvador: (deptList.find((d) => d.name === 'San Salvador') || {}).shareOfPosgrado,
  hhiDept: hhi,
  topMuni: muniList[0], bottomMuni: muniList[muniList.length - 1],
}

const out = {
  meta: { nota: 'Educación superior sobre datos SINTÉTICOS. Retorno monetario (Mincer) requiere ingresos → v2 con EHPM.', nAdults, totPosgrado },
  funnel, glassCeiling, overeducation,
  spatial: { muniTertiaryRate: muniList, deptTertiaryRate: deptList, concentration },
}
writeFileSync('data/processed/highered.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/highered.json', JSON.stringify(out))

console.log('\n[A sobreeducación] universitarios+posgrado en actividad NO intensiva en conocimiento:', overeducation.rateOverall + '%')
console.log('   por sexo F/M:', overeducation.bySex.Femenino + '% /', overeducation.bySex.Masculino + '%  | urbano/rural:', overeducation.byArea.urbano + '% /', overeducation.byArea.rural + '%')
console.log('[B techo de cristal] %mujeres bachillerato/universitario/posgrado:', glassCeiling.pctFemaleBachillerato, '/', glassCeiling.pctFemaleUniversitario, '/', glassCeiling.pctFemalePosgrado)
console.log('[C concentración] posgrado en San Salvador:', concentration.pctPosgradoSanSalvador + '%  | top3 deptos:', concentration.pctPosgradoTop3Dept + '%  | HHI:', hhi)
console.log('   muni superior top/bottom:', muniList[0].name, muniList[0].tertiaryRate + '%  /', muniList[muniList.length - 1].name, muniList[muniList.length - 1].tertiaryRate + '%')
console.log('Escrito: data/processed/highered.json y dashboard/data/highered.json')
