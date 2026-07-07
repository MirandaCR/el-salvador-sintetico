// download.mjs
// Descarga reproducible del dataset sintetico Nemotron-Personas-El-Salvador (NVIDIA)
// y de la geometria de departamentos (geoBoundaries ADM1).
// Fuente dataset: https://huggingface.co/datasets/nvidia/Nemotron-Personas-El-Salvador  (CC-BY-4.0)
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { pipeline } from 'stream/promises'
import { execSync } from 'child_process'

const HF_API = 'https://datasets-server.huggingface.co/parquet?dataset=nvidia/Nemotron-Personas-El-Salvador'
const GEO_ADM1 = 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/SLV/ADM1/geoBoundaries-SLV-ADM1.geojson'
// Límites administrativos vigentes 2024 (44 municipios) — HDX / UNOCHA cod-ab-slv
const HDX_MUNI = 'https://data.humdata.org/dataset/08bfc7f6-3acc-45df-a69a-b853cf1cff05/resource/1fda0e08-9988-461c-88a4-8ac62c3dcbb1/download/slv_admin_boundaries.geojson.zip'

mkdirSync('data/raw', { recursive: true })
mkdirSync('geo/slv_hdx', { recursive: true })

async function download(url, dest) {
  if (existsSync(dest)) { console.log(`ok (cache): ${dest}`); return }
  console.log(`bajando: ${dest} ...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`)
  await pipeline(res.body, createWriteStream(dest))
  console.log(`  listo: ${dest}`)
}

// 1) lista de parquet
const meta = await (await fetch(HF_API)).json()
console.log(`parquet files: ${meta.parquet_files.length}`)
for (const f of meta.parquet_files) {
  await download(f.url, `data/raw/${f.filename}`)
}

// 2) geometria de departamentos (14)
await download(GEO_ADM1, 'geo/departments_raw.json')

// 3) geometria de municipios (44) — zip HDX, se extrae con tar (bsdtar soporta zip)
if (!existsSync('geo/slv_hdx/slv_admin2.geojson')) {
  await download(HDX_MUNI, 'geo/slv_geojson.zip')
  try {
    execSync('tar -xf slv_geojson.zip -C slv_hdx', { cwd: 'geo', stdio: 'ignore' })
    console.log('  extraido: geo/slv_hdx/')
  } catch (e) {
    console.log('  [aviso] no se pudo extraer el zip automaticamente; extrae geo/slv_geojson.zip a geo/slv_hdx/ a mano.')
  }
} else { console.log('ok (cache): geo/slv_hdx/slv_admin2.geojson') }

console.log('Descarga completa.')
