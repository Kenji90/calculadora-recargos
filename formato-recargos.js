function formatoFechaFormatoRecargos(d){
  const meses = ["ene.","feb.","mar.","abr.","may.","jun.","jul.","ago.","sep.","oct.","nov.","dic."];
  return `${d.getDate()}-${meses[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

function formatoHoraTabla(hora){
  if (!hora) return "";
  return `${pad2(hora.hh)}:${pad2(hora.mm)}`;
}

function grupoAmPm(hora){
  if (!hora) return "";
  return hora.hh < 12 ? "AM" : "PM";
}

function celdasVaciasFormato(){
  return {
    joDesdeAM:"", joDesdePM:"", joHastaAM:"", joHastaPM:""
  };
}

function celdasJornadaOrdinaria(turnoTxt){
  const out = celdasVaciasFormato();
  const turno = parsearTurno(turnoTxt);
  if (turno.tipo !== "turno") return out;

  const desdeGrupo = grupoAmPm(turno.inicio);
  const hastaGrupo = grupoAmPm(turno.fin);

  out[`joDesde${desdeGrupo}`] = formatoHoraTabla(turno.inicio);
  out[`joHasta${hastaGrupo}`] = formatoHoraTabla(turno.fin);
  return out;
}

function datosBaseFormatoRecargos(festivosSet){
  const mapa = new Map();

  document.querySelectorAll("#tablaCalendario tbody tr").forEach(tr => {
    const fechaTxt = tr.children[2]?.textContent.trim() || "";
    const fecha = parsearFecha(fechaTxt);
    if (!fecha) return;

    const key = fechaKey(fecha);
    const turno = tr.querySelector(".turno-dia")?.value || "";
    const festivoMarcado = Boolean(tr.querySelector(".festivo-dia")?.checked);
    const item = {
      fecha,
      turno,
      festivo: festivoMarcado || fecha.getDay() === 0 || Boolean(festivosSet?.has(key)),
      total: 0,
      ...celdasJornadaOrdinaria(turno)
    };
    FORMATO_RECARGOS_COLUMNAS.forEach(c => item[c.key] = 0);
    mapa.set(key, item);
  });

  return mapa;
}

function sumarSegmentoFormato(mapa, segmento, festivosSet){
  const columna = FORMATO_RECARGOS_COLUMNAS.find(c => c.concepto === segmento.concepto);
  if (!columna) return;

  let cursor = new Date(segmento.inicio.getTime());
  const fin = new Date(segmento.fin.getTime());

  while (cursor < fin) {
    const corte = siguienteMedianoche(cursor);
    const hasta = corte < fin ? corte : fin;
    const horas = (hasta - cursor) / MS_HORA;
    const fecha = soloFecha(cursor);
    const key = fechaKey(fecha);

    if (!mapa.has(key)) {
      const item = {
        fecha,
        turno: "",
        festivo: fecha.getDay() === 0 || Boolean(festivosSet?.has(key)),
        total: 0,
        ...celdasVaciasFormato()
      };
      FORMATO_RECARGOS_COLUMNAS.forEach(c => item[c.key] = 0);
      mapa.set(key, item);
    }

    const item = mapa.get(key);
    item[columna.key] += horas;
    item.total += horas;
    cursor = hasta;
  }
}

function valorFormatoCelda(valor){
  const n = Number(valor) || 0;
  return n > 0 ? formatoHoras(n) : "";
}

function pintarFormatoRecargos(rows){
  const tbody = document.querySelector("#tablaFormatoRecargos tbody");
  if (!tbody) return;

  const fest = obtenerFestivos();
  const mapa = datosBaseFormatoRecargos(fest.set);
  rows.forEach(r => sumarSegmentoFormato(mapa, r, fest.set));

  const datos = Array.from(mapa.values())
    .filter(item => (Number(item.total) || 0) > 0)
    .sort((a,b) => a.fecha - b.fecha);
  const totales = {};
  FORMATO_RECARGOS_COLUMNAS.forEach(c => totales[c.key] = 0);

  tbody.innerHTML = "";

  if (!datos.length) {
    tbody.innerHTML = `<tr><td colspan="12" class="empty-state">No hay recargos ni horas extra para mostrar</td></tr>`;
  } else {
    datos.forEach(item => {
      FORMATO_RECARGOS_COLUMNAS.forEach(c => totales[c.key] += item[c.key]);

      const tr = document.createElement("tr");
      if (item.festivo) tr.classList.add("formato-festivo");
      tr.innerHTML = `
        <td class="formato-fecha">${formatoFechaFormatoRecargos(item.fecha)}</td>
        <td>${escapeHtml(item.joDesdeAM)}</td>
        <td>${escapeHtml(item.joDesdePM)}</td>
        <td>${escapeHtml(item.joHastaAM)}</td>
        <td>${escapeHtml(item.joHastaPM)}</td>
        <td class="number concepto-recargo">${valorFormatoCelda(item.RN)}</td>
        <td class="number concepto-recargo">${valorFormatoCelda(item.RNF)}</td>
        <td class="number concepto-recargo">${valorFormatoCelda(item.RDF)}</td>
        <td class="number concepto-extra">${valorFormatoCelda(item.HED)}</td>
        <td class="number concepto-extra">${valorFormatoCelda(item.HEDF)}</td>
        <td class="number concepto-extra">${valorFormatoCelda(item.HEN)}</td>
        <td class="number concepto-extra">${valorFormatoCelda(item.HENF)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  FORMATO_RECARGOS_COLUMNAS.forEach(c => {
    const celda = document.getElementById(`totalFormato${c.key}`);
    if (celda) celda.textContent = valorFormatoCelda(totales[c.key]);
  });

  const totalHoras = FORMATO_RECARGOS_COLUMNAS.reduce((acc, c) => acc + (Number(totales[c.key]) || 0), 0);
  const contador = document.getElementById("contadorFormatoRecargos");
  if (contador) contador.textContent = `${datos.length} fechas | ${formatoHoras(totalHoras)} horas`;
}
