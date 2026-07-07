// nlp.mjs — análisis de texto (NLP clásico) sobre los narrativos sintéticos.
//  - Palabras más frecuentes en las METAS de carrera (¿con qué sueña el país?)
//  - Términos DISTINTIVOS por departamento (TF-IDF simplificado: sobre/infra-representación)
//  - Términos distintivos por sector ocupacional
// Salida: data/processed/nlp.json y dashboard/data/nlp.json
import { parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { readFileSync, writeFileSync, readdirSync } from 'fs'

const STOP = new Set(('de la el en y a los las del un una con por para su sus al lo se que como mas más o e u ni ademas además tambien también sobre entre desde hasta muy sin le les mi tu es son ser estar cada donde cuando quien cual todo toda todos todas otro otra este esta ese esa esos esas hay ha he han ya pero porque si no me te nos les lo su cual sus años año anos ano vida forma parte hacer tener poder querer gustar dia dias día días vez veces gran grande mismo misma solo sola tras cabe so aunque mientras segun según tan tanto poco mucha mucho muchos muchas algun alguna algunos algunas cosa cosas persona personas gente donde ademas mas está estan están').split(/\s+/))
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') // solo para sectorOf
function tok(t) { return String(t || '').toLowerCase().replace(/[^a-záéíóúñü\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)) }

const SECTORS = ['Agro', 'Comercio', 'Comida y hogar', 'Industria y construcción', 'Transporte', 'Servicios y Estado']
function sectorOf(occ) {
  const o = norm(occ)
  if (/cultivo|agricol|ganad|pesca|silvicult|pecuari|cafe|forestal/.test(o)) return 0
  if (/restaurante|comida|hogares como|alojamiento|bebidas|hospeda/.test(o)) return 2
  if (/transporte|almacenamiento|mensajeri|correo|logistic/.test(o)) return 4
  if (/fabricacion|elaboracion|construccion|prendas|confeccion|textil|manufactur|instalacion|reparacion|panaderia|metal|madera|calzado/.test(o)) return 3
  if (/administracion publica|ensenanza|educacion|salud|hospital|financ|seguro|juridic|contab|profesional|cientific|tecnic|informacion|telecomunic|inmobili|publicidad|consultor/.test(o)) return 5
  if (/venta al por menor|venta al por mayor|comercio|reparacion de vehiculos/.test(o)) return 1
  return 5
}

const inc = (o, k) => { o[k] = (o[k] || 0) + 1 }
const career = {}; let careerTot = 0
const deptW = {}, deptTot = {}
const secW = SECTORS.map(() => ({})), secTot = new Array(SECTORS.length).fill(0)
const global = {}; let globalTot = 0

console.log('Leyendo textos...')
const COLS = ['department', 'occupation', 'career_goals_and_ambitions', 'cultural_background']
const files = readdirSync('data/raw').filter((f) => f.endsWith('.parquet')).sort()
for (const f of files) {
  const buf = readFileSync(`data/raw/${f}`)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const rs = await parquetReadObjects({ file: ab, columns: COLS, compressors })
  for (const r of rs) {
    for (const w of tok(r.career_goals_and_ambitions)) { inc(career, w); careerTot++ }
    const d = r.department; deptW[d] = deptW[d] || {}; deptTot[d] = deptTot[d] || 0
    const sec = sectorOf(r.occupation)
    for (const w of tok(r.cultural_background)) {
      inc(deptW[d], w); deptTot[d]++
      inc(secW[sec], w); secTot[sec]++
      inc(global, w); globalTot++
    }
  }
  console.log('  ' + f + ' ok')
}

const topN = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))
// distintividad: (freq relativa en grupo) / (freq relativa global), con min de apariciones
function distinctive(groupCounts, groupTot, minC, n) {
  return Object.entries(groupCounts)
    .filter(([w, c]) => c >= minC && global[w])
    .map(([w, c]) => ({ name: w, score: +(((c / groupTot) / (global[w] / globalTot))).toFixed(2), count: c }))
    .sort((a, b) => b.score - a.score).slice(0, n)
}

const out = {
  meta: { nota: 'NLP clásico (frecuencias/TF-IDF) sobre textos SINTÉTICOS.', careerTokens: careerTot, culturalTokens: globalTot },
  careerTop: topN(career, 50),
  deptDistinctive: Object.fromEntries(Object.keys(deptW).map((d) => [d, distinctive(deptW[d], deptTot[d], 40, 8)])),
  sectorDistinctive: SECTORS.map((s, i) => ({ sector: s, terms: distinctive(secW[i], secTot[i], 40, 8) })),
}
writeFileSync('data/processed/nlp.json', JSON.stringify(out, null, 2))
writeFileSync('dashboard/data/nlp.json', JSON.stringify(out))
console.log('\nMetas top:', out.careerTop.slice(0, 12).map((x) => x.name).join(', '))
console.log('San Salvador distintivo:', (out.deptDistinctive['San Salvador'] || []).map((x) => x.name).join(', '))
console.log('La Unión distintivo:', (out.deptDistinctive['La Unión'] || []).map((x) => x.name).join(', '))
console.log('Escrito: data/processed/nlp.json y dashboard/data/nlp.json')
