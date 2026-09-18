function auxilioTransporteAplicable(salario){
  const aux = numeroDesdeTexto(document.getElementById("auxTransporte")?.value || 0);
  const smlmv = numeroDesdeTexto(document.getElementById("smlmvVigente")?.value || 0);
  if (!aux || !smlmv || !salario) return 0;
  return salario <= (2 * smlmv) ? aux : 0;
}

function totalHorasResultado(rows){
  return rows.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
}

function formatoCantidadNomina(valor, tipo="horas"){
  const n = Number(valor) || 0;
  if (tipo === "dias") {
    return Number.isInteger(n) ? String(n) : formatoHoras(n);
  }
  return formatoHoras(n);
}

function agregarFilaResumen(tbody, concepto, cant, pago, descuento, clase=""){
  const tr = document.createElement("tr");
  if (clase) tr.className = clase;
  tr.innerHTML = `
    <td>${escapeHtml(concepto)}</td>
    <td class="number">${cant ?? ""}</td>
    <td class="number">${pago ? formatoMoneda(pago) : ""}</td>
    <td class="number">${descuento ? formatoMoneda(descuento) : ""}</td>
  `;
  tbody.appendChild(tr);
}

function pintarResumen(rows){
  const resumen = new Map();
  let totalRecargos = 0;

  for (const r of rows) {
    if (!resumen.has(r.concepto)) resumen.set(r.concepto, {horas:0, valor:0});
    resumen.get(r.concepto).horas += r.horas;
    resumen.get(r.concepto).valor += r.valor;
    totalRecargos += r.valor;
  }

  const salario = numeroDesdeTexto(document.getElementById("salario")?.value || 0);
  const auxTransporte = auxilioTransporteAplicable(salario);
  const diasPago = numeroDesdeTexto(document.getElementById("diasPago")?.value || 30) || 30;
  const porcSalud = numeroDesdeTexto(document.getElementById("porcSalud")?.value || 0) / 100;
  const porcPension = numeroDesdeTexto(document.getElementById("porcPension")?.value || 0) / 100;

  const baseDeduccion = salario + totalRecargos;
  const descuentoPension = baseDeduccion * porcPension;
  const descuentoSalud = baseDeduccion * porcSalud;
  const totalPago = salario + auxTransporte + totalRecargos;
  const totalDescuento = descuentoPension + descuentoSalud;
  const neto = totalPago - totalDescuento;

  const tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";

  [...resumen.entries()].forEach(([concepto, item]) => {
    agregarFilaResumen(tbody, concepto, formatoCantidadNomina(item.horas), item.valor, 0);
  });

  agregarFilaResumen(tbody, auxTransporte > 0 ? "AUXILIO DE TRANSPORTE" : "AUXILIO DE TRANSPORTE (NO APLICA)", formatoCantidadNomina(diasPago, "dias"), auxTransporte, 0, "nomina-base");
  agregarFilaResumen(tbody, "SUELDO ORDINARIO", formatoCantidadNomina(diasPago, "dias"), salario, 0, "nomina-base nomina-subtotal");
  agregarFilaResumen(tbody, "OBLIGATORIO PENSION", "", 0, descuentoPension, "nomina-descuento");
  agregarFilaResumen(tbody, "OBLIGATORIO SALUD", "", 0, descuentoSalud, "nomina-descuento");

  document.getElementById("totalPagoResumen").textContent = formatoMoneda(totalPago);
  document.getElementById("totalDescuentoResumen").textContent = formatoMoneda(totalDescuento);
  document.getElementById("netoResumen").textContent = formatoMoneda(neto);

  const cardTotalPago = document.getElementById("cardTotalPago");
  const cardRecargos = document.getElementById("cardRecargos");
  const cardDescuentos = document.getElementById("cardDescuentos");
  const cardNeto = document.getElementById("cardNeto");
  if (cardTotalPago) cardTotalPago.textContent = formatoMoneda(totalPago);
  if (cardRecargos) cardRecargos.textContent = formatoMoneda(totalRecargos);
  if (cardDescuentos) cardDescuentos.textContent = formatoMoneda(totalDescuento);
  if (cardNeto) cardNeto.textContent = formatoMoneda(neto);
}
