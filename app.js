// Clave usada para guardar los datos en el navegador
const CLAVE_GUARDADO = "diario-estudio-sesiones";

// Elementos de la página que usamos
const formulario = document.getElementById("formulario-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const numeroRacha = document.getElementById("racha-numero");
const numeroMejorRacha = document.getElementById("mejor-racha-numero");
const listaSesiones = document.getElementById("lista-sesiones");

// Aquí guardamos las sesiones mientras la página está abierta
let sesiones = [];

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
    console.error("No se pudieron leer las sesiones guardadas.", error);
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

// Dibuja en la pantalla la racha y la lista de sesiones
function renderizar() {
  numeroRacha.textContent = calcularRacha();
  numeroMejorRacha.textContent = calcularMejorRacha();

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

// Preparamos la página al abrirla
function iniciar() {
  cargarSesiones();
  campoFecha.value = fechaLocalComoTexto(new Date());
  renderizar();
}

iniciar();
