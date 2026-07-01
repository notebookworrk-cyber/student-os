import { getState, save, RING_C } from './state.js';
import { toast, formatTime, floatXP } from './utils.js';
import { gainXP, checkAchievements } from './gamification.js';

let timerSec = 1500;
let timerTotal = 1500;
let timerMode = 'focus';
let timerRunning = false;
let timerTick = null;
let timerStartAt = 0;
let timerSecAtStart = 0;

export function initTimer() {
  const state = getState();
  timerSec = state.settings.dur * 60;
  timerTotal = timerSec;
  renderTimer();
  updateRing(1);
  setupModeButtons();
  renderDots();
  renderSessionHistory();
}

function setupModeButtons() {
  document.querySelectorAll('#mode-row .mt').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.m));
  });
}

export function setMode(mode) {
  if (timerRunning) return;
  timerMode = mode;
  const dur = mode === 'focus' ? getState().settings.dur : mode === 'short' ? 5 : 15;
  timerSec = dur * 60;
  timerTotal = timerSec;
  renderTimer();
  updateRing(1);

  document.querySelectorAll('#mode-row .mt').forEach(b => b.classList.remove('on'));
  const btn = document.querySelector(`#mode-row [data-m="${mode}"]`);
  if (btn) btn.classList.add('on');

  const labels = { focus: 'FOCUS', short: 'SHORT BREAK', long: 'LONG BREAK' };
  const lbl = document.getElementById('ring-lbl');
  if (lbl) lbl.textContent = labels[mode];

  const wrap = document.getElementById('ring-wrap');
  if (wrap) wrap.className = 'ring-wrap rm-' + mode;
}

export function toggleTimer() {
  timerRunning ? pauseTimer() : startTimer();
}

function startTimer() {
  timerRunning = true;
  timerStartAt = performance.now();
  timerSecAtStart = timerSec;

  const playIco = document.getElementById('play-ico');
  if (playIco) playIco.textContent = '⏸';

  timerTick = setInterval(tick, 250);
}

function pauseTimer() {
  timerRunning = false;

  const playIco = document.getElementById('play-ico');
  if (playIco) playIco.textContent = '▶';

  if (timerTick) {
    clearInterval(timerTick);
    timerTick = null;
  }
}

export function resetTimer() {
  pauseTimer();
  const dur = timerMode === 'focus' ? getState().settings.dur : timerMode === 'short' ? 5 : 15;
  timerSec = dur * 60;
  timerTotal = timerSec;
  renderTimer();
  updateRing(1);
  document.title = 'Student OS';
}

export function skipMode() {
  pauseTimer();
  if (timerMode === 'focus') {
    setMode(getState().sessCount % 4 === 3 ? 'long' : 'short');
  } else {
    setMode('focus');
  }
}

function tick() {
  if (!timerRunning) return;

  const elapsed = (performance.now() - timerStartAt) / 1000;
  timerSec = Math.max(0, Math.round(timerSecAtStart - elapsed));

  renderTimer();
  updateRing(timerSec / timerTotal);

  if (timerRunning) {
    document.title = '⏱ ' + formatTime(timerSec);
  }

  if (timerSec <= 0) {
    if (timerTick) {
      clearInterval(timerTick);
      timerTick = null;
    }

    if (timerMode === 'focus') {
      completeSession();
    } else {
      setMode('focus');
      toast('Break done!', 'Back to work.', 'blue');
    }
  }
}

function completeSession() {
  pauseTimer();

  const dur = timerMode === 'focus' ? getState().settings.dur : timerMode === 'short' ? 5 : 15;

  const state = getState();
  state.sessCount++;
  state.todayFocusMins += dur;
  state.sessions.unshift({
    dur,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ts: Date.now()
  });

  if (state.sessions.length > 50) state.sessions.length = 50;

  save();
  renderDots();
  renderSessionHistory();

  const btn = document.getElementById('play-btn');
  const rect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth / 2, top: 200 };
  gainXP(25, rect.left + rect.width / 2, rect.top);

  toast('Session done!', '+25 XP earned', 'green');
  checkAchievements();

  setTimeout(() => {
    if (state.sessCount % 4 === 0) setMode('long');
    else setMode('short');
  }, 400);

  document.title = 'Student OS';
}

function renderTimer() {
  const el = document.getElementById('ring-time');
  if (el) el.textContent = formatTime(timerSec);
}

function updateRing(pct) {
  const ring = document.getElementById('ring');
  if (ring) {
    ring.style.strokeDashoffset = RING_C * (1 - Math.max(0, Math.min(1, pct)));
  }
}

export function renderDots() {
  const dots = document.querySelectorAll('#dots .dot');
  const pos = getState().sessCount % 4;
  dots.forEach((d, i) => d.classList.toggle('done', i < pos));
}

export function renderSessionHistory() {
  const el = document.getElementById('sh-list');
  if (!el) return;

  const { sessions } = getState();

  if (!sessions.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📜</div>
        <p>No sessions yet. Hit start!</p>
      </div>
    `;
    return;
  }

  el.innerHTML = sessions.slice(0, 5).map(s =>
    `<div class="sh-item">
      <span style="color:var(--t2)">🎯 Focus • ${s.dur}m</span>
      <div style="display:flex;gap:12px">
        <span class="sh-item-t">${s.time}</span>
        <span class="sh-item-dur">${s.dur}m</span>
      </div>
    </div>`
  ).join('');
}

export function getTimerState() {
  return { timerSec, timerTotal, timerMode, timerRunning };
}

export function setTimerSec(sec) {
  timerSec = sec;
}

window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.skipMode = skipMode;