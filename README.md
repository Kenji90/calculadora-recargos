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

La herramienta ayuda a validar la información antes de enviarla o compararla con una liquidación formal de nómina.

---

## 🛠️ ¿Cómo se hizo?

La calculadora fue desarrollada como una aplicación web estática, usando tecnologías básicas del navegador:

| Tecnología | Uso dentro del proyecto |
|---|---|
| **HTML5** | Estructura de la aplicación y vistas principales |
| **CSS3** | Diseño visual, modo claro/oscuro, tablas y componentes |
| **JavaScript Vanilla** | Lógica de cálculo, manejo de turnos, importación de Excel y eventos |
| **GitHub Pages** | Publicación de la herramienta en la web |

No usa framework, backend, base de datos ni instalación adicional.

Todo el procesamiento se ejecuta directamente en el navegador del usuario.

---

## 🧩 Estructura del proyecto

```text
calculadora-recargos/
├── index.html      # Aplicación principal
├── Libro2.xlsx     # Plantilla base para importar turnos
└── README.md       # Documentación del proyecto
```

El archivo principal es `index.html`. Allí se encuentra:

```text
HTML        → vistas y formularios
CSS         → diseño, colores, responsive y modo claro/oscuro
JavaScript  → cálculo, validaciones, importación y resultados
```

---

## ⚙️ ¿Cómo funciona?

La aplicación permite calcular los recargos de dos formas.

### 1. Ingreso manual

El usuario:

1. Ingresa el salario básico mensual.
2. Selecciona fecha inicial y fecha final.
3. Genera la lista de días.
4. Asigna el turno correspondiente.
5. Marca festivos si aplica.
6. Ejecuta el cálculo.
7. Revisa el resumen, el detalle y el formato mensual.

### 2. Carga desde Excel

También se puede importar un archivo con estructura simple:

```text
Fecha | Horario
```

Ejemplo:

| Fecha | Horario |
|---|---|
| 01/09/2026 | M |
| 02/09/2026 | T |
| 03/09/2026 | N |
| 04/09/2026 | DESCANSO |

---

## 🕒 Turnos reconocidos

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

---

## 📊 Vistas de la aplicación

| Vista | Descripción |
|---|---|
| **Turnos** | Permite ingresar salario, rango de fechas, turnos y cargar Excel |
| **Resumen** | Muestra pago estimado, descuentos y neto |
| **Resultado** | Lista detallada de recargos y horas extra calculadas |
| **Formato Recargos** | Tabla mensual con jornada ordinaria y liquidación de horas |
| **Configuración** | Parámetros internos usados por la calculadora |

---

## 🧮 Reglas principales

La jornada nocturna está configurada de:

```text
19:00 a 06:00
```

Las horas extra se calculan por acumulado de bloque:

```text
Antes del 15/07/2026  → después de 44 horas acumuladas
Desde el 15/07/2026   → después de 42 horas acumuladas
```

Cuando un día se marca como `DESCANSO`, el acumulado de horas se reinicia.

---

## 🎨 Diseño

La interfaz tiene un diseño moderno con:

- 🌓 modo claro y modo oscuro
- 🎛️ componentes visuales tipo dashboard
- 📋 tablas organizadas por bloques
- 🔵 paleta sobria en grises y azul
- 📱 diseño adaptable para diferentes pantallas

El objetivo visual es que la herramienta sea clara, cómoda y fácil de revisar.

---

## 🔐 Privacidad

La calculadora funciona localmente en el navegador.

Esto significa que:

- no guarda información en bases de datos
- no envía salario ni turnos a servidores externos
- no requiere inicio de sesión
- el archivo Excel se procesa directamente en el navegador

---

## ⚠️ Nota

Esta herramienta sirve como apoyo para validación y estimación.  
La liquidación oficial debe ser revisada por el área responsable de nómina conforme a la normatividad laboral vigente.

---

## 👤 Autor

Proyecto desarrollado para facilitar la revisión de turnos, recargos y horas extra en Colombia.
