# 🗺️ PLAN — El Salvador Sintético

> Norte del proyecto: convertir el dataset sintético **Nemotron-Personas-El-Salvador** en un cuerpo de
> publicaciones **muy visuales, interactivas y críticas** que posicionen un perfil de
> **economista · microeconomista (con mirada macro) · IA · trader**, con rigor metodológico como sello.

## 🎯 Concepto paraguas

**"Gemelo digital sintético de El Salvador"** — un laboratorio para demostrar econometría, análisis
espacial e IA sobre una población simulada. Nunca se presenta como medición real; siempre se aclara la
naturaleza sintética. Escalar con datos reales = ruta de crecimiento (v2), no el alcance actual.

## ✅ Estado actual (v0.1 — HECHO)

- Pipeline reproducible Node.js: descarga (568 MB) → geometría → agregados JSON.
- Dashboard interactivo (azul & blanco, minimalista, storytelling): KPIs, pirámide, donas,
  **mapa coroplético con 6 métricas + drill-down**, educación, ocupaciones, nubes de palabras (NLP-lite),
  **Índice de Capital Humano (ICH)** + scatter, sección de límites.
- Artículo #1 estilo Medium (`reports/post-01-gemelo-digital.md`).

## 🧑‍💼 Cómo cada faceta del perfil se demuestra

| Faceta | Entregable |
|---|---|
| Microeconomista | Elección ocupacional como utilidad aleatoria (logit multinomial). |
| Econometrista | Logit/probit ordenado (educación), Oaxaca-Blinder, econometría espacial. |
| Macro (crítico) | De lo micro a lo macro: estructura ocupacional → productividad/informalidad, crítica apartidista. |
| IA | NLP de narrativos, embeddings, auditoría de sesgos del LLM generador. |
| Trader | Simulación de escenarios / Monte Carlo + "portafolio de capital humano" (optimización riesgo-retorno). |

## 📊 Catálogo de módulos (roadmap)

### Nivel 1 — Descriptivo + mapas ✅ (base hecha)
- Pirámide, distribuciones, mapa departamental, ranking de municipios.

### Nivel 2 — Econometría de microdatos (siguiente)
- Logit/probit **ordenado** de nivel educativo ~ edad + sexo + área + depto.
- Logit **multinomial** de ocupación (elección discreta).
- **Oaxaca-Blinder** de brecha de género en años de educación.

### Nivel 3 — Econometría espacial (diferenciador)
- **Moran's I + LISA** → clusters de alto/bajo capital humano en el mapa.
- **SAR / SEM / SDM** → efectos de derrame entre departamentos.
- **GWR** → mapa de coeficientes variables en el territorio.
- Clustering de departamentos → tipología territorial.

### Nivel 4 — IA / NLP
- Embeddings de narrativos + UMAP + clustering (segmentación emergente).
- Topic modeling (BERTopic) de metas de carrera.
- **Auditoría de sesgos** del LLM generador (artículo con gancho).

### Nivel 5 — Simulación y política
- Simulador de escenarios estructurales (slider "+X años de escolaridad").
- **Portafolio de capital humano** (asignación óptima entre departamentos).
- Monte Carlo de incertidumbre (bandas en los mapas).

## 📰 Estrategia de publicaciones

**Series (no posts sueltos):**
1. *Gemelo Digital* — qué es, límites, auditoría → **Medium + LinkedIn** (post #1 ✅)
2. *El Salvador en microdatos* — un modelo por entrega → **Medium + Kaggle**
3. *Mapas que hablan* — espacial + coropletas → **LinkedIn + Observable**
4. *Política en simulación* — escenarios, portafolio → **Medium + working paper (Quarto)**
5. *IA mirando a mi país* — NLP, sesgos → **LinkedIn + Medium**

**Reciclaje:** 1 análisis → notebook Kaggle + post Medium + carrusel LinkedIn + commit GitHub + (a veces) dashboard.

**Plataformas:** GitHub (portafolio técnico) · Kaggle (notebooks) · Medium (largo) · LinkedIn (visual + red) · Quarto (working papers).

## 🚀 Escalar a datos reales (v2)

Fusionar con **EHPM/ONEC** (ingresos, informalidad), **BCR** (macro), **Banco Mundial** (comparación regional)
→ habilita Mincer, microsimulación fiscal, validación de fidelidad sintética.

## ⚖️ Reglas de honestidad (no negociables)

- Siempre declarar que el dato es sintético.
- Nunca afirmar causalidad de políticas reales ni presentar como cifra oficial.
- Todo componente de índices y modelos: transparente y reproducible.
- Crítica a la política pública basada en teoría y estructura, **apartidista**.
