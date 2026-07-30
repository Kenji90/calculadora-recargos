# Calculadora de recargos - plantilla exacta y preservación de turnos

Cambios aplicados:
- El botón "Descargar plantilla Excel" ahora descarga el mismo formato del archivo que envió el usuario:
  Columna A = Fecha
  Columna B = Horario
  Sin encabezados obligatorios.
- El archivo descargado se llama Libro2.xlsx.
- Al cambiar el rango Desde/Hasta y dar clic en "Generar lista", ya no se pierden los turnos que ya estaban digitados.
- La herramienta conserva los valores por fecha:
  - Horario seleccionado
  - Marcación de festivo
- Si amplía el rango hacia días anteriores o posteriores, solo se agregan los nuevos días.
- Si reduce el rango, solo se muestran los días dentro del nuevo rango.
- Se conserva:
  - Tabla diaria de ingreso de turnos.
  - Selector de fechas tipo calendario para Desde y Hasta.
  - Importación de Excel/CSV/TXT.
  - Modo oscuro.
  - Resumen simple.
  - Auxilio de transporte automático.
  - Normativa julio 2026.
