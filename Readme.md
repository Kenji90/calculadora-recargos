# 🧮 Calculadora de Recargos Colombia

![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-black)
![Estado](https://img.shields.io/badge/Estado-En%20uso-brightgreen)

Aplicación web para calcular **recargos laborales, horas extra, auxilio de transporte y descuentos de nómina** con base en turnos diarios.

La herramienta está diseñada para funcionar directamente desde el navegador, sin instalar programas, sin base de datos y sin enviar información a servidores externos.

---

## 🔗 Demo

👉 [Abrir calculadora](https://kenji90.github.io/calculadora-recargos/)

---

## 📌 ¿Para qué sirve?

Esta calculadora permite validar de forma rápida el pago estimado asociado a turnos laborales, especialmente cuando existen:

- Turnos diurnos.
- Turnos nocturnos.
- Trabajo en domingos o festivos.
- Horas extra.
- Descansos entre bloques de trabajo.
- Importación de turnos desde Excel.

Está pensada como una herramienta de apoyo para revisar recargos y estimaciones de pago de una manera más clara, ordenada y visual.

---

## ⚙️ ¿Qué hace la herramienta?

La aplicación permite:

| Funcionalidad | Descripción |
|---|---|
| Ingreso de salario | Calcula automáticamente el valor de la hora. |
| Rango de fechas | Permite seleccionar desde y hasta con calendario. |
| Lista diaria de turnos | Genera una fila por cada día del rango seleccionado. |
| Selección de horario | Permite escoger el turno trabajado o descanso. |
| Marcación de festivos | Los domingos se marcan automáticamente y los festivos pueden editarse. |
| Importación de Excel | Permite cargar una plantilla con fechas y turnos. |
| Conservación de datos | Si se cambia el rango de fechas, conserva lo ya digitado. |
| Resumen de pago | Muestra salario, auxilio de transporte, recargos, descuentos y neto estimado. |
| Exportación | Permite copiar o exportar los resultados calculados. |

---

## 🕒 Horarios configurados

La herramienta maneja los siguientes horarios:

| Horario | Descripción |
|---|---|
| `DESCANSO` | Día sin turno trabajado |
| `06:00 - 14:00` | Turno mañana |
| `14:00 - 22:00` | Turno tarde |
| `22:00 - 06:00` | Turno noche |
| `4H 06:00 - 10:00` | Turno corto de 4 horas |
| `12H 10:00 - 22:00` | Turno de 12 horas día/tarde |
| `12H 06:00 - 18:00` | Turno de 12 horas diurno |
| `12H 18:00 - 06:00` | Turno de 12 horas nocturno |

---

## 📥 Importación desde Excel

La plantilla de importación usa un formato simple:

| Columna A | Columna B |
|---|---|
| Fecha | Horario |

Ejemplo:

| Fecha | Horario |
|---|---|
| 01/07/2026 | M |
| 02/07/2026 | DESCANSO |
| 03/07/2026 | 12HN |

No es obligatorio que el archivo tenga encabezados.

---

## 🔤 Códigos reconocidos en la plantilla

| Código | Equivalencia |
|---|---|
| `M` | 06:00 - 14:00 |
| `T` | 14:00 - 22:00 |
| `N` | 22:00 - 06:00 |
| `DESCANSO` | Día de descanso |
| `12HN` | 12H 18:00 - 06:00 |
| `12HD` | 12H 06:00 - 18:00 |
| `12HT` | 12H 10:00 - 22:00 |
| `4H` | 4H 06:00 - 10:00 |

---

## 🧾 Conceptos que calcula

La calculadora identifica y calcula los siguientes conceptos:

| Concepto | Descripción |
|---|---|
| Recargo nocturno | Horas ordinarias trabajadas en jornada nocturna. |
| Recargo diurno dominical/festivo | Horas diurnas ordinarias en domingo o festivo. |
| Recargo nocturno dominical/festivo | Horas nocturnas ordinarias en domingo o festivo. |
| Hora extra diurna | Horas extra en jornada diurna. |
| Hora extra nocturna | Horas extra en jornada nocturna. |
| Hora extra diurna dominical/festiva | Horas extra diurnas en domingo o festivo. |
| Hora extra nocturna dominical/festiva | Horas extra nocturnas en domingo o festivo. |

---

## 📊 Porcentajes aplicados

| Concepto | Porcentaje / Factor |
|---|---:|
| Recargo nocturno ordinario | 35% |
| Recargo diurno dominical/festivo | 90% |
| Recargo nocturno dominical/festivo | 125% |
| Hora extra diurna | 125% |
| Hora extra nocturna | 175% |
| Hora extra diurna dominical/festiva | 215% |
| Hora extra nocturna dominical/festiva | 265% |

---

## 🧠 Reglas principales

### Jornada nocturna

La jornada nocturna está parametrizada de:

```text
19:00 a 06:00
```

### Horas extra

La herramienta aplica la siguiente regla de acumulación:

| Fecha | Regla |
|---|---|
| Antes del 15/07/2026 | Las horas extra empiezan después de 44 horas acumuladas. |
| Desde el 15/07/2026 | Las horas extra empiezan después de 42 horas acumuladas. |

### Descansos

Cuando un día se marca como `DESCANSO`, el acumulado de horas se reinicia.

Esto permite separar correctamente los bloques de trabajo.

---

## 💰 Resumen de nómina estimado

El resumen calcula:

- Sueldo ordinario.
- Auxilio de transporte, si aplica.
- Total de recargos y horas extra.
- Descuento obligatorio de salud.
- Descuento obligatorio de pensión.
- Total pago.
- Total descuentos.
- Neto estimado.

La fórmula general usada es:

```text
Total pago = Salario + Auxilio de transporte + Recargos / horas extra
```

```text
Base salud y pensión = Salario + Recargos / horas extra
```

```text
Neto estimado = Total pago - Salud - Pensión
```

El auxilio de transporte se suma al pago final, pero no se incluye en la base de salud y pensión.

---

## 🎨 Colores de la interfaz

La herramienta usa colores para facilitar la lectura:

| Color | Significado |
|---|---|
| Gris | Descanso |
| Verde | Turnos de mañana |
| Azul | Turnos de tarde |
| Naranja | Turnos nocturnos |
| Resaltado especial | Domingos y festivos |

También incluye **modo oscuro**.

---

## 🚀 ¿Cómo usarla?

### Opción 1: uso manual

1. Ingresa el salario básico mensual.
2. Selecciona la fecha inicial y final.
3. Haz clic en **Generar lista**.
4. Selecciona el horario de cada día.
5. Marca festivos si corresponde.
6. Haz clic en **Calcular**.
7. Revisa el resumen y el detalle generado.

### Opción 2: importando Excel

1. Haz clic en **Descargar plantilla Excel**.
2. Llena la columna A con las fechas.
3. Llena la columna B con los códigos de turno.
4. Importa el archivo en la herramienta.
5. La calculadora completará la tabla y ejecutará el cálculo.

---

## 📁 Estructura del proyecto

```text
calculadora-recargos/
├── index.html
├── Libro2.xlsx
└── README.md
```

---

## 🛠️ Tecnologías usadas

- HTML5
- CSS3
- JavaScript
- GitHub Pages

---

## 🔐 Privacidad

La herramienta funciona de forma local en el navegador.

Esto significa que:

- No guarda información en una base de datos.
- No envía el salario ni los turnos a servidores externos.
- El archivo Excel se procesa directamente en el navegador.
- Los datos permanecen en el equipo del usuario mientras usa la página.

---

## ⚠️ Nota importante

Esta herramienta es una calculadora de apoyo para validación y estimación.  
Aunque fue parametrizada con reglas y porcentajes definidos para el proyecto, la liquidación final debe validarse con el área responsable de nómina y con la normatividad laboral vigente aplicable.

---

## 👤 Autor

Proyecto desarrollado para facilitar la validación de turnos, recargos y horas extra en Colombia.

