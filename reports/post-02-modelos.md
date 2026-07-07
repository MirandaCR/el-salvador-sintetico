---
title: "¿Qué mueve el capital humano? Tres modelos sobre un país que no existe"
subtitle: "OLS, brechas condicionales y econometría espacial (Moran's I) sobre 148,000 personas sintéticas de El Salvador"
tags: [Econometría, Data Science, El Salvador, Análisis Espacial, Economía]
plataforma: Medium (largo) / LinkedIn (resumen)
estado: borrador listo para publicar
nota: "Versión visual e interactiva en dashboard/articulo-2.html. Imágenes en shots/."
---

> **Nota:** la versión interactiva (con tabla de coeficientes, gráficos y mapa de clusters en vivo) está en el
> artículo web `articulo-2.html`. Este `.md` es el texto para pegar en Medium/LinkedIn.

---

Un mapa bonito llama la atención. Un modelo la retiene.

En el [artículo anterior](post-01-gemelo-digital.md) vimos *qué* hay en una población sintética de El Salvador
(148,000 personas creadas por IA). Ahora preguntamos *por qué* unos tienen más educación que otros — y si la
geografía importa. Con resultados reales, coeficientes, errores estándar y significancia. Si algo no es significativo, lo digo.

> ⚠️ **Regla de oro:** estos modelos corren sobre datos **sintéticos**. Ilustran el método y las relaciones dentro de
> la población simulada — **no** son efectos causales del El Salvador real.

## Modelo 1 — ¿Qué explica los años de educación?

Estimé por **OLS** los años de escolaridad ~ edad + edad² + mujer + urbano + dummies de departamento (referencia: San Salvador).

| Variable | β | Error est. | t | Sig. |
|---|---:|---:|---:|:--:|
| (intercepto) | 14.021 | 0.077 | 181.8 | *** |
| edad | −0.068 | 0.003 | −21.8 | *** |
| edad²/100 | −0.038 | 0.003 | −12.0 | *** |
| mujer | −0.210 | 0.022 | −9.7 | *** |
| urbano | +0.485 | 0.028 | 17.5 | *** |

*R² = 0.207 · n = 148,000 · *** p<0.001*

**Lectura:** vivir en zona **urbana** suma **+0.49 años** de escolaridad; ser **mujer** resta **0.21 años**
(condicional). Y el efecto de la **edad es negativo**: las generaciones jóvenes están más educadas — la expansión
educativa del país, capturada por la IA. Todos los departamentos quedan **por debajo** de San Salvador.

## Modelo 2 — La brecha urbana que se desvanece

Aquí está lo interesante para un economista. La brecha urbano-rural **sin controlar** es de **+1.25 años**. Pero al
controlar por departamento, **se encoge a +0.49** — menos de la mitad.

| Brecha | Cruda | Condicional |
|---|---:|---:|
| Urbana (años educación) | +1.25 | +0.49 |
| Género (años educación) | −0.25 | −0.21 |

> La brecha urbana no es tanto de asfalto como de **geografía**: vivir cerca de la capital pesa más que vivir "en la ciudad".

Esto cambia el diagnóstico de política: buena parte de la "ventaja urbana" es en realidad **en qué departamento vives**.

## Modelo 3 — ¿El capital humano se "contagia" entre vecinos?

Pregunta de econometría espacial: ¿los lugares con alto capital humano **están pegados** entre sí? Lo medí con el
**I de Moran** sobre el ICH, con contigüidad derivada de la geometría oficial y un test de 999 permutaciones. Y aquí
hay una lección de método:

- A nivel **departamento (14 unidades)**: I = 0.095, pseudo-p ≈ 0.13 → señal positiva pero **no significativa**.
- A nivel **municipio (44 unidades)**: **I = 0.39, pseudo-p < 0.001** → **agrupamiento fuerte y significativo**.

**La moraleja:** con pocas unidades el patrón no se ve; al bajar al detalle municipal, se confirma con claridad que el
capital humano **se agrupa** en el territorio (centro "Alto-Alto", oriente y periferia "Bajo-Bajo"). Más piezas, foto
más nítida. Por eso valió la pena conseguir la geometría de los 44 municipios (HDX/UNOCHA).

## ¿Y esto qué implica para la política? (crítica, sin bandería)

1. **La geografía manda.** Si la brecha urbana es en realidad brecha de *cercanía a la capital*, las políticas
   educativas nacionales y uniformes rinden poco: hace falta **focalización territorial**.
2. **El agrupamiento sugiere derrames.** Apoya invertir en **polos regionales** (oriente) en vez de diluir recursos
   — coherente con la *New Economic Geography* y los efectos de derrame.
3. **Cuidado con el promedio.** El país "promedio" esconde un centro educado y un oriente rezagado.

Nada de esto prueba algo sobre El Salvador real — es un laboratorio sintético. Pero muestra **exactamente cómo** se
haría el diagnóstico con datos reales (EHPM, BCR). Ese es el puente hacia la v2.

---

### Ficha técnica
Modelos calculados en **Node.js** (álgebra lineal a mano: OLS por acumulación de X'X, inversa por Gauss-Jordan; Moran's I
con permutaciones) sobre 148k filas. Datos: NVIDIA Nemotron-Personas-El-Salvador (CC-BY-4.0).

**#Econometría #DataScience #ElSalvador #AnálisisEspacial #EconomíaDelDesarrollo**
