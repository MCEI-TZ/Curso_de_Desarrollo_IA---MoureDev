const test = require("node:test");
const assert = require("node:assert/strict");
const logica = require("../logica.js");

test("RF-1: el rango cubre 12 semanas de lunes a domingo hasta hoy", () => {
  const rango = logica.getHeatMapRange("2026-11-21");

  assert.equal(rango.inicio, "2026-08-31");
  assert.equal(rango.fin, "2026-11-22");
  assert.equal(rango.dias.length, 84);
  assert.equal(rango.dias[0], "2026-08-31");
  assert.equal(rango.dias[83], "2026-11-22");
  assert.equal(logica.parseLocalDate(rango.dias[0]).getDay(), 1);
  assert.equal(logica.parseLocalDate(rango.dias[83]).getDay(), 0);
  assert.equal(logica.isFutureDate(rango.dias[83], "2026-11-21"), true);
  assert.equal(logica.isFutureDate("2026-11-21", "2026-11-21"), false);
});

test("RF-1 / RF-4: las etiquetas de mes van en su columna y añaden el año si cruza fin de año", () => {
  const etiquetas = logica.getMonthLabels(logica.getHeatMapRange("2026-01-15").dias);

  assert.deepEqual(etiquetas, [
    { texto: "oct 2025", columna: 0 },
    { texto: "nov 2025", columna: 0 },
    { texto: "dic 2025", columna: 5 },
    { texto: "ene 2026", columna: 9 }
  ]);

  const sinCruce = logica.getMonthLabels(logica.getHeatMapRange("2026-11-21").dias);
  assert.deepEqual(sinCruce.map(function (etiqueta) { return etiqueta.texto; }),
    ["ago", "sep", "oct", "nov"]);
});

test("RF-2: una fecha es válida solo si existe en el calendario", () => {
  assert.equal(logica.isValidDateText("2026-02-28"), true);
  assert.equal(logica.isValidDateText("2024-02-29"), true);
  assert.equal(logica.isValidDateText("2026-02-30"), false);
  assert.equal(logica.isValidDateText("2026-13-01"), false);
  assert.equal(logica.isValidDateText("2026/11/21"), false);
  assert.equal(logica.isValidDateText(""), false);
  assert.equal(logica.isValidDateText(null), false);
  assert.equal(logica.isValidDateText(20261121), false);
});

test("RF-2: se suman las sesiones del mismo día, incluidos duplicados, sin mutarlas", () => {
  const sesiones = [
    { fecha: "2026-11-20", tema: "CSS", minutos: 30, creadoEn: 1 },
    { fecha: "2026-11-20", tema: "CSS", minutos: 45, creadoEn: 2 },
    { fecha: "2026-11-20", tema: "CSS", minutos: 45, creadoEn: 2 }
  ];
  const copia = JSON.parse(JSON.stringify(sesiones));

  const agrupado = logica.groupMinutesByDate(sesiones, "2026-11-21");

  assert.deepEqual(agrupado["2026-11-20"], { total: 120, tieneSesion: true });
  assert.deepEqual(sesiones, copia);
});

test("RF-2 / RF-3 / RF-4: sesión sin minutos válidos es nivel 1 y dice «Sesión registrada»", () => {
  const sesiones = [
    { fecha: "2026-11-19" },
    { fecha: "2026-11-19", minutos: 0 },
    { fecha: "2026-11-19", minutos: -5 },
    { fecha: "2026-11-19", minutos: "30" },
    { fecha: "2026-11-19", minutos: 12.5 }
  ];

  const celda = logica.buildHeatMap(sesiones, "2026-11-21").celdas
    .find(function (item) { return item.fecha === "2026-11-19"; });

  assert.equal(celda.nivel, 1);
  assert.equal(celda.minutos, 0);
  assert.equal(celda.texto, "Sesión registrada");
  assert.match(celda.etiqueta, /sesión registrada, minutos no disponibles/);
});

test("RF-2: con minutos válidos y no válidos a la vez solo se suman los válidos", () => {
  const sesiones = [
    { fecha: "2026-11-18", minutos: "x" },
    { fecha: "2026-11-18", minutos: 40 }
  ];

  const celda = logica.buildHeatMap(sesiones, "2026-11-21").celdas
    .find(function (item) { return item.fecha === "2026-11-18"; });

  assert.equal(celda.minutos, 40);
  assert.equal(celda.nivel, 2);
  assert.equal(celda.texto, "40 min");
});

test("RF-2 / RF-5: fechas futuras y anteriores al rango no aparecen como estudiadas", () => {
  const sesiones = [
    { fecha: "2026-11-22", minutos: 60 },
    { fecha: "2026-08-30", minutos: 60 },
    { fecha: "2026-11-21", minutos: 30 }
  ];
  const copia = JSON.parse(JSON.stringify(sesiones));

  const celdas = logica.buildHeatMap(sesiones, "2026-11-21").celdas;
  const fechas = celdas.map(function (celda) { return celda.fecha; });

  assert.equal(fechas.includes("2026-08-30"), false);

  const futura = celdas.find(function (celda) { return celda.fecha === "2026-11-22"; });
  assert.equal(futura.futuro, true);
  assert.equal(futura.tieneSesion, false);
  assert.equal(futura.nivel, 0);

  const hoy = celdas.find(function (celda) { return celda.fecha === "2026-11-21"; });
  assert.equal(hoy.minutos, 30);
  assert.equal(hoy.nivel, 1);
  assert.deepEqual(sesiones, copia);
});

test("RF-3: los niveles respetan los umbrales 30, 60 y 120 minutos", () => {
  assert.equal(logica.getIntensityLevel(0, false), 0);
  assert.equal(logica.getIntensityLevel(0, true), 1);
  assert.equal(logica.getIntensityLevel(1, true), 1);
  assert.equal(logica.getIntensityLevel(30, true), 1);
  assert.equal(logica.getIntensityLevel(31, true), 2);
  assert.equal(logica.getIntensityLevel(60, true), 2);
  assert.equal(logica.getIntensityLevel(61, true), 3);
  assert.equal(logica.getIntensityLevel(120, true), 3);
  assert.equal(logica.getIntensityLevel(121, true), 4);
  assert.equal(logica.getIntensityLevel(500, true), 4);
});

test("RF-3 / RF-5: sin sesiones hay 84 celdas vacías y sigue habiendo etiquetas de mes", () => {
  const mapa = logica.buildHeatMap([], "2026-11-21");

  assert.equal(mapa.celdas.length, 84);
  assert.equal(mapa.celdas.every(function (celda) {
    return celda.nivel === 0 && celda.texto === "";
  }), true);
  assert.ok(mapa.etiquetasMes.length > 0);
});

test("RF-5: datos corruptos no lanzan errores y dan un mapa vacío", () => {
  assert.deepEqual(logica.groupMinutesByDate(null, "2026-11-21"), {});

  const mapa = logica.buildHeatMap("no es un array", "2026-11-21");
  assert.equal(mapa.celdas.length, 84);
  assert.equal(mapa.celdas.every(function (celda) { return celda.nivel === 0; }), true);

  const raros = [null, 42, "sesión", {}, { fecha: " fecha rara ", minutos: 10 },
    { fecha: "2026-11-21", minutos: null }];
  assert.doesNotThrow(function () { return logica.buildHeatMap(raros, "2026-11-21"); });
});

test("RF-4: la fecha y la etiqueta accesible incluyen minutos y nivel sin depender del color", () => {
  assert.equal(logica.formatTooltipDate("2026-11-21"), "21/11/2026");

  const conMinutos = { fecha: "2026-11-21", nivel: 2, futuro: false, minutos: 60, tieneSesion: true };
  assert.equal(logica.getCellText(conMinutos), "60 min");
  assert.match(logica.buildAccessibilityLabel(conMinutos), /21\/11\/2026: 60 minutos, nivel 2 de 4/);

  const vacia = { fecha: "2026-11-21", nivel: 0, futuro: false, minutos: 0, tieneSesion: false };
  assert.equal(logica.getCellText(vacia), "");
  assert.match(logica.buildAccessibilityLabel(vacia), /sin estudio/);
});

test("RF-1: el lunes y el salto de día respetan los cambios de hora locales", () => {
  assert.equal(logica.addDays("2026-03-28", 1), "2026-03-29");
  assert.equal(logica.getWeekStart("2026-03-29"), "2026-03-23");
  assert.equal(logica.addDays("2026-10-24", 1), "2026-10-25");
  assert.equal(logica.getWeekStart("2026-10-25"), "2026-10-19");
});
