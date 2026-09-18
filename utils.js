function normalizarTexto(txt){
  return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function numeroDesdeTexto(valor){
  if (valor === null || valor === undefined) return 0;

  let s = String(valor)
    .trim()
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/[^0-9,.-]/g, "");

  if (!s) return 0;

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    const puntos = (s.match(/\./g) || []).length;
    if (puntos > 1 || /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, "");
    }
  }

  return Number(s) || 0;
}

function obtenerValorHora(){
  const salario = numeroDesdeTexto(document.getElementById("salario").value);
  const divisor = 220;
  return salario / divisor;
}

function actualizarValorHoraVista(){
  const salario = numeroDesdeTexto(document.getElementById("salario")?.value || "");
  const vh = salario ? salario / 220 : 0;
  const texto = salario && isFinite(vh) ? formatoMoneda(vh, true) : "";
  const el = document.getElementById("valorHoraTexto");
  if (el) el.textContent = texto ? `Valor hora: ${texto}` : "Valor hora: —";
  const input = document.getElementById("valorHoraVista");
  if (input) input.value = texto;
}

function formatoMoneda(valor, decimales=false){
  const n = Number(valor) || 0;
  if (decimales) {
    return "$" + n.toLocaleString("es-CO", {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  return "$" + Math.round(n).toLocaleString("es-CO");
}

function formatearSalarioInput(){
  const input = document.getElementById("salario");
  if (!input) return;
  const n = numeroDesdeTexto(input.value);
  input.value = n ? formatoMoneda(n, false) : "";
}

function formatoHoras(h){
  return (Math.round((Number(h) || 0) * 100) / 100).toFixed(2).replace(".", ",");
}

function pad2(n){ return String(n).padStart(2, "0"); }

function formatoFechaHora(d){
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fechaKey(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function soloFecha(d){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function crearFechaConHora(base, hh, mm){
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
}

function parsearFecha(texto){
  if (texto instanceof Date) return soloFecha(texto);
  const raw = normalizarTexto(texto).toLowerCase();
  if (!raw) return null;

  // Formato nativo de input type=date: yyyy-mm-dd
  let m = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const yy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(yy, mm - 1, dd);
    if (d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd) return d;
    return null;
  }

  // Serial de Excel, por ejemplo 46204.
  if (/^\d{4,6}(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    const base = new Date(Date.UTC(1899, 11, 30));
    const dUtc = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000);
    const d = new Date(dUtc.getUTCFullYear(), dUtc.getUTCMonth(), dUtc.getUTCDate());
    if (!isNaN(d)) return d;
  }

  const meses = {
    "ene":1,"enero":1,
    "feb":2,"febrero":2,
    "mar":3,"marzo":3,
    "abr":4,"abril":4,
    "may":5,"mayo":5,
    "jun":6,"junio":6,
    "jul":7,"julio":7,
    "ago":8,"agosto":8,
    "sep":9,"sept":9,"septiembre":9,
    "oct":10,"octubre":10,
    "nov":11,"noviembre":11,
    "dic":12,"diciembre":12
  };

  m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    let dd = Number(m[1]);
    let mm = Number(m[2]);
    let yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    const d = new Date(yy, mm - 1, dd);
    if (d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd) return d;
    return null;
  }

  m = raw.match(/^(\d{1,2})[\/\-\. ]([a-z]+)[\/\-\. ](\d{2,4})$/);
  if (m) {
    let dd = Number(m[1]);
    let mm = meses[m[2]];
    let yy = Number(m[3]);
    if (!mm) return null;
    if (yy < 100) yy += 2000;
    const d = new Date(yy, mm - 1, dd);
    if (d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd) return d;
    return null;
  }

  return null;
}
