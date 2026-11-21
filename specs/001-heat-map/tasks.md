# Tareas — Mapa de calor de estudio (spec 001)

Tareas derivadas de `plan.md`. Se marcan solo al terminar, con `node --test` en verde.
No se empieza una tarea siguiente sin cerrar la anterior.

- [x] T1 — Lógica pura y tests: crear `logica.js` con las funciones puras del plan y
  `test/logica.test.js` con `node --test`; ejecutar `node --test` en verde. Cubre RF-1 a RF-5.
  Completada: 12/12 pruebas en verde, también con `TZ=Europe/Madrid node --test`.
- [x] T2 — Interfaz: sección del mapa en `index.html`, dibujo y eventos en `app.js`, rejilla
  y estilos en `styles.css`. Cubre RF-3, RF-4, RF-5 y RF-6.
  Completada: 84 celdas, leyenda de 5 estados, detalle al hover/foco y scroll horizontal.
- [x] T3 — Verificación en navegador (incluido 375 px), captura y cierre de `MEMORY.md`.
  Cubre RF-1 a RF-6.
  Completada: racha 3, mejor 3, niveles 1/2/3, consola limpia, 375 px con scroll y captura
  en `screenshots/mapa-calor-movil-375.png`; 12/12 tests en verde.
