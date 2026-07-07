# 📣 Kit de distribución por red social — "El Salvador Sintético"

Contenido **listo para copiar/pegar**, adaptado al público de cada red. Un mismo análisis, cuatro tonos.

## Estrategia por red (a quién le hablas y cómo)

| Red | Público | Tono | Qué publicar |
|---|---|---|---|
| **GitHub / Kaggle** | Técnico (reclutadores data/econ) | Riguroso, con método y código | Repo + notebook + ficha técnica |
| **Medium** | Curioso informado | Narrativo, storytelling | El artículo largo (`reports/post-*.md`) |
| **LinkedIn** | Profesional / red | Profesional pero humano, 1 insight fuerte | Resumen + 1 gráfico + link |
| **X / Threads** | General / rápido | Gancho, provocador, corto | Hilo o tuit suelto |
| **Instagram / TikTok** | Visual / joven | Muy simple, emocional | Carrusel de 5-6 slides |

**Regla de oro:** el mismo hallazgo, distinto envoltorio. Siempre incluir el disclaimer de dato sintético al menos una vez y el link al dashboard/artículo.

**Hashtags base:** `#DataScience #Econometría #ElSalvador #IA #DataViz` (ajusta 3-5 por post).

---

# Artículo 1 — 148,000 salvadoreños que no existen

**🐦 X / Threads**
> Una IA de NVIDIA inventó 148,000 salvadoreños: con edad, trabajo, familia y hasta hobbies. Ninguno existe.
> Los convertí en mapas interactivos para explorar el país… sin usar datos de nadie real. 🧵👇

**💼 LinkedIn**
> ¿Se puede analizar un país con personas que no existen?
> NVIDIA liberó *Nemotron-Personas-El-Salvador*: 148,000 perfiles sintéticos calibrados a la demografía real. Los convertí en un dashboard interactivo (azul y blanco, muy visual) para explorar edad, educación, trabajo y territorio.
> El dato clave no es un número: es una postura. Trabajar con datos sintéticos exige decir con claridad qué SÍ y qué NO se puede concluir. Esa honestidad metodológica es, para mí, la habilidad más subestimada de un analista.
> 👉 Dashboard + artículo en el primer comentario.
> #DataScience #ElSalvador #IA

**📸 Instagram (carrusel)**
> 1. "Creé 148,000 salvadoreños… que no existen 🇸🇻"
> 2. Los inventó una IA, con vida entera: edad, trabajo, hobbies.
> 3. 53.8% mujeres · 73.7% urbano · edad media 42.8
> 4. 1 de cada 4 vive en San Salvador (el país es MUY desigual)
> 5. ¿Sirve un dato inventado? Sí — como laboratorio, no como verdad.
> 6. Míralo interactivo → link en bio.

**🤓 Técnico (GitHub/Kaggle)**
> Pipeline Node.js (sin Python): descarga de 3 parquet (568 MB) vía HF datasets-server → lectura selectiva de columnas con `hyparquet` → agregados JSON (32 KB) → dashboard ECharts. Geometría ADM1/ADM2 (geoBoundaries + HDX). Reproducible: `npm run build`.

---

# Artículo 2 — ¿Por qué unos estudian más?

**🐦 X / Threads**
> "La ciudad estudia más que el campo": +1.25 años.
> Pero al comparar dentro del mismo departamento, la brecha cae a +0.49. 😮
> No era ventaja de la ciudad — era ventaja de estar cerca de la capital. Un clásico sesgo estadístico. 🧵

**💼 LinkedIn**
> Un error que cometen hasta analistas experimentados: confundir correlación con composición.
> En mi laboratorio sintético de El Salvador, la brecha educativa ciudad–campo parecía enorme (+1.25 años). Al controlar por departamento (una regresión simple), se redujo a menos de la mitad (+0.49).
> Lección: buena parte de la "ventaja urbana" era en realidad "cercanía a la capital". Cambia el diagnóstico y la política.
> Además: con 44 municipios, el capital humano muestra autocorrelación espacial fuerte y significativa (Moran's I = 0.39, p<0.001).
> 👉 Artículo visual con la tabla y los mapas en comentarios.

**📸 Instagram (carrusel)**
> 1. "La ciudad estudia más… ¿o es mentira?"
> 2. A lo bruto: +1.25 años a favor de la ciudad
> 3. Comparando justo (mismo depto): solo +0.49 😲
> 4. Traducción: importa estar cerca de la capital, no "ser urbano"
> 5. Y sí: el buen nivel educativo se agrupa en el mapa (¡confirmado!)
> 6. Los modelos, explicados sin fórmulas → link.

**🤓 Técnico (GitHub/Kaggle)**
> OLS de años de educación ~ edad + edad² + mujer + urbano + dummies depto (R²=0.21, n=148k, EE clásicos). Brecha cruda vs. condicional. Econometría espacial: Moran's I global + LISA a 14 y 44 unidades (contigüidad k-NN, 999 permutaciones). Álgebra lineal a mano (X'X, Gauss-Jordan).

---

# Artículo 3 — La IA mirando a mi país (sesgos)

**🐦 X / Threads**
> Le pregunté a una IA cómo son los salvadoreños. Su respuesta:
> Limpieza y cuidados = 98% mujeres. Construcción = 96% hombres.
> Hobbies de mujer: uñas, maquillaje. De hombre: motos, asados.
> La IA no es machista… es un espejo de lo que escribimos. 🪞🧵

**💼 LinkedIn**
> La IA no inventa sesgos: los aprende de nosotros y los amplifica.
> Auditando un dataset sintético de NVIDIA encontré que el modelo asignó los oficios con un género marcadísimo: limpieza y trabajo doméstico 85–98% femeninos; construcción, transporte y electricidad ~96% masculinos. Hasta los hobbies (uñas vs. motos).
> ¿Por qué importa? Estas herramientas ya redactan ofertas de empleo y filtran CVs. Un sesgo no medido se propaga en silencio.
> La buena noticia: detectar el sesgo es la mitad de arreglarlo. #IAResponsable #Sesgos

**📸 Instagram (carrusel)**
> 1. "Le pregunté a una IA cómo somos los salvadoreños 🇸🇻"
> 2. Para ella, limpiar y cuidar = 98% mujeres 😬
> 3. Construir y transportar = 96% hombres
> 4. Hobbies: ellas uñas/maquillaje, ellos motos/asados
> 5. La IA no es mala: es un ESPEJO de nuestros textos
> 6. Por eso hay que medir y corregir. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> Auditoría de sesgo de género: %femenino por ocupación (n≥400) y por término de hobby (n≥300), contra baseline 53.8%. Diverging bars. Insumo: campos de texto de las personas sintéticas (frecuencias por sexo).

---

# Artículo 4 — Un portafolio de capital humano

**🐦 X / Threads**
> ¿Y si el gobierno invirtiera en educación como un trader arma su portafolio?
> Rendimiento = cuánto se puede mejorar. Riesgo = qué tan disparejo está.
> El reparto óptimo NO es parejo: Sonsonate 12%, Santa Ana 10.5%, Ahuachapán 10.3%… 🧵

**💼 LinkedIn**
> Mezclé mis dos mundos —finanzas y economía— en un experimento: tratar la inversión pública en educación como un portafolio.
> Cada departamento es un "activo": su rendimiento es cuánto puede mejorar (potencial), su riesgo es qué tan disparejo está por dentro. La estrategia de valor: sobreponderar lo desatendido y populoso.
> Resultado: repartir parejo rinde poco; concentrar donde hay más potencial y más gente rinde más. La pregunta no es "¿cuánto gastamos?" sino "¿cuánto capital humano compramos por dólar?".
> 👉 Mapa de inversión y reparto sugerido en comentarios.

**📸 Instagram (carrusel)**
> 1. "Invertir en educación como un trader 📈"
> 2. Cada departamento = una acción
> 3. Rendimiento = cuánto se puede mejorar
> 4. Riesgo = qué tan disparejo está
> 5. La jugada: poner MÁS donde más falta (no parejo)
> 6. Top: Sonsonate, Santa Ana, Ahuachapán. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> Portafolio riesgo-rendimiento: retorno=potencial (100−ICH), riesgo=σ(años educación) intra-unidad, tamaño=población. Asignación ∝ necesidad×población, normalizada. Scatter + barra de asignación.

---

# Artículo 5 — ¿Qué estudiarás y en qué trabajarás?

**🐦 X / Threads**
> Modelo de elección sobre 148k personas sintéticas:
> ser mujer NO cambia casi tu nivel educativo… pero sí dispara +19 puntos la probabilidad de acabar en "comida y hogar" y baja construcción y agro.
> El género no marca cuánto estudias, marca EN QUÉ trabajas. 🧵

**💼 LinkedIn**
> Dos modelos de elección discreta (logit ordenado y multinomial) sobre una población sintética de El Salvador:
> • Para el nivel educativo, el lugar pesa más que el sexo: vivir en ciudad multiplica ×1.24 las probabilidades de subir de escalón.
> • Para el sector laboral, el género es determinante: ser mujer sube +19 pp la probabilidad de "comida y hogar" y baja agro (−9) y construcción (−8).
> Es el sesgo del artículo anterior, ahora medido como una decisión económica. Microeconomía aplicada, explicada sin jerga.

**📸 Instagram (carrusel)**
> 1. "¿Qué vas a estudiar y en qué vas a trabajar?"
> 2. Una máquina lo adivina mirando edad, sexo y lugar
> 3. Para estudiar más: importa el LUGAR, no el sexo
> 4. Para el trabajo: el género manda 😔
> 5. Mujer → +19% "comida y hogar", −9% agro
> 6. El sesgo, medido como decisión. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> Logit ordenado (7 niveles educativos, MLE por Adam, cutpoints reparametrizados) → odds ratios. Logit multinomial (6 sectores ocupacionales, softmax MLE) → efectos marginales promedio de urbano/mujer por sector.

---

# Artículo 6 — El país por dentro: tribus y contagios

**🐦 X / Threads**
> Agrupé los 44 municipios de El Salvador por cómo se parecen: salen 4 "tribus".
> El "núcleo desarrollado" son solo 5 municipios (centro). La periferia es rezago rural.
> Y sí: el desarrollo se CONTAGIA entre vecinos (modelo espacial ρ=0.11). 🗺️🧵

**💼 LinkedIn**
> Econometría espacial, visual y sin jerga.
> Sobre los 44 municipios de El Salvador (sintéticos): (1) un clustering k-means revela 4 tipologías territoriales —un núcleo central desarrollado de solo 5 municipios frente a una periferia rezagada—; (2) un modelo de rezago espacial (SAR) confirma "derrames" entre vecinos (ρ=0.11); (3) una regresión geográficamente ponderada (GWR) muestra que la misma política rinde distinto según el lugar.
> Conclusión de política: crear polos y focalizar rinde más que repartir parejo.

**📸 Instagram (carrusel)**
> 1. "El Salvador no es uno: son 4 países 🗺️"
> 2. Agrupamos 44 municipios por cómo se parecen
> 3. Núcleo desarrollado: solo 5 municipios (el centro)
> 4. El resto: en desarrollo o rezago rural
> 5. El desarrollo se CONTAGIA entre vecinos
> 6. Por eso conviene crear "polos". Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> k-means (k=4) sobre features estandarizadas (escolaridad, %urbano, %superior, edad). SAR por MLE de verosimilitud concentrada (grid de ρ, log-det vía eliminación). GWR con kernel gaussiano sobre centroides (bandwidth adaptativo). Todo a nivel municipio (n=44).

---

# Artículo 7 — Predecir y simular el futuro

**🐦 X / Threads**
> Entrené una IA para adivinar quién llega a la universidad.
> Acierta 85%… pero decir "nadie llega" ya acierta 85% 😅
> Traducción: tu demografía NO define tu destino. Y eso es buena noticia.
> Bonus: hice un simulador donde mueves una perilla y repintas el país. 🧵

**💼 LinkedIn**
> Un modelo que "falla" y por qué es la mejor noticia del proyecto.
> Entrené un árbol de decisión para predecir quién alcanza educación superior con edad, sexo y ubicación. Precisión: 85%… igual que predecir "nadie" (porque pocos llegan). La demografía predice mal el destino educativo — señal de que hay margen para la movilidad.
> Añadí Monte Carlo (1,000 simulaciones) para medir la confianza de los rankings, y un simulador interactivo: mueves un control y ves cómo se empareja el país al invertir en los rezagados.
> Interactivo en comentarios.

**📸 Instagram (carrusel)**
> 1. "¿Puede una IA adivinar tu futuro? 🔮"
> 2. La entrené para predecir quién va a la U
> 3. Acierta 85%… pero "adivinar que no" también 😅
> 4. Tu demografía NO decide tu destino (¡bien!)
> 5. Hice un simulador: mueve la perilla, cambia el país
> 6. Pruébalo tú 👉 link

**🤓 Técnico (GitHub/Kaggle)**
> Árbol CART (Gini, prof. 3, holdout 20%) → accuracy vs. base rate + importancias. Monte Carlo (T=1000) de estabilidad de ranking usando SE del promedio. Simulador client-side: recomputa ICH (min-max) bajo shocks de escolaridad al cuartil inferior.

---

# Artículo 8 — ¿De qué sueña El Salvador?

**🐦 X / Threads**
> Leí las "metas" de 148,000 salvadoreños sintéticos.
> El país no sueña con lujos: sueña con FORMALIZAR su negocio, tomar CURSOS y capacitarse (¡aparece el INSAFORP!).
> Y la IA le puso a cada región su palabra: La Unión = atún y Golfo de Fonseca. 🇸🇻🧵

**💼 LinkedIn**
> Análisis de texto (NLP) sobre las aspiraciones de una población sintética de El Salvador.
> Al contar las palabras de sus "metas", no aparecen lujos: aparecen *negocio*, *formalizar*, *cursos*, *capacitación* e incluso *INSAFORP*. Es el retrato de una economía de emprendedores que quieren dar el salto a la formalidad.
> Y con TF-IDF, cada departamento revela su identidad: San Salvador (Escalón, Metrocentro), La Unión (Golfo de Fonseca, atún, manglares), Ahuachapán (termas, ausoles). La IA aprendió la geografía y la cultura.

**📸 Instagram (carrusel)**
> 1. "¿Con qué sueña El Salvador? 💭"
> 2. Leímos las metas de 148,000 personas (sintéticas)
> 3. No sueñan con lujos… sueñan con EMPRENDER
> 4. Formalizar el negocio, tomar cursos, INSAFORP
> 5. Cada región tiene su palabra: La Unión = atún 🐟
> 6. Escuchar con datos. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> NLP clásico: frecuencias en `career_goals` (nube) + términos distintivos por departamento con TF-IDF simplificado (sobre/infra-representación vs. global, min. apariciones). Tokenización con stopwords ES, preservando acentos y ñ.

---

# Artículo 9 — La curva de la vida: ¿cuándo se empareja El Salvador?

**🐦 X / Threads**
> Usé análisis de supervivencia para ver a qué edad El Salvador deja la soltería.
> Mediana: 24.7 años. Pero lo loco: tu sexo o si vives en ciudad casi no cambian el "cuándo"…
> El municipio SÍ: de 19.6 a 29.6 años. Una década según dónde naces. ⏳🧵

**💼 LinkedIn**
> ¿Se puede hacer análisis de supervivencia sin fechas? Sí — con datos de estado actual (current-status).
> Sobre una población sintética de El Salvador estimé la "supervivencia de la soltería": la curva del % que sigue soltero a cada edad. Mediana de primera unión: 24.7 años.
> El hallazgo interesante no es la mediana, sino qué la mueve: el sexo, la zona y la educación tienen efectos pequeños, mientras que entre municipios hay hasta 10 años de diferencia. De nuevo, la geografía pesa más que el rasgo individual.
> Y una nota de honestidad: es el análisis más delicado de la serie (dato sintético + timing inferido). El valor está en el método, reutilizable para "tiempo hasta el primer empleo" o "hasta la deserción escolar".

**📸 Instagram (carrusel)**
> 1. "¿A qué edad se empareja El Salvador? ⏳"
> 2. Truco de estadística: la "curva de la soltería"
> 3. La mitad ya tiene pareja a los 24.7 años
> 4. Tu sexo o zona… casi no cambian nada
> 5. Pero el municipio SÍ: de 19 a 30 años 😮
> 6. Dónde naces marca tu vida. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> Supervivencia con datos de estado actual (current-status): S(a)=P(soltero|edad a) suavizada, mediana por interpolación. Curvas por sexo/zona/educación. Regresión logística (partnered ~ edad+edad²+mujer+urbano+superior, Adam) → odds ratios. Mediana por municipio → coroplético. Caveat: sin fechas, el timing se infiere del corte transversal.

---

# Artículo 10 — El país de arriba: quién llega a la universidad

**🐦 X / Threads**
> Dato que duele: en El Salvador (sintético) casi 9 de cada 10 personas con título universitario o posgrado trabajan en actividades que NO usan su formación.
> Y el 47% de todos los posgraduados vive en un solo departamento.
> Producimos títulos que la economía no absorbe. 🎓🧵

**💼 LinkedIn**
> Cuatro ángulos sobre la educación superior (tercer y cuarto nivel), y ninguno tranquiliza:
> 1) Embudo: poquísimos llegan arriba (15% superior, 0.7% posgrado).
> 2) Techo de cristal: las mujeres son mayoría en la universidad (56%) pero caen a 47% en el posgrado.
> 3) Sobreeducación: ~87% de los graduados superiores trabaja en actividades no intensivas en conocimiento (subutilización de talento).
> 4) Concentración: casi la mitad del posgrado vive en San Salvador; el resto son "desiertos".
> El mensaje para política: no basta con más cupos; falta demanda de trabajo calificado y descentralización. (El retorno salarial real lo estimaría con datos de ingresos — v2.)

**📸 Instagram (carrusel)**
> 1. "¿Sirve un título en El Salvador? 🎓"
> 2. Solo el 15% llega a educación superior
> 3. Mujeres lideran la U… pero pierden en el posgrado 😔
> 4. 87% de graduados NO ejerce lo que estudió
> 5. Y casi todos viven en San Salvador
> 6. Producimos títulos que la economía no usa. Link 👉

**🤓 Técnico (GitHub/Kaggle)**
> Educación superior: (A) sobreeducación = % de {universitario, posgrado} en actividades no intensivas en conocimiento (clasificador por keywords sobre CIIU); (B) embudo + %mujer por nivel (techo de cristal en posgrado); (C) tasa terciaria por municipio (coroplético) + concentración del posgrado (share top-3, HHI); (D) retorno como proxy — Mincer real requiere ingresos (v2/EHPM).

---

## Calendario sugerido (para no quemar todo de golpe)

Publica **1 artículo por semana** en este orden (de más accesible a más técnico), reciclando cada uno en las 5 redes durante esa semana:

1. Retrato → 2. Sesgos (gancho fuerte) → 3. ¿Cuándo se empareja? (supervivencia, muy compartible) → 4. El país de arriba (educación superior, gancho fuerte) → 5. ¿Por qué estudian más? → 6. Sueños del país → 7. Elecciones → 8. Portafolio → 9. Territorio → 10. Predecir/simular (cierre interactivo).

> Empieza por **Retrato** y **Sesgos**: son los de mayor gancho para crecer audiencia. Deja los espaciales/ML para cuando ya tengas quién los lea.
