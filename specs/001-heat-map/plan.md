# Plan 001 — Mapa de calor de estudio

Este plan desarrolla la spec `specs/001-heat-map/spec.md` y respeta los seis principios de
`docs/constitution.md`. Cada sección indica qué requisitos funcionales (RF) cubre.

## Decisiones previas ya cerradas

Las dos dudas de la spec quedaron resueltas antes de escribir este plan:

- El mapa se recalcula **al recargar la vista y al guardar una sesión**, sin temporizadores
  ni detección de cambios de día o zona horaria con la página abierta. Cubre RF-5 y el NRF
  de rendimiento.
- Un día con sesión pero sin minutos válidos muestra el texto **«Sesión registrada»** al
  explorarlo, sin cifras. Cubre RF-4.

## Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad | RF |
| --- | --- | --- | --- |
| `logica.js` | Crear | Funciones puras de fechas y del mapa. Sin DOM, sin `localStorage`, sin `new Date()` sin argumentos. Recibe `hoy` como parámetro. Se carga como script clásico antes de `app.js` para que `file://` funcione. | RF-1, RF-2, RF-3, RF-4, RF-5 |
| `app.js` | Modificar | Pegar la lógica con la interfaz: leer las sesiones existentes, pedir el mapa a las funciones puras, dibujar celdas/etiquetas/leyenda, actualizar el detalle al pasar el puntero o enfocar, y volver a dibujar al guardar y al iniciar. No escribe claves nuevas. | RF-4, RF-5, RF-6 |
| `index.html` | Modificar | Añadir la sección del mapa entre las métricas de semana/mes y el formulario, con contenedor de desplazamiento, etiquetas de días, rejilla, leyenda y texto de detalle. Incluir `logica.js` antes de `app.js`. | RF-3, RF-4, RF-6 |
| `styles.css` | Modificar | Rejilla de 12 columnas por 7 filas, celdas de al menos 16 px, desplazamiento horizontal, etiquetas visibles, cinco estados de color derivados de los colores del tema y leyenda responsive. | RF-3, RF-6 |
| `test/logica.test.js` | Crear | Pruebas con `node --test` de todas las reglas puras: rango, fechas, suma, niveles, etiquetas y robustez ante datos malos. | RF-1 a RF-5 |
| `MEMORY.md` | Modificar | Registrar el estado final, las decisiones técnicas y los errores evitados al terminar la implementación. | RF-1 a RF-6 (seguimiento) |

La clave `diario-estudio-sesiones` y la forma de cada sesión `{ fecha, tema, minutos,
creadoEn }` no cambian. No se crea ninguna clave nueva: el mapa es un cálculo derivado.

## Funciones puras de lógica (RF-1 a RF-5)

Todas viven en `logica.js`, devuelven un valor nuevo, no mutan sus entradas y no tocan DOM
ni almacenamiento. Las que necesitan el día actual lo reciben como parámetro `hoy`, siempre
como texto local `AAAA-MM-DD`. Los nombres son en inglés, según el principio 6.

| Función | Entradas | Salida | Regla principal | RF |
| --- | --- | --- | --- | --- |
| `getLocalDateText` | `date` | texto `AAAA-MM-DD` | Compone con `getFullYear`, `getMonth + 1` y `getDate`, con ceros a la izquierda. Nunca `toISOString`. | RF-1, RF-5 |
| `parseLocalDate` | texto `AAAA-MM-DD` | fecha local | Construye con `new Date(año, mes - 1, día)`. Nunca `new Date("AAAA-MM-DD")`. | RF-1 |
| `addDays` | texto, número de días | texto `AAAA-MM-DD` | Usa `setDate(getDate() + n)`; nunca milisegundos. | RF-1 |
| `isValidDateText` | texto | booleano | Exige `AAAA-MM-DD` y una fecha real: mes 1-12 y día válido en ese mes y año, incluidos bisiestos. | RF-2, RF-4 |
| `isFutureDate` | texto, `hoy` | booleano | Compara textos `AAAA-MM-DD` (se ordenan cronológicamente). | RF-1, RF-2 |
| `getWeekStart` | `hoy` | texto del lunes | `(getDay() + 6) % 7` y `setDate` sobre la fecha local. | RF-1 |
| `getHeatMapRange` | `hoy` | `{ inicio, fin, dias[84] }` | Lunes de la semana de `hoy` menos 11 semanas, hasta el domingo de esa semana: 84 días. | RF-1 |
| `isValidMinutes` | valor | booleano | Entero finito mayor que cero. Descarta ausentes, no numéricos, fraccionarios, cero y negativos. | RF-2 |
| `groupMinutesByDate` | sesiones, `hoy` | mapa fecha → `{ total, tieneSesion }` | Solo fechas válidas y no futuras; suma minutos válidos; cualquier sesión válida marca `tieneSesion`. No modifica el array. | RF-2, RF-5 |
| `getIntensityLevel` | `total`, `tieneSesion` | entero 0-4 | 0 si no hay sesión; 1 con sesión sin minutos válidos o con 1-30; 2 con 31-60; 3 con 61-120; 4 con 121+. Escala fija. | RF-2, RF-3 |
| `getMonthLabels` | días del rango | etiquetas con columna | Una etiqueta por mes presente, en su primera columna; añade el año si el rango cruza cambio de año. | RF-1, RF-4 |
| `formatTooltipDate` | texto | `dd/mm/aaaa` | Reordena las partes de la fecha local. | RF-4 |
| `getCellText` | celda | texto visible | «Sesión registrada» si hay sesión sin minutos válidos; si no, `"<total> min"`; celda vacía sin texto de cifra. | RF-4 |
| `buildAccessibilityLabel` | celda | texto para `aria-label` | Fecha, minutos o indicación, y nivel (`"nivel 2 de 4"`); la celda vacía se nombra como tal. | RF-4 |
| `buildHeatMap` | sesiones, `hoy` | `{ celdas[84], etiquetasMes }` | Compone las funciones anteriores. Es la única función que llama `app.js` para dibujar. | RF-1 a RF-4 |

`buildHeatMap` devuelve 84 objetos con `{ fecha, nivel, minutos, tieneSesion, futuro, texto,
etiqueta }`. El orden es siempre de lunes a domingo, columna a columna, de la semana más
antigua a la actual.

## Algoritmo del mapa en pseudocódigo (RF-1 a RF-4)

```
getHeatMapRange(hoy):
    lunes   <- getWeekStart(hoy)
    inicio  <- addDays(lunes, -77)        // 11 semanas atrás
    fin     <- addDays(lunes, 6)          // domingo de la semana actual
    dias    <- [addDays(inicio, i) para i desde 0 hasta 83]
    devolver { inicio, fin, dias }

groupMinutesByDate(sesiones, hoy):
    agrupado <- mapa vacío
    para cada sesion en sesiones:
        si sesion no es un objeto -> continuar
        fecha <- sesion.fecha
        si no isValidDateText(fecha) -> continuar
        si esFutureDate(fecha, hoy) -> continuar
        registro <- agrupado[fecha] o crear { total: 0, tieneSesion: falso }
        registro.tieneSesion <- verdadero
        si isValidMinutes(sesion.minutos):
            registro.total <- registro.total + sesion.minutos
        agrupado[fecha] <- registro
    devolver agrupado

getIntensityLevel(total, tieneSesion):
    si no tieneSesion -> 0
    si total = 0 -> 1                      // sesión sin minutos válidos
    si total <= 30 -> 1
    si total <= 60 -> 2
    si total <= 120 -> 3
    devolver 4

buildHeatMap(sesiones, hoy):
    rango    <- getHeatMapRange(hoy)
    agrupado <- groupMinutesByDate(sesiones, hoy)
    celdas   <- []
    para cada fecha en rango.dias:
        registro <- agrupado[fecha] o crear { total: 0, tieneSesion: falso }
        futuro   <- esFutureDate(fecha, hoy)
        nivel    <- 0 si futuro o no registro.tieneSesion;
                    si no, getIntensityLevel(registro.total, registro.tieneSesion)
        celda    <- {
            fecha, nivel, futuro,
            minutos: registro.total,
            tieneSesion: registro.tieneSesion,
            texto: getCellText(...),
            etiqueta: buildAccessibilityLabel(...)
        }
        celdas.añadir(celda)
    devolver { celdas, etiquetasMes: getMonthLabels(rango.dias, hoy) }
```

Con `hoy = 2026-11-21` el rango va de `2026-08-31` a `2026-11-22`: 84 celdas, y el domingo
`2026-11-22` queda vacío por ser futuro. Es el caso que se usa en los tests.

## Cómo se pinta en la interfaz (RF-3, RF-4, RF-6)

**Estructura en `index.html`** (RF-6): sección `<section class="tarjeta mapa">` nueva entre
la tarjeta de días del mes y el formulario, con un título «Mapa de calor». Dentro:

1. `<div class="mapa-contenedor">` con desplazamiento horizontal.
2. Fila de etiquetas de meses, usando `etiquetasMes` (RF-1, RF-4).
3. Columna de etiquetas de días (`L M X J V S D`) y rejilla con las 84 celdas, generada por
   `app.js` a partir de `buildHeatMap`.
4. Leyenda con cinco entradas: «Sin estudio», «1-30 min (incluye sesión sin minutos)»,
   «31-60 min», «61-120 min» y «121+ min» (RF-3).
5. Párrafo de detalle `#mapa-detalle` con `role="status"` para mostrar la información al
   explorar (RF-4).

Cada celda es un `<div class="celda nivel-N" tabindex="0" role="img" aria-label="...">`.
El `aria-label` sale de `buildAccessibilityLabel`, así que el nivel y los minutos se leen
sin depender del color (RF-4). La clase `nivel-0` identifica la celda vacía; `nivel-1` a
`nivel-4` son los cuatro tonos (RF-3). No se usa `<button>` porque la celda no ejecuta ninguna
acción: pulsarla no filtra ni edita (fuera de alcance).

**Eventos en `app.js`** (RF-4, RF-5):

- Al iniciar y justo después de guardar una sesión se llama a `renderizarMapa()`, que pide
  `buildHeatMap(sesiones, hoy)` y reconstruye celdas, etiquetas y leyenda. No hay temporizador.
- `mouseenter` y `focus` en una celda escriben su `texto` en `#mapa-detalle`.
- En `focus`, además, se llama a `scrollIntoView` con `block: "nearest", inline: "nearest"`
  para que una celda enfocada con teclado quede visible dentro del contenedor (CA-4.5).
- El cambio de tema solo cambia clases y variables CSS: no recalcula el mapa.

**Estilos en `styles.css`** (RF-3, RF-6): `grid-auto-flow: column` con siete filas y doce
columnas; `grid-auto-columns` y altura de celda de al menos 16 px; `overflow-x: auto` en el
contenedor; etiquetas de día `position: sticky; left: 0` para que sigan visibles al
desplazar, y fila de meses dentro del mismo contenido desplazable para que viaje con sus
columnas. Los cinco estados usan variables CSS derivadas de los cuatro colores ya existentes
del tema (`--fondo`, `--tarjeta`, `--texto`, `--acento`), más un borde tenue que mantiene
visible la celda aunque el usuario elija colores extremos.

## Decisiones técnicas justificadas y alternativas descartadas

| Decisión (RF) | Por qué | Alternativa descartada |
| --- | --- | --- |
| Lógica en `logica.js`, cargado como script clásico antes de `app.js` (RF-1 a RF-5) | Permite probarla con `require` en Node y usarla con doble clic en el navegador, sin build. | Módulos ES: `file://` bloquea su carga. Duplicar la lógica en los tests: se desincronizaría. |
| Funciones puras con `hoy` explícito (RF-1, RF-5) | Hace las pruebas deterministas y cumple el principio 3. | Llamar `new Date()` dentro de cada función: depende del reloj y es imparcial de testear. |
| Un array de 84 celdas con nivel y texto ya calculados (RF-1 a RF-4) | Una sola forma de representar el día; el render no decide reglas. | Calcular el nivel dentro del bucle que crea elementos del DOM: mezcla lógica e interfaz. |
| 12 columnas (semanas) × 7 filas (lunes a domingo) (RF-1, RF-6) | Es la lectura de GitHub; las etiquetas de mes se asocian naturalmente a columnas. | 7 columnas × 12 filas: las etiquetas de mes quedan ambiguas y crece la altura en móvil. |
| Escala fija por umbrales (RF-3) | El color significa lo mismo siempre y la leyenda es estable (CA-3.4). | Escala relativa al máximo del periodo: cambiaría al registrar una sesión. |
| Celdas `div` enfocables + párrafo de detalle (RF-4) | Funciona con puntero, teclado y táctil, y expone la información como texto. | Atributo `title` nativo: no aparece al enfocar con teclado ni en táctil. Botones: sugieren una acción inexistente. |
| Colores derivados de las cuatro variables del tema (RF-3) | No hay que configurar nada nuevo y respeta los cinco temas y el personalizado. | Añadir cuatro selectores de color nuevos: más configuración, fuera de alcance. |
| Recálculo solo en inicio y guardado (RF-5) | Coherente con las métricas actuales y con el NRF de rendimiento. | `setInterval` o escuchar cambios de foco/zona horaria: añade temporizadores y estado. |
| Solo lectura de la clave existente, con parseo tolerante (RF-5) | No hay migraciones ni riesgo de perder sesiones; datos corruptos dan mapa vacío sin excepción. | Guardar un estado derivado del mapa: duplica datos y obliga a mantenerlos sincronizados. |
| Nombres en inglés solo para código nuevo | Cumple el principio 6 sin reescribir las funciones antiguas en español que ya funcionan. | Renombrar todas las funciones existentes: diff grande y ajeno a esta funcionalidad. |
| `node:test` y `node:assert` con `require` (RF-1 a RF-5) | Son parte de Node; no se instala nada y se puede ejecutar con `node --test`. | Un framework de tests externo: dependencia prohibida por la constitución. |

## Estrategia de tests con `node --test` (RF-1 a RF-5)

Se crea `test/logica.test.js` usando los módulos internos `node:test` y `node:assert/strict`.
`logica.js` expone sus funciones al final solo cuando se ejecuta bajo Node, mediante una
comprobación de `module`; en el navegador esa rama no existe. No se instala ningún paquete.

Orden de trabajo: se escribe cada prueba, se ve en rojo, se implementa la función pura
correspondiente y solo se pasa a la siguiente con `node --test` en verde. No se toca la
interfaz mientras haya pruebas en rojo.

Casos previstos, con su criterio de aceptación:

1. `getHeatMapRange("2026-11-21")` devuelve inicio `2026-08-31`, fin `2026-11-22` y 84 días;
   el último es futuro (CA-1.1, CA-1.3).
2. Meses etiquetados en su primera columna y con año cuando el rango cruza fin de año
   (CA-1.4, CA-4.1).
3. `isValidDateText`: acepta `2026-02-28` y `2024-02-29`; rechaza `2026-02-30`, `2026-13-01`,
   `2026/11/21`, textos vacíos y valores no texto (CA-2.4).
4. Suma de varias sesiones del mismo día y de sesiones duplicadas exactas (CA-2.1, CA-2.5).
5. Día con sesión y minutos ausentes, cero, negativos, fraccionarios o no numéricos: nivel 1
   y `getCellText` devuelve «Sesión registrada» (CA-2.2, CA-4.2, CA-4.3).
6. Día con mezcla de minutos válidos y no válidos: solo suman los válidos (caso límite).
7. Fecha futura y fecha anterior al inicio del rango: se excluyen del mapa y el array de
   entrada queda intacto (CA-2.4, CA-5.1).
8. Fronteras de nivel: 0, 1, 30, 31, 60, 61, 120 y 121 (CA-3.1, CA-3.2, CA-3.4).
9. `buildHeatMap` sin sesiones devuelve 84 celdas vacías y etiquetas de mes (CA-5.4, RF-6).
10. Entradas corruptas (`null`, no array, objetos sin campos): sin excepciones y mapa vacío
    (CA-5.5).
11. `formatTooltipDate` y `buildAccessibilityLabel`: `21/11/2026`, texto con nivel y sin
    depender del color (CA-4.2, CA-4.4).
12. `addDays` y `getWeekStart` alrededor de los cambios de hora de marzo y octubre; se ejecuta
    también con `TZ=Europe/Madrid node --test` para verificar que no se usan milisegundos
    (RF-1, principio 5).

Comando de verificación: `node --test` desde la raíz del proyecto. Falla si cualquier prueba
está en rojo.

## Matriz de cobertura

| RF | Dónde se cubre |
| --- | --- |
| RF-1 | `getHeatMapRange`, `getWeekStart`, `addDays`, `isValidDateText`, etiquetas de mes; tests 1, 2, 12. |
| RF-2 | `isValidMinutes`, `groupMinutesByDate`, `getIntensityLevel`; tests 3 a 8. |
| RF-3 | `getIntensityLevel`, clases `nivel-0` a `nivel-4`, leyenda; tests 8 y 9. |
| RF-4 | `formatTooltipDate`, `getCellText`, `buildAccessibilityLabel`, eventos de puntero y foco, `scrollIntoView`; tests 2, 5, 11. |
| RF-5 | Funciones puras sin `localStorage`, recálculo en inicio/guardado, parseo tolerante, sin claves nuevas; tests 7, 9, 10. |
| RF-6 | Sección nueva entre métricas y formulario, rejilla desplazable, celdas ≥ 16 px, etiquetas visibles, comprobación a 375 px. |

## Criterios de finalización (según la spec)

- `node --test` en verde antes de tocar la interfaz y al final.
- `index.html` abre con doble clic, sin dependencias ni recursos externos.
- En Chrome se registran sesiones para hoy, ayer y anteayer: el mapa muestra tres celdas
  con sus niveles, la racha sigue en 3 y la consola no tiene errores.
- A 375 px el mapa se desplaza horizontalmente, las celdas miden al menos 16 px y las
  etiquetas siguen visibles; se guarda una captura en `screenshots/`.
- Las sesiones previas a la verificación siguen intactas y no aparece ninguna clave nueva.
- `MEMORY.md` queda actualizado con el estado y las decisiones de esta funcionalidad.
