function normalizarClave(txt){
  return normalizarTexto(txt).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizarHorarioImportado(valor){
  const original = String(valor ?? "").trim();
  const t = normalizarTexto(original).toUpperCase();
  const clave = t.replace(/[^A-Z0-9]/g, "");

  if (!t) return "";
  if (clave === "D" || clave === "DESC" || clave === "DESCANSO" || t.includes("DESCANSO")) return "DESCANSO";
  if (clave === "M" || clave === "MANANA" || clave === "MAÑANA") return "06:00 - 14:00";
  if (clave === "T" || clave === "TARDE") return "14:00 - 22:00";
  if (clave === "N" || clave === "NOCHE") return "22:00 - 06:00";

  // Códigos de la plantilla simple del usuario.
  // 12HN = 12 horas nocturnas, equivalente a 18:00 - 06:00.
  if (["12HN","12HNOCHE","12HNOCTURNO","12HNOCTURNA","12N"].includes(clave)) return "12H 18:00 - 06:00";
  if (["12HD","12HDIA","12HDIURNO","12HDIURNA","12M"].includes(clave)) return "12H 06:00 - 18:00";
  if (["12HT","12HTARDE"].includes(clave)) return "12H 10:00 - 22:00";
  if (["4H","4HM","4HD","4HDIA","4HDIURNO"].includes(clave)) return "4H 06:00 - 10:00";

  const exacto = [
    "06:00 - 14:00",
    "14:00 - 22:00",
    "22:00 - 06:00",
    "4H 06:00 - 10:00",
    "12H 10:00 - 22:00",
    "12H 06:00 - 18:00",
    "12H 18:00 - 06:00"
  ].find(x => normalizarTexto(x).toUpperCase().replace(/[^A-Z0-9]/g, "") === clave);
  if (exacto) return exacto;

  const turno = parsearTurno(original);
  if (turno.tipo !== "turno") return original;

  const ini = `${pad2(turno.inicio.hh)}:${pad2(turno.inicio.mm)}`;
  const fin = `${pad2(turno.fin.hh)}:${pad2(turno.fin.mm)}`;
  const mapa = {
    "06:00-14:00": "06:00 - 14:00",
    "14:00-22:00": "14:00 - 22:00",
    "22:00-06:00": "22:00 - 06:00",
    "06:00-10:00": "4H 06:00 - 10:00",
    "10:00-22:00": "12H 10:00 - 22:00",
    "06:00-18:00": "12H 06:00 - 18:00",
    "18:00-06:00": "12H 18:00 - 06:00"
  };
  return mapa[`${ini}-${fin}`] || original;
}

function valorBooleano(valor){
  const s = normalizarClave(valor);
  return ["si","s","true","1","x","festivo","domingo","domfestivo","yes"].includes(s);
}

function detectarColumnasTurnos(rows){
  const maxCols = Math.max(...rows.map(r => r.length), 0);
  let headerIndex = rows.findIndex(r => {
    const claves = r.map(normalizarClave);
    return claves.some(c => c.includes("fecha")) && claves.some(c => c.includes("horario") || c.includes("turno"));
  });

  if (headerIndex >= 0) {
    const header = rows[headerIndex].map(normalizarClave);
    return {
      headerIndex,
      dataStart: headerIndex + 1,
      fechaIdx: header.findIndex(c => c.includes("fecha")),
      horarioIdx: header.findIndex(c => c.includes("horario") || c.includes("turno")),
      festivoIdx: header.findIndex(c => c.includes("festivo") || c.includes("domingo") || c.includes("dom")),
      diaIdx: header.findIndex(c => c === "dia" || c.includes("dia"))
    };
  }

  const dateScores = Array(maxCols).fill(0);
  const scheduleScores = Array(maxCols).fill(0);
  const festScores = Array(maxCols).fill(0);

  rows.slice(0, 15).forEach(r => {
    for (let i = 0; i < maxCols; i++) {
      const value = r[i];
      const s = String(value ?? "").trim();
      if (!s) continue;

      if (parsearFecha(s)) dateScores[i]++;

      const h = normalizarHorarioImportado(s);
      const turno = parsearTurno(h);
      if (!parsearFecha(s) && h && ["turno","descanso"].includes(turno.tipo)) scheduleScores[i]++;

      if (["si","no","s","n","x","true","false","1","0"].includes(normalizarClave(s))) festScores[i]++;
    }
  });

  const fechaIdx = dateScores.indexOf(Math.max(...dateScores));
  const horarioIdx = scheduleScores.indexOf(Math.max(...scheduleScores));
  const festivoIdx = Math.max(...festScores) > 0 ? festScores.indexOf(Math.max(...festScores)) : -1;

  return {headerIndex:-1, dataStart:0, fechaIdx, horarioIdx, festivoIdx, diaIdx:-1};
}

function matrizARegistrosTurnos(matriz){
  const rows = matriz
    .filter(r => Array.isArray(r))
    .map(r => r.map(c => String(c ?? "").trim()))
    .filter(r => r.some(c => c !== ""));

  if (!rows.length) return [];

  const cols = detectarColumnasTurnos(rows);

  if (cols.fechaIdx < 0 || cols.horarioIdx < 0 || cols.fechaIdx === cols.horarioIdx) {
    throw new Error("No pude detectar las columnas. Use el formato: columna A = Fecha y columna B = Horario.");
  }

  const registros = [];
  const errores = [];

  for (let i = cols.dataStart; i < rows.length; i++) {
    const r = rows[i];
    const fechaRaw = r[cols.fechaIdx];
    const horarioRaw = r[cols.horarioIdx];

    if (!fechaRaw && !horarioRaw) continue;

    const fecha = parsearFecha(fechaRaw);
    const horario = normalizarHorarioImportado(horarioRaw);
    const festivo = cols.festivoIdx >= 0 ? valorBooleano(r[cols.festivoIdx]) : false;

    if (!fecha) {
      errores.push(`Fila ${i + 1}: fecha no válida "${fechaRaw}".`);
      continue;
    }

    const turno = parsearTurno(horario);
    if (!horario || turno.tipo === "error" || turno.tipo === "vacio") {
      errores.push(`Fila ${i + 1}: horario no válido "${horarioRaw}".`);
      continue;
    }

    registros.push({fecha, fechaKey: fechaKey(fecha), horario, festivo});
  }

  if (!registros.length) {
    throw new Error(
      errores.length
        ? errores.slice(0, 6).join(" | ")
        : "El archivo no contiene registros válidos. Use el formato: columna A = Fecha y columna B = Horario."
    );
  }

  return {registros, errores};
}

function parseCsv(texto){
  const filas = [];
  let fila = [], campo = "", enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    const next = texto[i + 1];

    if (ch === '"' && enComillas && next === '"') {
      campo += '"';
      i++;
    } else if (ch === '"') {
      enComillas = !enComillas;
    } else if ((ch === ";" || ch === "," || ch === "\t") && !enComillas) {
      fila.push(campo.trim());
      campo = "";
    } else if ((ch === "\n" || ch === "\r") && !enComillas) {
      if (ch === "\r" && next === "\n") i++;
      fila.push(campo.trim());
      if (fila.some(x => x !== "")) filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += ch;
    }
  }

  fila.push(campo.trim());
  if (fila.some(x => x !== "")) filas.push(fila);
  return filas;
}

function readUInt16(bytes, offset){ return bytes[offset] | (bytes[offset + 1] << 8); }
function readUInt32(bytes, offset){ return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }

async function descomprimirZipEntry(entry){
  const data = entry.data;
  if (entry.method === 0) return data;
  if (entry.method !== 8) throw new Error(`Método ZIP no soportado: ${entry.method}.`);
  if (!("DecompressionStream" in window)) {
    throw new Error("Este navegador no soporta lectura local de XLSX. Use Chrome/Edge actualizado o cargue CSV.");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function leerEntradasZip(bytes){
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (readUInt32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Archivo XLSX no válido.");

  const centralOffset = readUInt32(bytes, eocd + 16);
  const total = readUInt16(bytes, eocd + 10);
  const entries = new Map();
  let offset = centralOffset;
  const decoder = new TextDecoder("utf-8");

  for (let i = 0; i < total; i++) {
    if (readUInt32(bytes, offset) !== 0x02014b50) break;
    const method = readUInt16(bytes, offset + 10);
    const compressedSize = readUInt32(bytes, offset + 20);
    const nameLen = readUInt16(bytes, offset + 28);
    const extraLen = readUInt16(bytes, offset + 30);
    const commentLen = readUInt16(bytes, offset + 32);
    const localOffset = readUInt32(bytes, offset + 42);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLen));

    const localNameLen = readUInt16(bytes, localOffset + 26);
    const localExtraLen = readUInt16(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const data = bytes.slice(dataStart, dataStart + compressedSize);

    entries.set(name, {name, method, data});
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

async function leerTextoZip(entries, name){
  const entry = entries.get(name);
  if (!entry) return "";
  const bytes = await descomprimirZipEntry(entry);
  return new TextDecoder("utf-8").decode(bytes);
}

function textoXmlNodo(node){
  if (!node) return "";
  return Array.from(node.getElementsByTagName("t")).map(x => x.textContent || "").join("");
}

function celdaRefACol(ref){
  const m = String(ref || "").match(/[A-Z]+/i);
  if (!m) return 0;
  return m[0].toUpperCase().split("").reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsx(arrayBuffer){
  const bytes = new Uint8Array(arrayBuffer);
  const entries = leerEntradasZip(bytes);

  let sheetPath = "xl/worksheets/sheet1.xml";
  const wbXml = await leerTextoZip(entries, "xl/workbook.xml");
  const relsXml = await leerTextoZip(entries, "xl/_rels/workbook.xml.rels");

  if (wbXml && relsXml) {
    const parser = new DOMParser();
    const wb = parser.parseFromString(wbXml, "application/xml");
    const firstSheet = wb.getElementsByTagName("sheet")[0];
    const rid = firstSheet?.getAttribute("r:id");
    if (rid) {
      const rels = parser.parseFromString(relsXml, "application/xml");
      const rel = Array.from(rels.getElementsByTagName("Relationship")).find(x => x.getAttribute("Id") === rid);
      const target = rel?.getAttribute("Target");
      if (target) sheetPath = "xl/" + target.replace(/^\/?xl\//, "");
    }
  }

  const sharedXml = await leerTextoZip(entries, "xl/sharedStrings.xml");
  const shared = [];
  if (sharedXml) {
    const doc = new DOMParser().parseFromString(sharedXml, "application/xml");
    Array.from(doc.getElementsByTagName("si")).forEach(si => shared.push(textoXmlNodo(si)));
  }

  const sheetXml = await leerTextoZip(entries, sheetPath);
  if (!sheetXml) throw new Error("No se encontró la primera hoja del Excel.");

  const doc = new DOMParser().parseFromString(sheetXml, "application/xml");
  const out = [];

  Array.from(doc.getElementsByTagName("row")).forEach(row => {
    const arr = [];
    Array.from(row.getElementsByTagName("c")).forEach(c => {
      const col = celdaRefACol(c.getAttribute("r"));
      const t = c.getAttribute("t");
      let value = "";
      if (t === "inlineStr") {
        value = textoXmlNodo(c);
      } else {
        const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
        value = t === "s" ? (shared[Number(v)] ?? "") : v;
      }
      arr[col] = value;
    });
    out.push(arr);
  });

  return out;
}

function formatoFechaInput(d){
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function aplicarRegistrosImportados(registros){
  if (!registros.length) throw new Error("El archivo no contiene registros válidos.");

  const fechas = registros.map(r => r.fecha).sort((a,b) => a - b);
  document.getElementById("fechaInicioTurno").value = formatoFechaInput(fechas[0]);
  document.getElementById("fechaFinTurno").value = formatoFechaInput(fechas[fechas.length - 1]);

  generarCalendario();

  // Si el archivo no trae todos los días, los faltantes quedan como DESCANSO para cerrar bloques.
  document.querySelectorAll("#tablaCalendario tbody tr .turno-dia").forEach(sel => {
    sel.value = "DESCANSO";
    actualizarEstiloFila(sel.closest("tr"));
  });

  let aplicados = 0;
  const noReconocidos = [];

  registros.forEach(r => {
    const fechaMostrar = `${pad2(r.fecha.getDate())}/${pad2(r.fecha.getMonth()+1)}/${r.fecha.getFullYear()}`;
    const fila = Array.from(document.querySelectorAll("#tablaCalendario tbody tr"))
      .find(tr => tr.children[2]?.textContent.trim() === fechaMostrar);
    if (!fila) return;

    const select = fila.querySelector(".turno-dia");
    const existe = Array.from(select.options).some(o => o.value === r.horario);
    if (!existe) {
      noReconocidos.push(`${fechaMostrar}: ${r.horario}`);
      return;
    }

    select.value = r.horario;

    const chk = fila.querySelector(".festivo-dia");
    if (chk && !chk.disabled && r.festivo) chk.checked = true;

    actualizarEstiloFila(fila);
    aplicados++;
  });

  if (noReconocidos.length) {
    throw new Error("Horarios no reconocidos: " + noReconocidos.slice(0, 8).join(" | "));
  }

  actualizarResumenPeriodo();
  return {aplicados};
}

async function importarArchivoTurnos(event){
  limpiarMensajes();
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    mostrarOk("Leyendo archivo...");
    let matriz;
    const nombre = file.name.toLowerCase();

    if (nombre.endsWith(".xlsx")) {
      matriz = await parseXlsx(await file.arrayBuffer());
    } else {
      matriz = parseCsv(await file.text());
    }

    const {registros, errores} = matrizARegistrosTurnos(matriz);
    const importacion = aplicarRegistrosImportados(registros);

    if (errores.length) {
      mostrarErrores(["Archivo importado con observaciones:", ...errores.slice(0, 8)]);
      return;
    }

    mostrarOk(`Archivo importado correctamente. Registros aplicados: ${importacion.aplicados}. Calculando...`);

    setTimeout(() => {
      calcular();
    }, 80);
  } catch (err) {
    mostrarErrores([`No se pudo importar el archivo: ${err.message || err}`]);
  } finally {
    event.target.value = "";
  }
}

function descargarPlantillaTurnos(){
  try {
    const binario = atob(PLANTILLA_TURNOS_XLSX_BASE64);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Libro2.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    mostrarOk("Plantilla Excel descargada.");
  } catch (err) {
    mostrarErrores(["No se pudo descargar la plantilla Excel."]);
  }
}
