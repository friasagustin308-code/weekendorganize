(function () {
  const STORAGE_KEY = 'daily-planner-tasks';

  const DEFAULT_TASKS = [
    { id: 1, text: 'Desayunar y planificar el día', time: 'manana', done: false },
    { id: 2, text: 'Revisar correos y mensajes pendientes', time: 'manana', done: false },
    { id: 3, text: 'Almorzar y descansar', time: 'tarde', done: false },
    { id: 4, text: 'Hacer ejercicio', time: 'tarde', done: false },
    { id: 5, text: 'Repasar el día y preparar mañana', time: 'noche', done: false }
  ];

  let tasks = loadTasks();
  let nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_TASKS.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_TASKS.slice();
    } catch (e) {
      return DEFAULT_TASKS.slice();
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // storage unavailable (e.g. private browsing) - state still works in-memory
    }
  }

  function checkIcon() {
    return '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function render() {
    const blocks = document.querySelectorAll('.block');
    blocks.forEach(function (block) {
      const time = block.getAttribute('data-time');
      const list = block.querySelector('[data-list]');
      const tally = block.querySelector('[data-tally]');
      const items = tasks.filter(function (t) { return t.time === time; });
      const done = items.filter(function (t) { return t.done; }).length;

      tally.textContent = done + '/' + items.length;
      list.innerHTML = '';

      if (items.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'block__empty';
        empty.textContent = 'Sin tareas todavía';
        list.appendChild(empty);
        return;
      }

      items.forEach(function (t) {
        const li = document.createElement('li');
        li.className = 'task';
        li.setAttribute('data-id', t.id);
        li.setAttribute('data-done', t.done ? 'true' : 'false');
        li.innerHTML =
          '<button class="task__check" role="checkbox" aria-checked="' + (t.done ? 'true' : 'false') + '" aria-label="Marcar como hecha: ' + escapeHtml(t.text) + '">' + (t.done ? checkIcon() : '') + '</button>' +
          '<span class="task__text">' + escapeHtml(t.text) + '</span>' +
          '<button class="task__delete" aria-label="Eliminar tarea: ' + escapeHtml(t.text) + '">&times;</button>';
        list.appendChild(li);
      });
    });

    updateProgress();
    updateNowBadge();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(function (t) { return t.done; }).length;
    document.getElementById('progress-count').textContent = done + ' de ' + total + ' hechas';
  }

  function toggleTask(id) {
    tasks = tasks.map(function (t) {
      return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
    });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
    render();
  }

  function addTask(time, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tasks.push({ id: nextId++, text: trimmed, time: time, done: false });
    saveTasks();
    render();
  }

  // Event delegation for check/delete clicks
  document.querySelectorAll('[data-list]').forEach(function (list) {
    list.addEventListener('click', function (e) {
      const li = e.target.closest('.task');
      if (!li) return;
      const id = Number(li.getAttribute('data-id'));
      if (e.target.closest('.task__check')) toggleTask(id);
      if (e.target.closest('.task__delete')) deleteTask(id);
    });
  });

  // Add-task forms
  document.querySelectorAll('[data-add-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const block = form.closest('.block');
      const time = block.getAttribute('data-time');
      const input = form.querySelector('.block__input');
      addTask(time, input.value);
      input.value = '';
      input.focus();
    });
  });

  // Clear completed
  document.getElementById('reset-btn').addEventListener('click', function () {
    tasks = tasks.filter(function (t) { return !t.done; });
    saveTasks();
    render();
  });

  // Date header
  function renderDate() {
    const fmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    let s = fmt.format(new Date());
    s = s.charAt(0).toUpperCase() + s.slice(1);
    document.getElementById('today-date').textContent = s;
  }

  // Day-arc marker: maps current time (6:00-24:00) onto the quadratic curve
  // M20,100 Q300,10 580,100 and tints it by morning/afternoon/evening.
  function pointOnArc(t) {
    const p0 = { x: 20, y: 100 };
    const p1 = { x: 300, y: 10 };
    const p2 = { x: 580, y: 100 };
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
  }

  function updateArc() {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const dayStart = 6, dayEnd = 24;
    const t = Math.max(0, Math.min(1, (hours - dayStart) / (dayEnd - dayStart)));
    const pos = pointOnArc(t);
    const marker = document.getElementById('arc-marker');
    marker.setAttribute('cx', pos.x.toFixed(1));
    marker.setAttribute('cy', pos.y.toFixed(1));
    marker.classList.remove('is-afternoon', 'is-evening');
    if (t >= 2 / 3) marker.classList.add('is-evening');
    else if (t >= 1 / 3) marker.classList.add('is-afternoon');
  }

  function currentSegment() {
    const hours = new Date().getHours();
    if (hours >= 19 || hours < 6) return 'noche';
    if (hours >= 12) return 'tarde';
    return 'manana';
  }

  function updateNowBadge() {
    const active = currentSegment();
    document.querySelectorAll('.block').forEach(function (block) {
      const badge = block.querySelector('[data-now-badge]');
      const isActive = block.getAttribute('data-time') === active;
      badge.hidden = !isActive;
    });
  }

  renderDate();
  updateArc();
  render();

  // Keep the date, arc and "now" badge fresh if the page stays open
  setInterval(function () {
    renderDate();
    updateArc();
    updateNowBadge();
  }, 60000);
})();
