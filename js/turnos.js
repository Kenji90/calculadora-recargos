function parsearHora(texto){
  let s = normalizarTexto(texto).toLowerCase();
  s = s.replace(/\s+/g, "");
  let meridiano = null;
  if (s.endsWith("am")) { meridiano = "am"; s = s.slice(0, -2); }
  if (s.endsWith("pm")) { meridiano = "pm"; s = s.slice(0, -2); }

  const m = s.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;

  let hh = Number(m[1]);
  let mm = m[2] ? Number(m[2]) : 0;
  if (mm < 0 || mm > 59) return null;

  if (meridiano) {
    if (hh < 1 || hh > 12) return null;
    if (meridiano === "am") {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
  }

  if (hh < 0 || hh > 23) return null;
  return {hh, mm};
}

function parsearTurno(textoTurno){
  const original = String(textoTurno || "").trim();
  const t = normalizarTexto(original).toUpperCase();

  if (!t) return {tipo:"vacio"};
  if (t.includes("DESCANSO") || t === "D") return {tipo:"descanso"};

  // Mapeo explícito de los horarios del selector.
  // Esto evita que textos como "12H 18:00 - 06:00" se lean mal tomando "12H" como una hora.
  const horariosExactos = {
    "M": {inicio:{hh:6,mm:0}, fin:{hh:14,mm:0}},
    "T": {inicio:{hh:14,mm:0}, fin:{hh:22,mm:0}},
    "N": {inicio:{hh:22,mm:0}, fin:{hh:6,mm:0}},
    "06:00 - 14:00": {inicio:{hh:6,mm:0}, fin:{hh:14,mm:0}},
    "14:00 - 22:00": {inicio:{hh:14,mm:0}, fin:{hh:22,mm:0}},
    "22:00 - 06:00": {inicio:{hh:22,mm:0}, fin:{hh:6,mm:0}},
    "4H 06:00 - 10:00": {inicio:{hh:6,mm:0}, fin:{hh:10,mm:0}},
    "12H 10:00 - 22:00": {inicio:{hh:10,mm:0}, fin:{hh:22,mm:0}},
    "12H 06:00 - 18:00": {inicio:{hh:6,mm:0}, fin:{hh:18,mm:0}},
    "12H 18:00 - 06:00": {inicio:{hh:18,mm:0}, fin:{hh:6,mm:0}}
  };

  if (horariosExactos[t]) {
    return {tipo:"turno", ...horariosExactos[t]};
  }

  // Para texto manual libre: "6pm a 6am", "10pm - 6am", "06:00 a 14:00".
  // Primero quitamos prefijos de duración como 4H o 12H para no confundirlos con horas de inicio.
  const limpio = original.replace(/\b\d{1,2}\s*H\b/ig, "").trim();
  const horaRegex = /\b\d{1,2}(?::?\d{2})?\s*(?:am|pm)?\b/ig;
  const matches = limpio.match(horaRegex);
  if (matches && matches.length >= 2) {
    const inicio = parsearHora(matches[0]);
    const fin = parsearHora(matches[1]);
    if (inicio && fin) return {tipo:"turno", inicio, fin};
  }

  return {tipo:"error", mensaje:`Turno no reconocido: "${original}"`};
}

function claseTurnoPorValor(valor){
  const v = String(valor || "").trim();
  if (!v) return "color-vacio";
  if (v === "DESCANSO") return "color-descanso";
  if (v === "06:00 - 14:00") return "color-m";
  if (v === "14:00 - 22:00") return "color-t";
  if (v === "22:00 - 06:00") return "color-n";
  if (v === "4H 06:00 - 10:00") return "color-4h";
  if (v === "12H 06:00 - 18:00") return "color-12h-dia";
  if (v === "12H 10:00 - 22:00") return "color-12h-tarde";
  if (v === "12H 18:00 - 06:00") return "color-12h-noche";
  return "color-vacio";
}

function actualizarEstiloFila(tr){
  if (!tr) return;
  const festivoChk = tr.querySelector('.festivo-dia');
  const turnoSelect = tr.querySelector('.turno-dia');
  const dayBadge = tr.querySelector('.day-badge');

  tr.classList.toggle('is-domingo-festivo', Boolean(festivoChk && festivoChk.checked));

  if (dayBadge) {
    if (festivoChk?.checked) {
      dayBadge.textContent = festivoChk.disabled ? "DOMINGO" : "FESTIVO";
      dayBadge.classList.add("visible");
    } else {
      dayBadge.textContent = "";
      dayBadge.classList.remove("visible");
    }
  }

  if (turnoSelect) {
    turnoSelect.classList.remove(
      'color-vacio','color-descanso','color-m','color-t','color-n',
      'color-4h','color-12h-dia','color-12h-tarde','color-12h-noche'
    );
    turnoSelect.classList.add(claseTurnoPorValor(turnoSelect.value));
  }
}

let ciclo6x2AplicadoInicial = false;

function reiniciarCiclo6x2Inicial(){
  ciclo6x2AplicadoInicial = false;
}

function contarTurnosTrabajoSeleccionados(){
  return Array.from(document.querySelectorAll("#tablaCalendario tbody tr .turno-dia"))
    .filter(sel => parsearTurno(sel.value || "").tipo === "turno")
    .length;
}

function obtenerOrdenCiclo6x2(){
  const inicio = document.getElementById("inicioCiclo6x2Interno")?.value || "M";
  const ordenBase = ["M", "N", "T"];
  const indiceInicio = ordenBase.indexOf(inicio);

  if (indiceInicio === -1) return ordenBase;
  return ordenBase.slice(indiceInicio).concat(ordenBase.slice(0, indiceInicio));
}

function turnoPrincipalDesdeValor(valor){
  const v = String(valor || "").trim();
  if (v === "06:00 - 14:00") return "M";
  if (v === "22:00 - 06:00") return "N";
  if (v === "14:00 - 22:00") return "T";
  return null;
}

function valorTurnoPrincipal(clave){
  const mapa = {
    M: "06:00 - 14:00",
    N: "22:00 - 06:00",
    T: "14:00 - 22:00"
  };
  return mapa[clave] || "";
}

function valorTurnoParaBloque(turnoInicial, numeroBloque){
  const orden = obtenerOrdenCiclo6x2();
  const clave = orden[numeroBloque % orden.length];
  return valorTurnoPrincipal(clave) || turnoInicial;
}

function aplicarCiclo6x2DesdeFila(filaInicio, turnoInicial, opciones = {}){
  const turno = parsearTurno(turnoInicial);
  if (!filaInicio || turno.tipo !== "turno") return false;

  const filas = Array.from(document.querySelectorAll("#tablaCalendario tbody tr"));
  const inicioIdx = filas.indexOf(filaInicio);
  if (inicioIdx < 0) return false;

  for (let i = inicioIdx; i < filas.length; i++) {
    const posicion = i - inicioIdx;
    const bloque = Math.floor(posicion / 8);
    const diaDentroCiclo = posicion % 8;
    const select = filas[i].querySelector(".turno-dia");
    if (!select) continue;

    select.value = diaDentroCiclo < 6
      ? valorTurnoParaBloque(turnoInicial, bloque)
      : "DESCANSO";

    actualizarEstiloFila(filas[i]);
  }

  actualizarResumenPeriodo();
  limpiarResultado();
  if (opciones.mensaje) mostrarOk("Ciclo 6x2 aplicado desde el primer turno seleccionado.");
  return true;
}

function aplicarCiclo6x2DesdePrimerTurno(){
  const filas = Array.from(document.querySelectorAll("#tablaCalendario tbody tr"));
  const filaInicio = filas.find(tr => {
    const valor = tr.querySelector(".turno-dia")?.value || "";
    return parsearTurno(valor).tipo === "turno";
  });

  if (!filaInicio) {
    mostrarErrores(["Seleccione primero un turno de trabajo para iniciar el ciclo 6x2."]);
    return;
  }

  const turnoInicial = filaInicio.querySelector(".turno-dia")?.value || "";
  aplicarCiclo6x2DesdeFila(filaInicio, turnoInicial, {mensaje:true});
}

function manejarCambioCalendario(e){
  const tr = e.target.closest("tr");
  if (!tr) return;

  actualizarEstiloFila(tr);

  if (e.target.classList.contains("turno-dia")) {
    const turno = parsearTurno(e.target.value || "");
    const autoCiclo = (document.getElementById("autoCiclo6x2Interno")?.value || "si") === "si";

    if (autoCiclo && !ciclo6x2AplicadoInicial && turno.tipo === "turno" && contarTurnosTrabajoSeleccionados() === 1) {
      ciclo6x2AplicadoInicial = true;
      aplicarCiclo6x2DesdeFila(tr, e.target.value);
      return;
    }
  }

  actualizarResumenPeriodo();
  limpiarResultado();
}

function obtenerEstadoCalendarioActual(){
  const estado = new Map();

  document.querySelectorAll("#tablaCalendario tbody tr").forEach(tr => {
    const fechaTxt = tr.children[2]?.textContent.trim() || "";
    const fecha = parsearFecha(fechaTxt);
    if (!fecha) return;

    estado.set(fechaKey(fecha), {
      turno: tr.querySelector(".turno-dia")?.value || "",
      festivo: Boolean(tr.querySelector(".festivo-dia")?.checked)
    });
  });

  return estado;
}

function generarCalendario(){
  const inicio = parsearFecha(document.getElementById("fechaInicioTurno").value);
  const fin = parsearFecha(document.getElementById("fechaFinTurno").value);
  const tbody = document.querySelector("#tablaCalendario tbody");

  if (!inicio || !fin) {
    mostrarErrores(["Ingrese fechas válidas en los campos Desde y Hasta."]);
    return;
  }

  if (fin < inicio) {
    mostrarErrores(["La fecha fin no puede ser menor que la fecha inicio."]);
    return;
  }

  // Guarda lo que ya se había seleccionado antes de reconstruir la lista.
  // Así, si se amplía el rango hacia atrás o hacia adelante, lo ya digitado permanece.
  const estadoPrevio = obtenerEstadoCalendarioActual();

  reiniciarCiclo6x2Inicial();
  tbody.innerHTML = "";

  const NOMBRES_DIA = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const TURNOS_OPCIONES = [
  ["DESCANSO", "DESCANSO"],
  ["06:00 - 14:00", "06:00 - 14:00"],
  ["14:00 - 22:00", "14:00 - 22:00"],
  ["22:00 - 06:00", "22:00 - 06:00"],
  ["4H 06:00 - 10:00", "4H 06:00 - 10:00"],
  ["12H 10:00 - 22:00", "12H 10:00 - 22:00"],
  ["12H 06:00 - 18:00", "12H 06:00 - 18:00"],
  ["12H 18:00 - 06:00", "12H 18:00 - 06:00"]
];

  let fila = 1;
  for (let fecha = new Date(inicio); fecha <= fin; fecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1)) {
    const diaSemana = fecha.getDay();
    const esDomingo = diaSemana === 0;
    const key = fechaKey(fecha);
    const esFestivoPrecargado = FESTIVOS_PRE_CARGADOS.has(key);
    const previo = estadoPrevio.get(key);
    const fechaMostrar = `${pad2(fecha.getDate())}/${pad2(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fila}</td>
      <td><div class="day-cell"><strong>${NOMBRES_DIA[diaSemana]}</strong><span class="day-badge"></span></div></td>
      <td>${fechaMostrar}</td>
      <td class="number">
        <input
          type="checkbox"
          class="festivo-dia"
          aria-label="Marcar ${fechaMostrar} como dominical o festivo"
          ${(previo ? (esDomingo || previo.festivo) : (esDomingo || esFestivoPrecargado)) ? "checked" : ""}
          ${esDomingo ? "disabled title='Domingo automático'" : (esFestivoPrecargado && !previo ? "title='Festivo precargado, editable'" : "")}
        >
      </td>
      <td>
        <select class="turno-dia" aria-label="Horario del ${fechaMostrar}">
          <option value="">Seleccione...</option>
          ${TURNOS_OPCIONES.map(([value,label]) => `<option value="${value}">${label}</option>`).join("")}
        </select>
      </td>
    `;
    tbody.appendChild(tr);

    if (previo?.turno && Array.from(tr.querySelector(".turno-dia").options).some(o => o.value === previo.turno)) {
      tr.querySelector(".turno-dia").value = previo.turno;
    }

    actualizarEstiloFila(tr);
    fila++;
  }

  actualizarResumenPeriodo();
  limpiarResultado();
}

function limpiarCalendario(){
  reiniciarCiclo6x2Inicial();
  document.querySelector("#tablaCalendario tbody").innerHTML = "";
  actualizarResumenPeriodo();
  limpiarResultado();
}

function actualizarResumenPeriodo(){
  const filas = Array.from(document.querySelectorAll("#tablaCalendario tbody tr"));
  let turnos = 0;
  let descansos = 0;
  let festivos = 0;

  filas.forEach(tr => {
    const turno = tr.querySelector(".turno-dia")?.value || "";
    if (turno === "DESCANSO") descansos++;
    else if (turno) turnos++;
    if (tr.querySelector(".festivo-dia")?.checked) festivos++;
  });

  const inicio = parsearFecha(document.getElementById("fechaInicioTurno")?.value || "");
  const fin = parsearFecha(document.getElementById("fechaFinTurno")?.value || "");
  const titulo = document.getElementById("resumenPeriodoTitulo");
  const detalle = document.getElementById("resumenPeriodo");

  if (titulo) {
    if (inicio && fin) {
      const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
      const nombreMes = meses[inicio.getMonth()];
      const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
      titulo.textContent = inicio.getMonth() === fin.getMonth() && inicio.getFullYear() === fin.getFullYear()
        ? `${mesCapitalizado} ${inicio.getFullYear()}`
        : `${pad2(inicio.getDate())}/${pad2(inicio.getMonth()+1)}/${inicio.getFullYear()} — ${pad2(fin.getDate())}/${pad2(fin.getMonth()+1)}/${fin.getFullYear()}`;
    } else {
      titulo.textContent = "Periodo seleccionado";
    }
  }

  if (detalle) detalle.textContent = `${filas.length} días · ${turnos} turnos · ${descansos} descansos · ${festivos} domingos/festivos`;
}
