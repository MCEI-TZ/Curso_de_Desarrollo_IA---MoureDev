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
- AGENTS.md no se tocó: ya cubre fechas locales y métricas derivadas de las sesiones.
- Todo lo visual se deriva de los 4 colores del tema (incluido el campo `--campo`): los 5
temas y el personalizado siguen funcionando sin colores nuevos ni fuentes descargadas.
## Aprendizajes y errores a evitar
- Inicio de semana con `(getDay() + 6) % 7` y `setDate()`: `getDay()` devuelve 0 en domingo.
- Las variables CSS derivadas van en `body`, no en `:root`: si se declaran en `:root`, se
calculan con los colores viejos y no reaccionan al tema que sobrescribe `body`.
- El id `tema` ya es del campo «Tema» del formulario; el selector usa `selector-tema`.
- Comparar días con `setDate`, nunca restando milisegundos: los cambios de hora (DST)
desplazan el resultado.
- Las skills se descubren al iniciar la sesión: si creas un `SKILL.md` con OpenCode ya
abierto, haz `opencode reload` o abre una sesión nueva. Se invocan con `@id`, no con `/id`.
Ahora viven en `.agents/skills/` (antes `.opencode/skills/`).
- AGENTS.md decía `date/topic/minutes`; el código real usa `fecha/tema/minutos/creadoEn`.
Corregido el documento, no el código (renombrar rompería las sesiones guardadas).
- Para abrir el proyecto desde la terminal en Linux: `xdg-open index.html` (`open` es de macOS).
## Próximos pasos
- Si se añade borrado de sesiones, revisar si la mejor racha debe persistirse.