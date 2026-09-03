# 🧮 Calculadora de Recargos Colombia

![HTML](https://img.shields.io/badge/HTML-5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=111)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?logo=github&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20uso-2563EB)

Aplicación web para calcular **recargos laborales, horas extra y resumen estimado de nómina** en Colombia, a partir de turnos diarios ingresados manualmente o cargados desde Excel.

🔗 **Demo:** https://kenji90.github.io/calculadora-recargos/

---

## 📌 ¿Para qué sirve?

Sirve como herramienta de apoyo para revisar turnos laborales y estimar valores asociados a:

- 🌙 recargos nocturnos
- 📅 recargos dominicales o festivos
- ⏱️ horas extra diurnas y nocturnas
- 💰 auxilio de transporte, cuando aplica
- 🧾 descuentos de salud y pensión
- 📊 formato mensual de recargos

La herramienta ayuda a validar la información antes de compararla con una liquidación formal de nómina.

---

## 🛠️ ¿Cómo se hizo?

La calculadora fue desarrollada como una aplicación web estática usando tecnologías del navegador:

| Tecnología | Uso dentro del proyecto |
|---|---|
| **HTML5** | Estructura de vistas, formularios y tablas |
| **CSS3** | Diseño visual, modo claro/oscuro y componentes |
| **JavaScript Vanilla** | Lógica de cálculo, validaciones, importación de Excel y eventos |
| **GitHub Pages** | Publicación de la herramienta en la web |

No usa framework, backend ni base de datos. Todo se ejecuta directamente en el navegador.

---

## 🧩 Estructura del proyecto

```text
calculadora-recargos/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── utils.js
│   ├── turnos.js
│   ├── calculo.js
│   ├── formato-recargos.js
│   ├── excel.js
│   ├── resumen.js
│   └── ui.js
├── Libro2.xlsx
└── README.md
```

### Organización del código

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura principal de la aplicación |
| `css/styles.css` | Estilos, paleta, tablas, botones y modo claro/oscuro |
| `js/config.js` | Constantes, conceptos y parámetros base |
| `js/utils.js` | Funciones auxiliares de formato, fechas y moneda |
| `js/turnos.js` | Generación de lista diaria, horarios y estilos de turno |
| `js/calculo.js` | Cálculo de recargos y horas extra |
| `js/formato-recargos.js` | Tabla mensual de Formato Recargos |
| `js/excel.js` | Importación de Excel y descarga de plantilla |
| `js/resumen.js` | Resumen estimado de nómina |
| `js/ui.js` | Vistas, botones, mensajes, tema y eventos |

---

## ⚙️ ¿Cómo funciona?

La aplicación permite trabajar de dos formas.

### 1. Ingreso manual

1. Ingresa el salario básico mensual.
2. Selecciona el rango de fechas.
3. Genera la lista de días.
4. Asigna el turno correspondiente.
5. Marca festivos si aplica.
6. Calcula la liquidación.
7. Revisa el resumen, el detalle y el formato mensual.

### 2. Carga desde Excel

También se puede importar una plantilla simple:

```text
Fecha | Horario
```

Códigos reconocidos:

| Código | Turno |
|---|---|
| `M` | 06:00 - 14:00 |
| `T` | 14:00 - 22:00 |
| `N` | 22:00 - 06:00 |
| `4H` | 4H 06:00 - 10:00 |
| `12HD` | 12H 06:00 - 18:00 |
| `12HT` | 12H 10:00 - 22:00 |
| `12HN` | 12H 18:00 - 06:00 |
| `DESCANSO` | Día sin turno trabajado |

Después de importar, la herramienta carga los turnos y ejecuta el cálculo.

---

## 📊 Vistas disponibles

| Vista | Descripción |
|---|---|
| **Turnos** | Ingreso manual, rango de fechas y carga de Excel |
| **Resumen** | Pago estimado, descuentos y neto |
| **Resultado** | Detalle de conceptos calculados |
| **Formato Recargos** | Tabla mensual con jornada ordinaria y liquidación de horas |
| **Configuración** | Parámetros internos de cálculo |

---

## 🧮 Reglas principales

La jornada nocturna está configurada de:

```text
19:00 a 06:00
```

Las horas extra se calculan por bloque de turnos trabajados:

```text
DESCANSO reinicia el bloque.
En bloques de 6 turnos, las extras se reparten entre el turno 5 y el turno 6.
La configuración permite elegir 4 horas extra: 2 + 2, o 6 horas extra: 3 + 3.
```

Los cambios en Configuración se aplican al volver a calcular.

---

### Configuración de horas extra por bloque

La vista **Configuración** permite cambiar la forma en que se distribuyen las horas extra dentro de cada bloque de 6 turnos trabajados:

| Opción | Aplicación |
|---|---|
| 4 h | Últimas 2 horas del turno 5 y últimas 2 horas del turno 6 |
| 6 h tipo 3+3 | Últimas 3 horas del turno 5 y últimas 3 horas del turno 6 |
| 6 h tipo 2+2+2 | Últimas 2 horas del turno 4, turno 5 y turno 6 |

El botón **Guardar configuración y recalcular** guarda la configuración en el navegador y vuelve a calcular la información cargada.

## 🔐 Privacidad

La información se procesa localmente en el navegador:

- no usa base de datos
- no requiere inicio de sesión
- no envía salario ni turnos a servidores externos
- el Excel se procesa directamente en el equipo del usuario

---

## ⚠️ Nota

Esta herramienta sirve como apoyo para validación y estimación. La liquidación oficial debe ser revisada por el área responsable de nómina conforme a la normatividad laboral vigente.

