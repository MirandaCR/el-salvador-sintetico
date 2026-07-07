# 🇸🇻 El Salvador Sintético

> Un **gemelo digital sintético** de El Salvador convertido en un dashboard interactivo, minimalista y muy visual.
> Construido sobre el dataset [`nvidia/Nemotron-Personas-El-Salvador`](https://huggingface.co/datasets/nvidia/Nemotron-Personas-El-Salvador) (148,000 personas generadas por IA).

![tema](https://img.shields.io/badge/tema-azul%20%26%20blanco-0b3d91) ![stack](https://img.shields.io/badge/stack-Node.js%20%2B%20ECharts-1e6fe0) ![datos](https://img.shields.io/badge/datos-sint%C3%A9ticos-c77d0a) ![licencia_datos](https://img.shields.io/badge/dataset-CC--BY--4.0-2e8bc0)

---

## ⚠️ Lo primero: son datos SINTÉTICOS

Las 148,000 "personas" **no son reales**: las generó la IA de NVIDIA calibrándolas a distribuciones demográficas. Este proyecto es un **laboratorio de métodos** (econometría, mapas, IA) sobre una población simulada — **no** una medición oficial de El Salvador. Ese rigor es intencional y es parte del valor.

## ✨ Qué incluye

- **Dashboard interactivo** (azul & blanco, minimalista, storytelling) con:
  - KPIs del país sintético
  - Pirámide poblacional + distribuciones (sexo, área)
  - **Mapa coroplético interactivo** de los 14 departamentos, con selector de 6 métricas y **drill-down** al hacer clic (detalle + municipios)
  - Educación (niveles y brecha urbano/rural)
  - Estructura ocupacional (top 15)
  - **Mini-NLP**: nubes de palabras de habilidades y hobbies
  - **Modelo**: Índice de Capital Humano Sintético (ICH) + scatter escolaridad vs. urbanización
  - Sección de honestidad metodológica (qué sí / qué no)
- **Pipeline reproducible en Node.js** (sin Python): descarga → geometría → procesamiento.

## 🚀 Cómo verlo

```bash
npm install     # una vez
npm run serve   # abre http://localhost:5173
```

- **Dashboard:** http://localhost:5173
- **Publicaciones (artículos visuales):** http://localhost:5173/publicaciones.html

¿Regenerar datos y modelos desde cero? → `npm run build` (baja 568 MB la primera vez). Ver [docs/COMO-VER.md](docs/COMO-VER.md).

## 🗂️ Estructura

```
NemoTronSV/
├── dashboard/            # tablero + publicaciones
│   ├── index.html            # dashboard interactivo
│   ├── publicaciones.html    # hub de artículos
│   ├── articulo-1.html       # Retrato (demografía + mapas)
│   ├── articulo-2.html       # Modelos (OLS + espacial)
│   ├── app.js / viz.js       # lógica de gráficos
│   └── data/                 # data.json + models.json + departments.geojson
├── src/
│   ├── download.mjs      # baja parquet de HF + geometría
│   ├── prepare_geo.mjs   # normaliza y aligera el mapa
│   ├── process.mjs       # lee parquet -> agregados JSON
│   ├── models.mjs        # OLS, LPM, Moran's I + LISA, brechas
│   └── serve.mjs         # servidor estático mínimo
├── data/
│   ├── raw/              # parquet (ignorados por git)
│   └── processed/        # aggregates.json (inspeccionable)
├── geo/                  # geometría de departamentos
├── reports/              # artículos (Medium/LinkedIn)
├── docs/                 # cómo ver, notas
└── PLAN.md               # hoja de ruta / propuesta completa
```

## 🔬 Metodología rápida

1. **Descarga**: 3 parquet (~568 MB, 148k filas, 25 columnas) vía la API de Hugging Face.
2. **Lectura**: `hyparquet` (lector de parquet en JS puro) leyendo **solo** las columnas necesarias → liviano.
3. **Agregación**: conteos y promedios por departamento, municipio, edad, sexo, educación, ocupación; tablas cruzadas; frecuencias de texto.
4. **Geometría**: departamentos de geoBoundaries (ADM1), normalizados a los nombres del dataset. *La geometría es solo el lienzo; el análisis usa únicamente el dataset.*
5. **Índice ICH** (ilustrativo): `0.5·escolaridad + 0.3·%superior + 0.2·%urbano`, normalizado 0–100 entre departamentos.

## 🧭 Estado y hoja de ruta

**Hecho (v0.1):** fundación de datos + dashboard descriptivo/espacial/NLP-lite + índice.
**Siguiente:** modelos econométricos (logit ordenado de educación, logit multinomial de ocupación), econometría espacial (Moran/LISA, SAR/SEM/GWR), simulador de escenarios, y "portafolio de capital humano". Detalle en [PLAN.md](PLAN.md).

**Escalar a datos reales (v2):** fusionar con EHPM/ONEC, BCR y Banco Mundial para habilitar ingresos, informalidad, microsimulación fiscal y validación de fidelidad.

## 📄 Licencias y créditos

- Dataset: **NVIDIA — Nemotron-Personas-El-Salvador**, licencia **CC-BY-4.0**.
- Geometría: **geoBoundaries** (ADM1, El Salvador).
- Gráficos: **Apache ECharts**. Lector parquet: **hyparquet**.
- Código de este repo: **CC-BY-4.0** — se permite usar, copiar y adaptar el material (incluso con
  fines comerciales), siempre que se dé el crédito correspondiente a Cristian Miranda y se enlace
  este repositorio. Ver [LICENSE](LICENSE).
