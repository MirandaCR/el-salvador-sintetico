# 👀 Cómo ver el dashboard (2 pasos)

No necesitas instalar Python ni nada raro. Solo Node.js (ya lo tienes).

## Opción rápida

```bash
# 1) parado en la carpeta del proyecto
npm run serve

# 2) abre en tu navegador:
#    http://localhost:5173
```

Eso es todo. El dashboard carga solo. Para detener el servidor: `Ctrl + C`.

### 📚 ¿Y las publicaciones (los "papers")?

Con el servidor corriendo, ábrelas aquí:

| Página | URL |
|---|---|
| **Hub de publicaciones** | http://localhost:5173/publicaciones.html |
| 1 — Retrato (demografía + mapas) | http://localhost:5173/articulo-1.html |
| 2 — ¿Por qué unos estudian más? (OLS + espacial) | http://localhost:5173/articulo-2.html |
| 3 — La IA mirando a mi país (sesgos) | http://localhost:5173/articulo-3.html |
| 4 — Un portafolio de capital humano | http://localhost:5173/articulo-4.html |
| 5 — ¿Qué estudiarás y en qué trabajarás? (logit ordenado + multinomial) | http://localhost:5173/articulo-5.html |
| 6 — El país por dentro (k-means + SAR + GWR) | http://localhost:5173/articulo-6.html |
| 7 — Predecir y simular (árbol + Monte Carlo + **simulador interactivo**) | http://localhost:5173/articulo-7.html |
| 8 — ¿De qué sueña El Salvador? (NLP) | http://localhost:5173/articulo-8.html |

También hay un enlace **"Publicaciones →"** arriba a la derecha en el dashboard.
En el **mapa** del dashboard, usa el selector **Departamento (14) / Municipio (44)** para ver ambos niveles.

**Para publicar en redes:**
- Texto largo (Medium/LinkedIn): `reports/post-01…04*.md`.
- **Kit por red social** (X, LinkedIn, Instagram, técnico) para los 8 artículos: `reports/DISTRIBUCION-REDES.md`.

---

## ¿Y si quiero regenerar los datos desde cero?

Todo el pipeline es reproducible:

```bash
npm run download   # baja los 3 parquet de Hugging Face + geometría (568 MB, una sola vez)
npm run geo        # limpia y aligera el mapa de los 14 departamentos
npm run process    # lee los parquet y genera los agregados JSON
npm run serve      # levanta el dashboard
```

O todo junto:

```bash
npm run build      # download + geo + process
npm run serve
```

---

## ¿Dónde está cada cosa?

| Quiero ver… | Archivo |
|---|---|
| El dashboard | `dashboard/index.html` (se abre con `npm run serve`) |
| Los datos ya procesados | `data/processed/aggregates.json` |
| El artículo estilo Medium | `reports/post-01-gemelo-digital.md` |
| La hoja de ruta / propuesta | `PLAN.md` |
| Cómo se leyó el parquet | `src/process.mjs` |

---

## Notas

- El dashboard usa **ECharts** desde CDN, así que necesita **internet** la primera vez que lo abres (para cargar la librería de gráficos).
- Los archivos `.parquet` (568 MB) **no** se suben a git (están en `.gitignore`). Cualquiera puede regenerarlos con `npm run download`.
- Todo lo que ves describe una **población sintética**, no una medición real del país. Ver la sección "Límites" del dashboard.
