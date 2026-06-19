# Plan de hoy

Planificador diario simple: tres bloques (mañana, tarde, noche), una guía visual del
día como un arco de luz que avanza con la hora actual, y persistencia local de tareas.

## Cómo usarlo en VS Code

1. Descomprimí o abrí esta carpeta en VS Code (`Archivo > Abrir carpeta...`).
2. Instalá la extensión **Live Server** (de Ritwick Dey) si no la tenés.
3. Click derecho sobre `index.html` → **Open with Live Server**.
   (También funciona sin extensión: abrí `index.html` directamente en el navegador.)

## Archivos

- `index.html` — estructura de la página
- `style.css` — diseño, colores y modo oscuro automático
- `script.js` — lógica: agregar/completar/borrar tareas, fecha y posición del arco

## Notas

- Las tareas se guardan en el `localStorage` del navegador, así que persisten entre
  sesiones en esa misma máquina/navegador (no se sincronizan entre dispositivos).
- El indicador del arco se actualiza solo cada minuto si dejás la página abierta.
