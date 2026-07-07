---
title: "Creé 148,000 salvadoreños que no existen (y aprendí a leerlos sin mentir)"
subtitle: "Cómo convertí un dataset sintético de NVIDIA en un laboratorio visual sobre El Salvador — y por qué la honestidad metodológica es el verdadero superpoder del analista"
tags: [Data Science, El Salvador, Econometría, IA, Visualización de Datos]
plataforma: Medium / LinkedIn (versión corta)
estado: borrador listo para publicar
---

> **Nota para publicar:** este archivo es el texto. Las imágenes referenciadas como `![...]` son las capturas del dashboard (carpeta `shots/` o exporta las tuyas). En LinkedIn, usa la intro + 3 hallazgos + una imagen fuerte + link al dashboard.

---

## Empecemos por lo incómodo

Hay 148,000 salvadoreños en este artículo. Ninguno existe.

No nacieron, no tienen DUI, no votan. Los **inventó una inteligencia artificial** de NVIDIA, uno por uno, con su edad, su municipio, su nivel de estudios, su trabajo… y hasta sus hobbies. El dataset se llama [Nemotron-Personas-El-Salvador](https://huggingface.co/datasets/nvidia/Nemotron-Personas-El-Salvador) y es abierto.

Y aquí viene la pregunta que separa a un analista serio de alguien que solo hace gráficos bonitos:

> **Si los datos son inventados, ¿sirven para algo?**

Spoiler: sí, muchísimo — **pero solo si eres honesto sobre qué puedes y qué no puedes concluir con ellos.** Ese va a ser el hilo conductor de todo.

---

## ¿Qué es esto, en cristiano?

Imagina el videojuego *SimCity*, pero en vez de simular una ciudad, la IA simuló **una población entera**. Cada "persona" respeta cómo se reparte de verdad el país: más gente en San Salvador, mayoría urbana, la mezcla de edades correcta, etc.

Es lo que se llama un **gemelo digital sintético**: un espejo estadístico de la realidad, hecho de datos que no comprometen la privacidad de nadie (porque nadie es real).

![Portada del dashboard con los KPIs](../shots/hero.png)

Los números base de mi población sintética:

- **148,000** personas · **14** departamentos · **44** municipios (los nuevos, de la reforma de 2024)
- Edad promedio: **42.8 años** · **53.8%** mujeres · **73.7%** urbano
- Escolaridad promedio: **9.16 años** (algo así como secundaria incompleta)

---

## Hallazgo 1: el país sintético es joven, urbano y desigual

La pirámide poblacional tiene forma de… pirámide. Base ancha (mucha gente joven) que se angosta rápido. Es el perfil de un país en plena transición demográfica.

![Pirámide poblacional y distribuciones](../shots/poblacion.png)

Pero lo interesante no es el promedio. Es la **desigualdad territorial**. Y para verla, hice un mapa que responde.

---

## Hallazgo 2: el mapa que responde (y lo que grita)

Aquí es donde el proyecto se pone divertido. Haces clic en un departamento y el tablero te cuenta su historia: población, escolaridad, urbanización, sus municipios.

![Mapa interactivo con San Salvador seleccionado](../shots/mapa.png)

Cuando coloreas el mapa por mi **Índice de Capital Humano (ICH)** — una mezcla simple de escolaridad, educación superior y urbanización — el país se parte en dos:

| | Arriba | Abajo |
|---|---|---|
| **ICH** | San Salvador (100), La Libertad (79.7) | La Unión (0), Cabañas (15.6), Morazán (16) |
| **Escolaridad** | ~10.5 años | ~7.3 años |
| **Urbano** | 97% | 24% |

Traducción: **el centro concentra el capital humano; el oriente y el norte rural se quedan atrás.** No es un descubrimiento nuevo sobre El Salvador — pero el punto es *cómo lo estamos viendo*: de forma interactiva, transparente y reproducible.

> ⚠️ **Momento de honestidad #1:** esto NO prueba que un departamento "esté peor" en la vida real. Prueba que *así lo simuló la IA*. Que coincida con lo que sabemos del país nos dice que el dato sintético es plausible — no que sea la verdad oficial.

---

## Hallazgo 3: una economía de pupusas, comercio y agricultura

¿En qué trabaja el país sintético? Las 3 ocupaciones más comunes:

1. Restaurantes y comida ambulante — **12,359**
2. Cultivo de cereales y semillas — **9,324**
3. Comercio al por menor de alimentos — **9,163**

Y muy arriba también: **hogares como empleadores de personal doméstico** y **construcción**. Es el retrato de una **economía de servicios de baja productividad e informalidad alta** — justo lo que la teoría económica esperaría de esta estructura.

![Top 15 ocupaciones](../shots/trabajo.png)

---

## Hallazgo 4: la cultura se cuela en los datos

Cada persona sintética trae textos libres describiendo sus habilidades y pasatiempos. Extraje las palabras más frecuentes (un mini-ejercicio de NLP), y el resultado es entrañable:

**pupusas · dominó · fútbol · cumbia · familia · barrio · misa.**

![Nubes de palabras: habilidades y hobbies](../shots/cultura.png)

La IA no solo copió una demografía: **absorbió un imaginario cultural.** Lo cual abre una pregunta fascinante (y crítica) para otro artículo: *¿qué estereotipos sobre El Salvador está reproduciendo el modelo?*

---

## Lo que este proyecto SÍ y NO puede decir

Esta es la parte que más me importa, y la que más se ignora en el mundo del "data content":

**✅ Sí puedo:**
- Demostrar técnicas (mapas, índices, econometría, NLP) sobre una población controlada.
- Simular escenarios: *"¿qué pasaría si subiera la escolaridad?"*.
- Auditar la calidad y los sesgos del propio dato sintético.
- Comunicar ideas económicas de forma clara y visual.

**❌ No puedo:**
- Afirmar que una política real "causó" algo.
- Presentar esto como una medición oficial del país.
- Sacar conclusiones empíricas nuevas sobre El Salvador real.

> **La moraleja:** un dato sintético es un laboratorio, no un espejo perfecto. Saber usar el laboratorio — y decir claramente dónde están sus paredes — es lo que convierte un gráfico bonito en análisis creíble.

---

## ¿Y ahora qué?

Esto es la **versión 0.1**. Lo que viene:

- **Econometría de verdad:** modelos de elección (logit ordenado de educación, multinomial de ocupación).
- **Econometría espacial:** clusters (Moran/LISA), efectos de derrame entre departamentos.
- **Simulador de escenarios** y un "portafolio de inversión en capital humano".
- **Versión 2:** fusionar con datos **reales** (EHPM, Banco Central) para pasar de "laboratorio" a "análisis empírico".

---

### Ficha técnica (para los curiosos)

- **Datos:** NVIDIA Nemotron-Personas-El-Salvador (CC-BY-4.0).
- **Stack:** Node.js (lectura de parquet con *hyparquet*), Apache ECharts, geoBoundaries para el mapa.
- **Todo es reproducible** y el código está documentado.

*Si te gustó, el dashboard interactivo completo está en [link]. Y cuéntame: ¿qué otra pregunta le harías a una población que no existe?*

---

**#DataScience #ElSalvador #Econometría #IA #DataViz #EconomíaDelDesarrollo**
