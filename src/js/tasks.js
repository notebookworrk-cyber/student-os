import { getState, save, getToday, SICO } from './state.js';
import { toast, validateApiKey, esc, hideModal } from './utils.js';

let curPri = 'high';
let curFilter = 'all';

export function initTasks() {
  renderTasks();
  setupPriorityButtons();
  setupFilterTabs();
}

function setupPriorityButtons() {
  document.querySelectorAll('#pri-row .p-opt').forEach(btn => {
    btn.addEventListener('click', () => selectPriority(btn.dataset.p));
  });
}

function setupFilterTabs() {
  document.querySelectorAll('#ftabs .ftab').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.f, btn));
  });
}

export function selectPriority(p) {
  curPri = p;
  document.querySelectorAll('#pri-row .p-opt').forEach(b => b.className = 'p-opt');
  const map = { high: 's-h', medium: 's-m', low: 's-l' };
  const btn = document.querySelector(`#pri-row [data-p="${p}"]`);
  if (btn) btn.className = 'p-opt ' + map[p];
}

export function setFilter(f, btn) {
  curFilter = f;
  document.querySelectorAll('#ftabs .ftab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderTasks();
}

export function addTask() {
  const nameEl = document.getElementById('t-name');
  const subEl = document.getElementById('t-sub');
  const timeEl = document.getElementById('t-time');

  const name = nameEl.value.trim();
  if (!name) {
    nameEl.style.borderColor = 'var(--red)';
    setTimeout(() => { nameEl.style.borderColor = ''; }, 1500);
    return;
  }

  const { tasks } = getState();
  const pinnedCount = tasks.filter(t => t.pinned && !t.done).length;

  const task = {
    id: Date.now(),
    name,
    sub: subEl.value,
    pri: curPri,
    time: timeEl.value.trim() || '—',
    done: false,
    doneDate: null,
    pinned: pinnedCount < 3
  };

  getState().tasks.unshift(task);
  save();

  nameEl.value = '';
  timeEl.value = '';
  selectPriority('high');

  hideModal('task-modal');
  renderTasks();
  toast('Mission added', `"${name}"`, 'green');
}

export function deleteTask(id) {
  const state = getState();
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  renderTasks();
}

export function toggleTask(id) {
  const state = getState();
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.done = !task.done;
  task.doneDate = task.done ? getToday() : null;

  if (task.done) {
    state.totalTasksDone++;
    const el = document.querySelector(`[data-tid="${id}"] .t-check`);
    const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: 200 };
    import('./gamification.js').then(m => m.gainXP(10, rect.left + 10, rect.top));
    toast('Task done!', '+10 XP earned', 'green');
    import('./gamification.js').then(m => m.checkAchievements());
  } else {
    if (state.totalTasksDone > 0) state.totalTasksDone--;
  }

  save();
  renderTasks();
}

export function dailyReset() {
  if (!confirm('Reset all tasks to incomplete?')) return;
  const state = getState();
  state.tasks.forEach(t => {
    t.done = false;
    t.doneDate = null;
  });
  save();
  renderTasks();
  toast('Daily Reset', 'New day, new grind.', 'blue');
}

function filteredTasks() {
  const { tasks } = getState();
  return tasks.filter(t => {
    if (curFilter === 'active') return !t.done;
    if (curFilter === 'completed') return t.done;
    if (curFilter !== 'all') return t.sub === curFilter;
    return true;
  });
}

function taskHTML(task) {
  const pc = { high: 'pri-h', medium: 'pri-m', low: 'pri-l' }[task.pri] || 'pri-l';
  const pl = { high: '🔴 High', medium: '🟡 Med', low: '🟢 Low' }[task.pri] || '';

  return `
    <div class="task-item${task.done ? ' done' : ''}" data-tid="${task.id}">
      <button class="t-check" onclick="toggleTask(${task.id})">${task.done ? '✓' : ''}</button>
      <div class="t-body">
        <div class="t-name">${esc(task.name)}</div>
        <div class="t-meta">
          <span class="tag sub-${task.sub}">${SICO[task.sub] || '📦'} ${task.sub.charAt(0).toUpperCase() + task.sub.slice(1)}</span>
          <span class="tag ${pc}">${pl}</span>
          <span class="t-time">⏰ ${esc(task.time)}</span>
        </div>
      </div>
      <button class="t-del" onclick="delTask(${task.id})">🗑️</button>
    </div>
  `;
}

export function renderTasks() {
  const all = filteredTasks();
  const pinned = getState().tasks.filter(t => t.pinned && !t.done).slice(0, 3);

  const pEl = document.getElementById('pinned-list');
  const aEl = document.getElementById('all-list');

  if (!pEl || !aEl) return;

  pEl.innerHTML = pinned.length
    ? pinned.map(taskHTML).join('')
    : `<div class="empty"><div class="empty-icon">📌</div><p>No pinned missions yet.</p></div>`;

  aEl.innerHTML = all.length
    ? all.map(taskHTML).join('')
    : `<div class="empty"><div class="empty-icon">📭</div><p>No tasks. Add your first mission!</p></div>`;
}





window.toggleTask = toggleTask;
window.delTask = deleteTask;
window.dailyReset = dailyReset;