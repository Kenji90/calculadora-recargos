const CONFIG_RECARGOS_STORAGE_KEY = "recargos-configuracion-v1";
const CONFIG_RECARGOS_IDS = [
  "pRN",
  "pRDF",
  "pRNF",
  "pHED",
  "pHEN",
  "pHEDF",
  "pHENF",
  "horasExtraBloqueInterno",
  "inicioCiclo6x2Interno"
];

function cargarConfiguracionGuardada(){
  try {
    const raw = localStorage.getItem(CONFIG_RECARGOS_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    CONFIG_RECARGOS_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && Object.prototype.hasOwnProperty.call(data, id)) {
        el.value = data[id];
      }
    });
  } catch (e) {}
}

function guardarConfiguracionLocal(){
  const data = {};
  CONFIG_RECARGOS_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  try { localStorage.setItem(CONFIG_RECARGOS_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function guardarConfiguracion(){
  guardarConfiguracionLocal();

  const hayTurnos = document.querySelectorAll("#tablaCalendario tbody tr").length > 0;
  if (!hayTurnos) {
    mostrarOk("Configuración guardada. Genere o importe turnos para calcular.", false);
    return;
  }

  calcular();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarConfiguracionGuardada();
  const salarioInput = document.getElementById("salario");
  formatearSalarioInput();
  actualizarValorHoraVista();

  salarioInput?.addEventListener("input", () => {
    actualizarValorHoraVista();
    pintarResumen(resultadoActual || []);
  });

  salarioInput?.addEventListener("blur", () => {
    formatearSalarioInput();
    actualizarValorHoraVista();
    pintarResumen(resultadoActual || []);
  });

  salarioInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    formatearSalarioInput();
    actualizarValorHoraVista();
    pintarResumen(resultadoActual || []);
    salarioInput.blur();
  });

  salarioInput?.addEventListener("focus", () => salarioInput.select());

  ["auxTransporte","porcSalud","porcPension","diasPago"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => pintarResumen(resultadoActual || []));
  });

  // La lista inicia vacía. El usuario genera el rango cuando seleccione fechas.
  actualizarResumenPeriodo();

  const tbody = document.querySelector("#tablaCalendario tbody");
  tbody.addEventListener("change", (e) => {
    manejarCambioCalendario(e);
  });

  const archivo = document.getElementById("archivoTurnos");
  if (archivo) archivo.addEventListener("change", importarArchivoTurnos);
});

function limpiarResultado(){
  resultadoActual = [];
  document.querySelector("#tablaResultado tbody").innerHTML = "";
  document.getElementById("contadorResultado").textContent = "0 registros";
  pintarResumen([]);
  pintarFormatoRecargos([]);
  limpiarMensajes();
}

function limpiarMensajes(){
  const e = document.getElementById("mensajesError");
  const o = document.getElementById("mensajesOk");
  if (mensajeOkTimer) {
    clearTimeout(mensajeOkTimer);
    mensajeOkTimer = null;
  }
  if (e) { e.style.display = "none"; e.textContent = ""; }
  if (o) { o.style.display = "none"; o.textContent = ""; }
}

function resumirErrores(lista){
  const errores = Array.isArray(lista) ? lista.filter(Boolean) : [];
  if (!errores.length) return "";

  const erroresHorario = errores.filter(x => /Fila\s+\d+\s*\([^)]*\):\s*seleccione un horario o DESCANSO/i.test(x));
  if (erroresHorario.length === errores.length) {
    return `Hay ${erroresHorario.length} días sin horario. Seleccione un horario o DESCANSO para poder calcular.`;
  }

  if (errores.length > 3) {
    return `Hay ${errores.length} validaciones pendientes. Revise salario, fechas y turnos antes de calcular.`;
  }

  return errores.join("\n");
}

function mostrarErrores(lista){
  const e = document.getElementById("mensajesError");
  const o = document.getElementById("mensajesOk");
  if (mensajeOkTimer) {
    clearTimeout(mensajeOkTimer);
    mensajeOkTimer = null;
  }
  if (o) { o.style.display = "none"; o.textContent = ""; }
  if (!e) return;
  e.textContent = resumirErrores(lista);
  e.style.display = "block";
}

function mostrarOk(txt, autoCerrar=true){
  const o = document.getElementById("mensajesOk");
  const e = document.getElementById("mensajesError");
  if (mensajeOkTimer) {
    clearTimeout(mensajeOkTimer);
    mensajeOkTimer = null;
  }
  if (e) { e.style.display = "none"; e.textContent = ""; }
  if (!o) return;
  o.textContent = txt;
  o.style.display = "block";
  if (autoCerrar) {
    mensajeOkTimer = setTimeout(() => {
      o.style.display = "none";
      o.textContent = "";
      mensajeOkTimer = null;
    }, 4200);
  }
}

function filasResultadoComoArray(){
  return resultadoActual.map(r => ({
    "NOMBRE CONCEPTO": r.concepto,
    "No de HORAS": formatoHoras(r.horas),
    "Fecha y hora de inicio de la HHEE": formatoFechaHora(r.inicio),
    "Fecha y hora de finalización de la HHEE": formatoFechaHora(r.fin)
  }));
}

function exportarCSV(){
  if (!resultadoActual.length) {
    alert("No hay resultado para exportar.");
    return;
  }

  const headers = [
    "NOMBRE CONCEPTO",
    "No de HORAS",
    "Fecha y hora de inicio de la HHEE",
    "Fecha y hora de finalización de la HHEE"
  ];

  const rows = filasResultadoComoArray();
  const csv = [
    headers.join(";"),
    ...rows.map(r => headers.map(h => csvCell(r[h])).join(";"))
  ].join("\r\n");

  const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resultado_recargos.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value){
  const s = String(value ?? "");
  if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

async function copiarTabla(){
  if (!resultadoActual.length) {
    alert("No hay resultado para copiar.");
    return;
  }
  const headers = [
    "NOMBRE CONCEPTO",
    "No de HORAS",
    "Fecha y hora de inicio de la HHEE",
    "Fecha y hora de finalización de la HHEE"
  ];
  const rows = filasResultadoComoArray();
  const tsv = [
    headers.join("\t"),
    ...rows.map(r => headers.map(h => r[h]).join("\t"))
  ].join("\n");

  try {
    await navigator.clipboard.writeText(tsv);
    alert("Tabla copiada al portapapeles.");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Tabla copiada al portapapeles.");
  }
}


function confirmarLimpiarLista(){
  if (!document.querySelectorAll("#tablaCalendario tbody tr").length) {
    limpiarCalendario();
    return;
  }
  if (!confirm("¿Desea limpiar toda la lista de turnos?")) return;
  limpiarCalendario();
}

function confirmarLimpiarResultado(){
  if (!resultadoActual.length) {
    limpiarResultado();
    return;
  }
  if (!confirm("¿Desea limpiar el resultado calculado?")) return;
  limpiarResultado();
}

function prepararDropzone(){
  const zona = document.getElementById("dropzoneTurnos");
  if (!zona) return;

  ["dragenter", "dragover"].forEach(tipo => zona.addEventListener(tipo, e => {
    e.preventDefault();
    zona.classList.add("dragover");
  }));

  ["dragleave", "drop"].forEach(tipo => zona.addEventListener(tipo, e => {
    e.preventDefault();
    zona.classList.remove("dragover");
  }));

  zona.addEventListener("drop", e => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    importarArchivoTurnos({target:{files:[file], value:""}});
  });
}

function tablaComoTexto(tablaId){
  const tabla = document.getElementById(tablaId);
  if (!tabla) return "";

  const filas = Array.from(tabla.querySelectorAll("tr"));
  return filas.map(tr => {
    return Array.from(tr.children)
      .map(celda => celda.textContent.replace(/\s+/g, " ").trim())
      .join("\t");
  }).filter(Boolean).join("\n");
}

async function copiarResumen(){
  const texto = tablaComoTexto("tablaResumen");
  if (!texto) {
    mostrarErrores(["No hay resumen para copiar."]);
    return;
  }

  try {
    await navigator.clipboard.writeText(texto);
    mostrarOk("Resumen copiado al portapapeles.");
  } catch (err) {
    mostrarErrores(["No fue posible copiar el resumen automáticamente."]);
  }
}

function imprimirVista(vista){
  cambiarVista(vista);
  setTimeout(() => window.print(), 120);
}

async function copiarFormatoRecargos(){
  const texto = tablaComoTexto("tablaFormatoRecargos");
  if (!texto || texto.includes("No hay datos calculados") || texto.includes("No hay recargos ni horas extra para mostrar")) {
    mostrarErrores(["No hay formato de recargos para copiar."]);
    return;
  }

  try {
    await navigator.clipboard.writeText(texto);
    mostrarOk("Formato copiado al portapapeles.");
  } catch (err) {
    mostrarErrores(["No fue posible copiar el formato automáticamente."]);
  }
}

function establecerRangoMesActual(){
  const inicioEl = document.getElementById("fechaInicioTurno");
  const finEl = document.getElementById("fechaFinTurno");
  if (!inicioEl || !finEl) return;
  if (inicioEl.value || finEl.value) return;

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  inicioEl.value = formatoFechaInput(inicio);
  finEl.value = formatoFechaInput(fin);
}

function cambiarVista(vista){
  if (vista === "formato") {
    pintarFormatoRecargos(resultadoActual || []);
  }

  document.querySelectorAll(".view-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.view === vista);
  });

  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.toggle("is-active", panel.classList.contains(`view-${vista}`));
  });

  document.querySelectorAll(".view-actions").forEach(barra => {
    barra.classList.toggle("is-active", barra.classList.contains(`view-${vista}`));
  });

  limpiarMensajes();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function actualizarBotonTema(){
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const icon = btn.querySelector(".theme-toggle-icon");
  const text = btn.querySelector(".theme-toggle-text");
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  if (icon) icon.textContent = dark ? "☀" : "☾";
  if (text) text.textContent = dark ? "Claro" : "Oscuro";
  btn.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  btn.setAttribute("title", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
}

function alternarTema(){
  const actual = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const siguiente = actual === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", siguiente);
  try { localStorage.setItem("recargos-theme", siguiente); } catch (e) {}
  actualizarBotonTema();
}

function cargarTema(){
  let guardado = "dark";
  try { guardado = localStorage.getItem("recargos-theme") || "dark"; } catch (e) {}
  document.documentElement.setAttribute("data-theme", guardado === "light" ? "light" : "dark");
  actualizarBotonTema();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarTema();
  establecerRangoMesActual();
  prepararDropzone();
  actualizarResumenPeriodo();
});
