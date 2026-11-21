// Clave usada para guardar los datos en el navegador
const CLAVE_GUARDADO = "diario-estudio-sesiones";

// Clave y opciones del tema
const CLAVE_TEMA = "diario-estudio-tema";
const TEMAS = ["claro", "arena", "oscuro", "noche", "personalizado"];
const COLORES = ["--fondo", "--tarjeta", "--texto", "--acento"];

const coloresPorDefecto = {
  "--fondo": "#f3f5fb",
  "--tarjeta": "#ffffff",
  "--texto": "#1f2937",
  "--acento": "#4f46e5"
};

// Elementos de la página que usamos
const formulario = document.getElementById("formulario-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const numeroRacha = document.getElementById("racha-numero");
const numeroMejorRacha = document.getElementById("mejor-racha-numero");
const numeroMinutosSemana = document.getElementById("minutos-semana");
const numeroDiasMes = document.getElementById("dias-mes");
const listaSesiones = document.getElementById("lista-sesiones");
const selectorTema = document.getElementById("selector-tema");
const panelColores = document.getElementById("colores-personalizados");
const mapaMeses = document.getElementById("mapa-meses");
const mapaRejilla = document.getElementById("mapa-rejilla");
const mapaDetalle = document.getElementById("mapa-detalle");
const mapaLeyenda = document.getElementById("mapa-leyenda");
const entradasColor = {
  "--fondo": document.getElementById("color-fondo"),
  "--tarjeta": document.getElementById("color-tarjeta"),
  "--texto": document.getElementById("color-texto"),
  "--acento": document.getElementById("color-acento")
};

// Aquí guardamos las sesiones mientras la página está abierta
let sesiones = [];

// Tema activo y colores elegidos para el tema personalizado
let temaActual = "claro";
let coloresPersonalizados = { ...coloresPorDefecto };

// Devuelve una fecha como texto YYYY-MM-DD usando la hora LOCAL del usuario.
// No usamos toISOString() porque convierte a UTC y podría cambiar el día.
function fechaLocalComoTexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte un texto YYYY-MM-DD en una fecha local (medianoche del usuario)
function textoComoFechaLocal(texto) {
  const partes = texto.split("-");
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);
  return new Date(anio, mes - 1, dia);
}

// Muestra una fecha como DD/MM/YYYY
function formatearFecha(texto) {
  const partes = texto.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Carga las sesiones guardadas en localStorage
function cargarSesiones() {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO);
    if (texto) {
      const datos = JSON.parse(texto);
      if (Array.isArray(datos)) {
        sesiones = datos;
      }
    }
  } catch (error) {
    // Si los datos guardados son ilegibles, seguimos con la lista vacía sin borrarlos.
    sesiones = [];
  }
}

// Guarda las sesiones en localStorage
function guardarSesiones() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(sesiones));
  } catch (error) {
    console.error("No se pudieron guardar las sesiones.", error);
  }
}

// Carga el tema elegido y los colores personalizados
function cargarTema() {
  try {
    const texto = localStorage.getItem(CLAVE_TEMA);
    if (!texto) {
      return;
    }
    const datos = JSON.parse(texto);

    if (datos && TEMAS.includes(datos.tema)) {
      temaActual = datos.tema;
    }

    if (datos && datos.colores) {
      for (const nombre of COLORES) {
        const color = datos.colores[nombre];
        if (typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color)) {
          coloresPersonalizados[nombre] = color;
        }
      }
    }
  } catch (error) {
    console.error("No se pudo leer el tema guardado.", error);
  }
}

// Guarda el tema elegido y los colores personalizados
function guardarTema() {
  try {
    localStorage.setItem(CLAVE_TEMA, JSON.stringify({
      tema: temaActual,
      colores: coloresPersonalizados
    }));
  } catch (error) {
    console.error("No se pudo guardar el tema.", error);
  }
}

// Muestra en la página el tema elegido
function aplicarTema() {
  for (const tema of TEMAS) {
    document.body.classList.remove("tema-" + tema);
  }
  for (const nombre of COLORES) {
    document.body.style.removeProperty(nombre);
  }

  selectorTema.value = temaActual;
  panelColores.hidden = temaActual !== "personalizado";

  if (temaActual !== "claro") {
    document.body.classList.add("tema-" + temaActual);
  }

  if (temaActual === "personalizado") {
    for (const nombre of COLORES) {
      document.body.style.setProperty(nombre, coloresPersonalizados[nombre]);
    }
  }
}

// Calcula la racha: días seguidos con sesión que llegan hasta hoy.
// Si hoy aún no hay sesión pero ayer sí, la racha sigue viva y contamos desde ayer.
function calcularRacha() {
  if (sesiones.length === 0) {
    return 0;
  }

  // Un conjunto con los días que tienen al menos una sesión (sin repetir)
  const diasConSesion = new Set(sesiones.map(function (sesion) {
    return sesion.fecha;
  }));

  const hoy = new Date();
  const ancla = textoComoFechaLocal(fechaLocalComoTexto(hoy));

  // Si hoy todavía no se ha estudiado, miramos ayer como último día de la racha
  if (!diasConSesion.has(fechaLocalComoTexto(ancla))) {
    ancla.setDate(ancla.getDate() - 1);
  }

  let racha = 0;
  const dia = textoComoFechaLocal(fechaLocalComoTexto(ancla));

  // Retrocedemos día a día mientras haya sesiones
  while (diasConSesion.has(fechaLocalComoTexto(dia))) {
    racha++;
    dia.setDate(dia.getDate() - 1);
  }

  return racha;
}

// Devuelve el texto del día siguiente de una fecha YYYY-MM-DD
function textoDiaSiguiente(texto) {
  const fecha = textoComoFechaLocal(texto);
  fecha.setDate(fecha.getDate() + 1);
  return fechaLocalComoTexto(fecha);
}

// Calcula la mejor racha de todos los tiempos a partir de las sesiones guardadas.
// Cuenta cada día una sola vez e ignora fechas futuras y con formato inesperado.
// Comparamos días con setDate (no con milisegundos) para respetar los cambios de hora.
function calcularMejorRacha() {
  const hoy = fechaLocalComoTexto(new Date());
  const dias = new Set();

  for (const sesion of sesiones) {
    const texto = sesion.fecha;
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto) || texto > hoy) {
      continue;
    }
    dias.add(texto);
  }

  // YYYY-MM-DD se ordena por fecha automáticamente
  const ordenados = Array.from(dias).sort();

  let mejor = 0;
  let actual = 0;
  let anterior = null;

  for (const dia of ordenados) {
    if (anterior !== null && textoDiaSiguiente(anterior) === dia) {
      actual++;
    } else {
      actual = 1;
    }
    if (actual > mejor) {
      mejor = actual;
    }
    anterior = dia;
  }

  return mejor;
}

// Devuelve el lunes de la semana actual como texto YYYY-MM-DD (fecha local)
function inicioDeSemana() {
  const hoy = textoComoFechaLocal(fechaLocalComoTexto(new Date()));
  const diaSemana = hoy.getDay(); // 0 es domingo, 1 es lunes...
  const diasDesdeLunes = (diaSemana + 6) % 7;
  hoy.setDate(hoy.getDate() - diasDesdeLunes);
  return fechaLocalComoTexto(hoy);
}

// Suma los minutos de las sesiones de esta semana (del lunes a hoy).
// Las fechas futuras y los datos con formato inesperado no cuentan.
function calcularMinutosSemana() {
  const inicio = inicioDeSemana();
  const hoy = fechaLocalComoTexto(new Date());
  let total = 0;

  for (const sesion of sesiones) {
    const texto = sesion.fecha;
    const minutos = sesion.minutos;

    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      continue;
    }
    if (texto < inicio || texto > hoy) {
      continue;
    }
    if (!Number.isFinite(minutos) || minutos <= 0) {
      continue;
    }
    total += minutos;
  }

  return total;
}

// Cuenta los días distintos con sesión en el mes actual, desde el día 1 hasta hoy.
// Se deriva de las sesiones en cada renderizado: no se guarda ningún dato nuevo.
function calcularDiasEstudiadosMes() {
  const hoy = new Date();
  const fin = fechaLocalComoTexto(hoy);
  // getMonth() ya devuelve 0-11, por eso no se resta 1 al construir el día 1.
  const inicio = fechaLocalComoTexto(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const dias = new Set();

  for (const sesion of sesiones) {
    const texto = sesion.fecha;

    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      continue;
    }
    if (texto < inicio || texto > fin) {
      continue;
    }
    dias.add(texto);
  }

  return dias.size;
}

// Dibuja una sola vez la leyenda fija de los cinco estados del mapa
function dibujarLeyenda() {
  const niveles = [
    { clase: "nivel-0", texto: "Sin estudio" },
    { clase: "nivel-1", texto: "1-30 min (incluye sesión sin minutos)" },
    { clase: "nivel-2", texto: "31-60 min" },
    { clase: "nivel-3", texto: "61-120 min" },
    { clase: "nivel-4", texto: "121+ min" }
  ];

  for (const nivel of niveles) {
    const item = document.createElement("li");
    const muestra = document.createElement("span");
    muestra.className = "mapa-muestra " + nivel.clase;
    const texto = document.createElement("span");
    texto.textContent = nivel.texto;

    item.appendChild(muestra);
    item.appendChild(texto);
    mapaLeyenda.appendChild(item);
  }
}

// Dibuja las 12 semanas usando solo las funciones puras de logica.js
function renderizarMapa() {
  const hoy = fechaLocalComoTexto(new Date());
  const mapa = logica.buildHeatMap(sesiones, hoy);

  mapaMeses.innerHTML = "";
  for (const etiqueta of mapa.etiquetasMes) {
    const mes = document.createElement("span");
    mes.className = "mapa-mes";
    mes.textContent = etiqueta.texto;
    mes.style.gridColumn = (etiqueta.columna + 1) + " / span 2";
    mapaMeses.appendChild(mes);
  }

  mapaRejilla.innerHTML = "";
  for (const celda of mapa.celdas) {
    const cuadro = document.createElement("div");
    cuadro.className = "mapa-celda nivel-" + celda.nivel;
    cuadro.tabIndex = 0;
    cuadro.setAttribute("role", "img");
    cuadro.setAttribute("aria-label", celda.etiqueta);

    const detalle = logica.formatTooltipDate(celda.fecha) + ": " +
      (celda.texto === "" ? "Sin estudio registrado" : celda.texto);

    function mostrarDetalle() {
      mapaDetalle.textContent = detalle;
    }

    cuadro.addEventListener("mouseenter", mostrarDetalle);
    cuadro.addEventListener("focus", function () {
      mostrarDetalle();
      cuadro.scrollIntoView({ block: "nearest", inline: "nearest" });
    });

    mapaRejilla.appendChild(cuadro);
  }
}

// Dibuja en la pantalla la racha y la lista de sesiones
function renderizar() {
  numeroRacha.textContent = calcularRacha();
  numeroMejorRacha.textContent = calcularMejorRacha();
  numeroMinutosSemana.textContent = calcularMinutosSemana();
  numeroDiasMes.textContent = calcularDiasEstudiadosMes();
  renderizarMapa();

  listaSesiones.innerHTML = "";

  if (sesiones.length === 0) {
    const mensaje = document.createElement("li");
    mensaje.className = "vacio";
    mensaje.textContent = "Todavía no hay sesiones registradas.";
    listaSesiones.appendChild(mensaje);
    return;
  }

  // Copia del array para ordenarlo sin cambiar el original.
  // Primero por fecha (más reciente primero) y, si empatan, por hora de guardado.
  const ordenadas = sesiones.slice().sort(function (a, b) {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? 1 : -1;
    }
    return b.creadoEn - a.creadoEn;
  });

  for (const sesion of ordenadas) {
    const item = document.createElement("li");
    item.className = "sesion";

    const informacion = document.createElement("div");

    const tema = document.createElement("div");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const fecha = document.createElement("div");
    fecha.className = "sesion-fecha";
    fecha.textContent = formatearFecha(sesion.fecha);

    informacion.appendChild(tema);
    informacion.appendChild(fecha);

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = sesion.minutos + " min";

    item.appendChild(informacion);
    item.appendChild(minutos);
    listaSesiones.appendChild(item);
  }
}

// Cuando se envía el formulario, añadimos una nueva sesión
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Comprobación extra por si el navegador no valida los campos
  if (!fecha || tema === "" || !Number.isFinite(minutos) || minutos <= 0) {
    return;
  }

  sesiones.push({
    fecha: fecha,
    tema: tema,
    minutos: minutos,
    creadoEn: Date.now()
  });

  guardarSesiones();
  renderizar();

  // Dejamos el formulario listo para la siguiente sesión
  campoFecha.value = fechaLocalComoTexto(new Date());
  campoTema.value = "";
  campoMinutos.value = "";
  campoTema.focus();
});

// Al cambiar el tema, lo aplicamos y lo guardamos
selectorTema.addEventListener("change", function () {
  temaActual = selectorTema.value;
  aplicarTema();
  guardarTema();
});

// Al cambiar un color, preparamos la combinación personalizada
for (const nombre of COLORES) {
  entradasColor[nombre].addEventListener("input", function () {
    coloresPersonalizados[nombre] = entradasColor[nombre].value;
    temaActual = "personalizado";
    aplicarTema();
    guardarTema();
  });
}

// Preparamos la página al abrirla
function iniciar() {
  cargarTema();
  for (const nombre of COLORES) {
    entradasColor[nombre].value = coloresPersonalizados[nombre];
  }
  aplicarTema();
  dibujarLeyenda();
  cargarSesiones();
  campoFecha.value = fechaLocalComoTexto(new Date());
  renderizar();
}

iniciar();
