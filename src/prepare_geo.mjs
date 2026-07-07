// prepare_geo.mjs
// Limpia la geometria ADM1 (14 departamentos) de geoBoundaries:
//  - normaliza el nombre a los mismos valores que usa el dataset
//  - reduce la precision de coordenadas para aligerar el mapa en el navegador
// La geometria es SOLO el lienzo cartografico; el analisis usa unicamente el dataset sintetico.
import { readFileSync, writeFileSync } from 'fs'

const SRC = 'geo/departments_raw.json'
const OUT = 'geo/departments.geojson'
const DASH = 'dashboard/data/departments.geojson'

// geoBoundaries -> nombre del dataset
function normalize(name) {
  return name.replace(/^Departamento de\s+/i, '').trim()
}

// redondea coords a `p` decimales (~11 m con 4) para reducir peso
function round(coords, p = 4) {
  if (typeof coords[0] === 'number') {
    return [Number(coords[0].toFixed(p)), Number(coords[1].toFixed(p))]
  }
  return coords.map((c) => round(c, p))
}

const g = JSON.parse(readFileSync(SRC, 'utf8'))
const DATASET_DEPTS = new Set([
  'San Salvador', 'La Libertad', 'Santa Ana', 'Sonsonate', 'San Miguel',
  'Ahuachapán', 'Usulután', 'La Paz', 'Cuscatlán', 'La Unión',
  'Chalatenango', 'Morazán', 'San Vicente', 'Cabañas',
])

let matched = 0
for (const f of g.features) {
  const name = normalize(f.properties.shapeName)
  f.properties = { department: name }
  f.geometry.coordinates = round(f.geometry.coordinates, 4)
  if (DATASET_DEPTS.has(name)) matched++
}

const out = { type: 'FeatureCollection', features: g.features }
const json = JSON.stringify(out)
writeFileSync(OUT, json)
writeFileSync(DASH, json)

const before = readFileSync(SRC, 'utf8').length
console.log(`Departamentos: ${g.features.length} | coinciden con dataset: ${matched}/14`)
console.log(`Tamaño: ${(before / 1024).toFixed(0)} KB -> ${(json.length / 1024).toFixed(0)} KB`)
console.log(`Escrito: ${OUT} y ${DASH}`)

// ---------- MUNICIPIOS (44, HDX ADM2 vigente 2024) ----------
// Fuente: HDX cod-ab-slv (slv_admin2.geojson). Se excluyen cuerpos de agua (lagos/embalses).
const MSRC = 'geo/slv_hdx/slv_admin2.geojson'
try {
  const mg = JSON.parse(readFileSync(MSRC, 'utf8'))
  const centroids = {}
  const feats = mg.features
    .filter((f) => !/^(Embalse|Lago)\b/i.test(f.properties.adm2_name))
    .map((f) => {
      const name = f.properties.adm2_name
      const dept = f.properties.adm1_name
      centroids[name] = [Number(f.properties.center_lon), Number(f.properties.center_lat)]
      return { type: 'Feature', properties: { municipality: name, department: dept }, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates, 4) } }
    })
  const mout = { type: 'FeatureCollection', features: feats }
  const mjson = JSON.stringify(mout)
  writeFileSync('geo/municipios.geojson', mjson)
  writeFileSync('dashboard/data/municipios.geojson', mjson)
  writeFileSync('dashboard/data/muni_centroids.json', JSON.stringify(centroids))
  console.log(`\nMunicipios: ${feats.length} (44 esperados) | ${(mjson.length / 1024).toFixed(0)} KB`)
  console.log('Escrito: geo/municipios.geojson, dashboard/data/municipios.geojson, muni_centroids.json')
} catch (e) {
  console.log('\n[municipios] omitido (falta ' + MSRC + '): ' + e.message)
}
