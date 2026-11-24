# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha y
lista de sesiones.
- Selector con 5 temas: Claro, Arena (2 light), Oscuro, Noche (2 dark) y Personalizado
(4 selectores de color: fondo, tarjeta, texto, acento).
- Datos en localStorage. mejor racha calculada en `app.js`, junto a la actual.
- Total de minutos estudiados esta semana (lunes a hoy) en tarjeta propia bajo las rachas.
- Días estudiados este mes (mes natural local, día 1 a hoy) en tarjeta propia bajo la semana.
- Diseño con aire de bitácora: cabecera con regla, serif del sistema para títulos y cifras,
métricas semana+mes unidas y fondo de líneas muy tenues (sin fuentes externas).
- Git: `main` actualizado a `7d4a086`; rama local `DayTwo` eliminada con sus 3 commits
  (descartados a petición); `origin/DayTwo` conservado. Trabajo actual en `DayThree`.
- Mapa terminado y auditado (T1-T3): `logica.js`, interfaz; 12/12 tests y auditoría RF-1 a RF-6
  en Chrome sin fallos. Salvedad CA-6.3: días sticky, meses se desplazan con sus columnas.
- Skill de OpenCode `local-dates` en `.agents/skills/local-dates/SKILL.md`: guía de fechas
locales. El comando `feature.md` sigue siendo un comando (`/feature`), no una skill.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha derivada de las sesiones, no guardada: evita cambiar el formato guardado y
dos valores que puedan desincronizarse. Si se añade borrado, podría bajar (aceptado).
- Sin emoji nuevo en la mejor racha y dos bloques apilados en móvil: minimalismo pedido.
- Tema guardado en clave aparte `diario-estudio-tema`: no cambia el formato de sesiones y
recuerda la elección al recargar. El panel de colores solo aparece en Personalizado.
- Semana natural de lunes a domingo, contada hasta hoy: es la convención en España y evita
contar fechas futuras. Se deriva de las sesiones, sin guardar, igual que la mejor racha.
Sin temporizador: se actualiza al recargar o al guardar una sesión (aceptado).
- Mes natural local y contado hasta hoy: cuenta días únicos con fecha válida y no futura,
sin guardar estado, igual que la semana y la mejor racha. Minutos inválidos no lo impiden
(coherente con las rachas, que solo miran la fecha). Sin temporizador (aceptado).
- Todo lo visual se deriva de los 4 colores del tema (incluido el campo `--campo`): los 5
temas y el personalizado siguen funcionando sin colores nuevos ni fuentes descargadas.
- Mapa acordado: 12 semanas lunes-domingo, umbrales 1-30/31-60/61-120/121+; minutos malos
= nivel 1; visual con tooltip; tarjeta tras semana/mes con scroll en móvil. Fuera: metas,
selector, filtrar y borrar. Dudas cerradas: recalcular al cargar/guardar; «Sesión registrada».
- Plan: lógica pura en `logica.js` con `hoy` como parámetro, script clásico para `file://`,
rejilla 12x7 con celdas ≥16 px y tests con `node --test` (sin dependencias).
## Aprendizajes y errores a evitar
- Inicio de semana con `(getDay() + 6) % 7` y `setDate()`: `getDay()` devuelve 0 en domingo.
- Las variables CSS derivadas van en `body`, no en `:root`: en `:root` se calculan con colores viejos y no reaccionan al tema.
- El id `tema` ya es del campo «Tema» del formulario; el selector usa `selector-tema`.
- Comparar días con `setDate`, nunca restando milisegundos: los cambios de hora (DST)
desplazan el resultado.
- `logica.js` debe exponer `globalThis.logica` en el navegador: con `module.exports` solo funciona en Node y el mapa sale vacío.
- Skills: se descubren al iniciar sesión (`opencode reload`); se invocan con `@id`; viven en `.agents/skills/`.
- AGENTS.md decía `date/topic/minutes`; el código usa `fecha/tema/minutos/creadoEn`: corregí el documento, no el código (renombrar rompería las sesiones).
- Para abrir el proyecto desde la terminal en Linux: `xdg-open index.html` (`open` es de macOS).
- El MCP de Chrome DevTools falla aquí: busca Chrome stable en `/opt/google/chrome/chrome`, que no existe (el navegador es Vivaldi). Para abrir, usar `xdg-open`; para verificar con MCP haría falta Chrome o configurar el MCP con Vivaldi.
## Próximos pasos
- Si se añade borrado de sesiones, revisar si la mejor racha debe bajar y actualizar los tests.