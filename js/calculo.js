function escapeHtml(s){
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function obtenerFestivos(){
  const set = new Set();
  const errores = [];

  document.querySelectorAll("#tablaCalendario tbody tr").forEach((tr, idx) => {
    const celdas = tr.querySelectorAll("td");
    const fechaTxt = celdas[2]?.textContent.trim() || "";
    const festivoChk = tr.querySelector(".festivo-dia");
    if (!festivoChk?.checked) return;

    const fecha = parsearFecha(fechaTxt);
    if (!fecha) errores.push(`Fila ${idx + 1}: fecha no reconocida "${fechaTxt}".`);
    else set.add(fechaKey(fecha));
  });

  return {set, errores};
}

function obtenerFactores(){
  return {
    [CONCEPTOS.RN]: numeroDesdeTexto(document.getElementById("pRN").value),
    [CONCEPTOS.RDF]: numeroDesdeTexto(document.getElementById("pRDF").value),
    [CONCEPTOS.RNF]: numeroDesdeTexto(document.getElementById("pRNF").value),
    [CONCEPTOS.HED]: numeroDesdeTexto(document.getElementById("pHED").value),
    [CONCEPTOS.HEN]: numeroDesdeTexto(document.getElementById("pHEN").value),
    [CONCEPTOS.HEDF]: numeroDesdeTexto(document.getElementById("pHEDF").value),
    [CONCEPTOS.HENF]: numeroDesdeTexto(document.getElementById("pHENF").value)
  };
}

const CONFIG_EXTRAS_BLOQUE = {
  "4_t5_t6_2h": {
    totalBloque: 4,
    descripcion: "4 horas: 2 últimas horas del turno 5 y 2 últimas horas del turno 6",
    distribucion: [
      {indice: 4, horas: 2},
      {indice: 5, horas: 2}
    ]
  },
  "6_t5_t6_3h": {
    totalBloque: 6,
    descripcion: "6 horas: 3 últimas horas del turno 5 y 3 últimas horas del turno 6",
    distribucion: [
      {indice: 4, horas: 3},
      {indice: 5, horas: 3}
    ]
  },
  "6_t4_t5_t6_2h": {
    totalBloque: 6,
    descripcion: "6 horas: 2 últimas horas del turno 4, turno 5 y turno 6",
    distribucion: [
      {indice: 3, horas: 2},
      {indice: 4, horas: 2},
      {indice: 5, horas: 2}
    ]
  }
};

function obtenerConfiguracionExtrasBloque(){
  const modo = document.getElementById("horasExtraBloqueInterno")?.value || "6_t4_t5_t6_2h";
  return CONFIG_EXTRAS_BLOQUE[modo] || CONFIG_EXTRAS_BLOQUE["6_t4_t5_t6_2h"];
}

function construirVentanasExtrasPorBloque(rows, configExtras){
  const ventanas = new Map();
  let bloque = [];

  const agregarVentana = (row, horasExtraTurno) => {
    if (!row || row.tipo !== "turno") return;
    const inicio = new Date(row.fin.getTime() - horasExtraTurno * MS_HORA);
    const fin = new Date(row.fin.getTime());
    if (inicio <= row.inicio) return;
    if (!ventanas.has(row)) ventanas.set(row, []);
    ventanas.get(row).push({inicio, fin});
  };

  const cerrarBloque = () => {
    const distribucion = Array.isArray(configExtras?.distribucion) ? configExtras.distribucion : [];
    for (let i = 0; i + 5 < bloque.length; i += 6) {
      distribucion.forEach(item => {
        agregarVentana(bloque[i + item.indice], item.horas);
      });
    }
    bloque = [];
  };

  for (const row of rows) {
    if (row.tipo === "descanso") {
      cerrarBloque();
      continue;
    }
    if (row.tipo === "turno") bloque.push(row);
  }

  cerrarBloque();
  return ventanas;
}

function estaEnVentanaExtra(d, ventanas){
  return (ventanas || []).some(v => d >= v.inicio && d < v.fin);
}

function leerTurnos(){
  const filas = Array.from(document.querySelectorAll("#tablaCalendario tbody tr"));
  const errores = [];
  const rows = [];

  filas.forEach((tr, idx) => {
    const celdas = tr.querySelectorAll("td");
    const dia = celdas[1]?.textContent.trim() || "";
    const fechaTxt = celdas[2]?.textContent.trim() || "";
    const turnoTxtOriginal = tr.querySelector(".turno-dia")?.value.trim() || "";

    let turnoTxt = turnoTxtOriginal;

    if (!turnoTxt) {
      errores.push(`Fila ${idx + 1} (${fechaTxt || "sin fecha"}): seleccione un horario o DESCANSO.`);
      return;
    }

    const fecha = parsearFecha(fechaTxt);
    if (!fecha) {
      errores.push(`Fila ${idx + 1}: fecha no reconocida "${fechaTxt}".`);
      return;
    }

    const turno = parsearTurno(turnoTxt);
    if (turno.tipo === "error") {
      errores.push(`Fila ${idx + 1}: ${turno.mensaje}.`);
      return;
    }

    if (turno.tipo === "descanso") {
      rows.push({tipo:"descanso", dia, fecha, turnoTxt});
      return;
    }

    if (turno.tipo === "vacio") return;

    let inicio = crearFechaConHora(fecha, turno.inicio.hh, turno.inicio.mm);
    let fin = crearFechaConHora(fecha, turno.fin.hh, turno.fin.mm);
    if (fin <= inicio) fin = new Date(fin.getTime() + 24 * MS_HORA);

    rows.push({tipo:"turno", dia, fecha, turnoTxt, inicio, fin});
  });

  return {rows, errores};
}

function tiempoMinutosDelDia(d){
  return d.getHours() * 60 + d.getMinutes();
}

function parseHoraCampo(id){
  const h = parsearHora(document.getElementById(id).value);
  return h ? h.hh * 60 + h.mm : null;
}

function esNocturna(d, inicioNoct, finNoct){
  const min = tiempoMinutosDelDia(d);
  if (inicioNoct > finNoct) {
    return min >= inicioNoct || min < finNoct;
  }
  return min >= inicioNoct && min < finNoct;
}

function esFestivoODomingo(d, festivos){
  return d.getDay() === 0 || festivos.has(fechaKey(d));
}

function siguienteMedianoche(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

function siguienteHoraDelDia(d, minutosDia){
  const hh = Math.floor(minutosDia / 60);
  const mm = minutosDia % 60;
  let x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
  if (x <= d) x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, hh, mm, 0, 0);
  return x;
}

function siguienteLunes(d){
  const base = soloFecha(d);
  const dia = base.getDay(); // 0 domingo, 1 lunes
  const diasHastaLunes = dia === 0 ? 1 : 8 - dia;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diasHastaLunes, 0, 0, 0, 0);
}

function semanaKey(d){
  const base = soloFecha(d);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day; // lunes de la semana
  const lunes = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
  return fechaKey(lunes);
}

function clasificarSegmento({extra, nocturna, festivo}){
  if (extra) {
    if (festivo && nocturna) return CONCEPTOS.HENF;
    if (festivo && !nocturna) return CONCEPTOS.HEDF;
    if (!festivo && nocturna) return CONCEPTOS.HEN;
    return CONCEPTOS.HED;
  }

  if (festivo && nocturna) return CONCEPTOS.RNF;
  if (festivo && !nocturna) return CONCEPTOS.RDF;
  if (!festivo && nocturna) return CONCEPTOS.RN;

  // Jornada ordinaria diurna en día normal: no genera recargo ni registro.
  return "";
}

function calcular(){
  console.log("calcular() llamado");
  limpiarMensajes();
  const errores = [];

  const salario = numeroDesdeTexto(document.getElementById("salario").value);
  const divisor = 220;
  const valorHora = obtenerValorHora();
  const proyecto = document.getElementById("proyecto")?.value.trim() || "";
  const descripcion = document.getElementById("descripcion")?.value.trim() || "";

  if (!salario) errores.push("El salario básico mensual está vacío o no es válido.");

  const inicioNoct = parseHoraCampo("inicioNocturnaInterno");
  const finNoct = parseHoraCampo("finNocturnaInterno");
  if (inicioNoct === null || finNoct === null) errores.push("La jornada nocturna no es válida.");

  const fechaCambio = parsearFecha(document.getElementById("fechaCambioInterno").value);
  if (!fechaCambio) errores.push("La fecha de cambio legal no es válida.");

  const limiteAntes = numeroDesdeTexto(document.getElementById("limiteAntesInterno").value);
  const limiteDespues = numeroDesdeTexto(document.getElementById("limiteDespuesInterno").value);
  if (!limiteAntes || !limiteDespues) errores.push("Los límites de horas no son válidos.");

  const configExtras = obtenerConfiguracionExtrasBloque();
  if (!Array.isArray(configExtras.distribucion) || !configExtras.distribucion.length) {
    errores.push("La configuración de horas extra por bloque no es válida.");
  }

  const modo = document.getElementById("modoAcumulacionInterno").value;
  const fest = obtenerFestivos();
  errores.push(...fest.errores);

  const leidos = leerTurnos();
  errores.push(...leidos.errores);

  if (errores.length) {
    mostrarErrores(errores);
    return;
  }

  const factores = obtenerFactores();
  const segmentos = [];
  const ventanasExtras = construirVentanasExtrasPorBloque(leidos.rows, configExtras);

  const legalChangeDate = new Date(fechaCambio.getFullYear(), fechaCambio.getMonth(), fechaCambio.getDate(), 0, 0, 0, 0);

  for (const row of leidos.rows) {
    if (row.tipo === "descanso") continue;

    let cursor = new Date(row.inicio.getTime());
    const finTurno = new Date(row.fin.getTime());
    const ventanasTurno = ventanasExtras.get(row) || [];

    while (cursor < finTurno) {
      const posibles = [
        finTurno,
        siguienteMedianoche(cursor),
        siguienteHoraDelDia(cursor, inicioNoct),
        siguienteHoraDelDia(cursor, finNoct),
      ];

      if (cursor < legalChangeDate && legalChangeDate < finTurno) {
        posibles.push(legalChangeDate);
      }

      for (const ventana of ventanasTurno) {
        if (ventana.inicio > cursor && ventana.inicio < finTurno) posibles.push(ventana.inicio);
        if (ventana.fin > cursor && ventana.fin < finTurno) posibles.push(ventana.fin);
      }

      let siguiente = posibles
        .filter(x => x > cursor)
        .sort((a, b) => a - b)[0];

      if (!siguiente || siguiente <= cursor) {
        siguiente = new Date(cursor.getTime() + MS_HORA);
        if (siguiente > finTurno) siguiente = finTurno;
      }

      const horas = (siguiente - cursor) / MS_HORA;
      const extra = estaEnVentanaExtra(cursor, ventanasTurno);
      const nocturna = esNocturna(cursor, inicioNoct, finNoct);
      const festivo = esFestivoODomingo(cursor, fest.set);
      const concepto = clasificarSegmento({extra, nocturna, festivo});

      if (concepto) {
        segmentos.push({
          concepto,
          horas,
          inicio: new Date(cursor.getTime()),
          fin: new Date(siguiente.getTime()),
          proyecto,
          descripcion,
          valor: horas * valorHora * (factores[concepto] ?? 0)
        });
      }

      cursor = siguiente;
    }
  }

  const agrupados = agruparSegmentos(segmentos, valorHora, factores);
  resultadoActual = agrupados;
  pintarResultado(agrupados);
  pintarResumen(agrupados);
  pintarFormatoRecargos(agrupados);
  mostrarOk(agrupados.length
    ? `Cálculo finalizado. Registros generados: ${agrupados.length}.`
    : "Cálculo finalizado. Los turnos seleccionados no generan recargos ni horas extra.");
  cambiarVista("resultado");
}

function agruparSegmentos(segmentos, valorHora, factores){
  const out = [];
  for (const seg of segmentos) {
    const last = out[out.length - 1];
    const puedeAgrupar =
      last &&
      last.concepto === seg.concepto &&
      last.proyecto === seg.proyecto &&
      last.descripcion === seg.descripcion &&
      last.fin.getTime() === seg.inicio.getTime();

    if (puedeAgrupar) {
      last.horas += seg.horas;
      last.fin = new Date(seg.fin.getTime());
      last.valor += seg.valor;
    } else {
      out.push({...seg});
    }
  }
  return out;
}

function pintarResultado(rows){
  const tbody = document.querySelector("#tablaResultado tbody");
  tbody.innerHTML = "";

  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="concept-pill">${escapeHtml(r.concepto)}</span></td>
      <td class="number">${formatoHoras(r.horas)}</td>
      <td>${formatoFechaHora(r.inicio)}</td>
      <td>${formatoFechaHora(r.fin)}</td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById("contadorResultado").textContent = `${rows.length} registros | ${formatoHoras(totalHorasResultado(rows))} horas`;
}
