// Lógica pura del mapa de calor: sin DOM, sin localStorage y sin reloj implícito.
// Quien llama pasa siempre la fecha de hoy como texto local "AAAA-MM-DD".

const DIAS_MAPA = 84;
const NOMBRES_MES = ["ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"];

// Devuelve una fecha como texto AAAA-MM-DD usando la hora LOCAL del usuario.
function getLocalDateText(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Convierte texto AAAA-MM-DD en fecha local (medianoche del usuario).
// Nunca new Date("AAAA-MM-DD"): eso se interpreta en UTC y desplaza el día.
function parseLocalDate(text) {
  const parts = text.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Suma o resta días con setDate, nunca con milisegundos: los cambios de hora no suman 24 h.
function addDays(text, amount) {
  const date = parseLocalDate(text);
  date.setDate(date.getDate() + amount);
  return getLocalDateText(date);
}

// Solo acepta texto AAAA-MM-DD que corresponda a un día real del calendario.
function isValidDateText(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  return getLocalDateText(parseLocalDate(text)) === text;
}

// Los textos AAAA-MM-DD se ordenan cronológicamente como cadenas.
function isFutureDate(text, today) {
  return text > today;
}

// Devuelve el lunes de la semana local que contiene hoy.
function getWeekStart(today) {
  const date = parseLocalDate(today);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return getLocalDateText(date);
}

// Doce semanas: del lunes de hace 11 semanas al domingo de la semana actual.
function getHeatMapRange(today) {
  const monday = getWeekStart(today);
  const start = addDays(monday, -77);
  const end = addDays(monday, 6);
  const days = [];

  for (let index = 0; index < DIAS_MAPA; index++) {
    days.push(addDays(start, index));
  }

  return { inicio: start, fin: end, dias: days };
}

// Un minuto válido es un entero finito mayor que cero.
function isValidMinutes(value) {
  return Number.isInteger(value) && value > 0;
}

// Agrupa las sesiones por día. Las fechas futuras o raras se excluyen sin borrarlas.
function groupMinutesByDate(sessions, today) {
  const grouped = {};

  if (!Array.isArray(sessions)) {
    return grouped;
  }

  for (const session of sessions) {
    if (!session || typeof session !== "object") {
      continue;
    }

    const dateText = session.fecha;
    if (!isValidDateText(dateText) || isFutureDate(dateText, today)) {
      continue;
    }

    if (!grouped[dateText]) {
      grouped[dateText] = { total: 0, tieneSesion: false };
    }
    grouped[dateText].tieneSesion = true;

    if (isValidMinutes(session.minutos)) {
      grouped[dateText].total += session.minutos;
    }
  }

  return grouped;
}

// Escala fija: 0 vacío, 1 con 1-30 min o sesión sin minutos, 2 con 31-60, 3 con 61-120, 4 con 121+.
function getIntensityLevel(total, hasSession) {
  if (!hasSession) {
    return 0;
  }
  if (total === 0 || total <= 30) {
    return 1;
  }
  if (total <= 60) {
    return 2;
  }
  if (total <= 120) {
    return 3;
  }
  return 4;
}

// Una etiqueta por mes presente, en la primera columna (de siete días) donde aparece.
function getMonthLabels(days) {
  const labels = [];
  const firstYear = parseLocalDate(days[0]).getFullYear();
  const lastYear = parseLocalDate(days[days.length - 1]).getFullYear();
  const includeYear = firstYear !== lastYear;
  let previousKey = "";

  for (let index = 0; index < days.length; index++) {
    const date = parseLocalDate(days[index]);
    const key = date.getFullYear() + "-" + date.getMonth();

    if (key === previousKey) {
      continue;
    }

    const monthName = NOMBRES_MES[date.getMonth()];
    labels.push({
      texto: includeYear ? monthName + " " + date.getFullYear() : monthName,
      columna: Math.floor(index / 7)
    });
    previousKey = key;
  }

  return labels;
}

function formatTooltipDate(text) {
  const parts = text.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

// Texto que se muestra al pasar el puntero o al enfocar una celda.
function getCellText(cell) {
  if (cell.futuro || !cell.tieneSesion) {
    return "";
  }
  if (cell.minutos === 0) {
    return "Sesión registrada";
  }
  return cell.minutos + " min";
}

// Etiqueta para lectores de pantalla: fecha, detalle y nivel, sin depender del color.
function buildAccessibilityLabel(cell) {
  const dateText = formatTooltipDate(cell.fecha);

  if (cell.futuro) {
    return dateText + ": sin estudio registrado en el rango";
  }
  if (!cell.tieneSesion) {
    return dateText + ": sin estudio registrado, celda vacía";
  }

  const detail = cell.minutos === 0
    ? "sesión registrada, minutos no disponibles"
    : cell.minutos + " minutos";

  return dateText + ": " + detail + ", nivel " + cell.nivel + " de 4";
}

// Única función que consume la interfaz: devuelve 84 celdas ya descritas.
function buildHeatMap(sessions, today) {
  const days = getHeatMapRange(today).dias;
  const grouped = groupMinutesByDate(sessions, today);
  const cells = [];

  for (const dateText of days) {
    const data = grouped[dateText] || { total: 0, tieneSesion: false };
    const future = isFutureDate(dateText, today);
    const level = future || !data.tieneSesion
      ? 0
      : getIntensityLevel(data.total, data.tieneSesion);

    const cell = {
      fecha: dateText,
      nivel: level,
      futuro: future,
      minutos: data.total,
      tieneSesion: data.tieneSesion
    };
    cell.texto = getCellText(cell);
    cell.etiqueta = buildAccessibilityLabel(cell);
    cells.push(cell);
  }

  return { celdas: cells, etiquetasMes: getMonthLabels(days) };
}

// Un solo objeto de funciones puras, usable con require() en Node y como script clásico
// en el navegador (file:// no admite módulos ES).
const logicaApi = {
  getLocalDateText,
  parseLocalDate,
  addDays,
  isValidDateText,
  isFutureDate,
  getWeekStart,
  getHeatMapRange,
  isValidMinutes,
  groupMinutesByDate,
  getIntensityLevel,
  getMonthLabels,
  formatTooltipDate,
  getCellText,
  buildAccessibilityLabel,
  buildHeatMap
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = logicaApi;
} else {
  globalThis.logica = logicaApi;
}
