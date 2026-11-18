# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha y
lista de sesiones.
- Datos en localStorage. mejor racha calculada en `app.js`, junto a la actual.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha derivada de las sesiones, no guardada: evita cambiar el formato guardado y
dos valores que puedan desincronizarse. Si se añade borrado, podría bajar (aceptado).
- Sin emoji nuevo en la mejor racha y dos bloques apilados en móvil: minimalismo pedido.
## Aprendizajes y errores a evitar
- Comparar días con `setDate`, nunca restando milisegundos: los cambios de hora (DST)
desplazan el resultado.
- AGENTS.md decía `date/topic/minutes`; el código real usa `fecha/tema/minutos/creadoEn`.
Corregido el documento, no el código (renombrar rompería las sesiones guardadas).
## Próximos pasos
- Si se añade borrado de sesiones, revisar si la mejor racha debe persistirse.