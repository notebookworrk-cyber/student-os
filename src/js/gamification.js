import { getState, save, getToday, getLevelTitle, ACH_D } from './state.js';
import { toast, floatXP, makeConfetti } from './utils.js';

export function gainXP(amount, x, y) {
  const state = getState();
  const oldLevel = state.level;

  state.xp += amount;
  state.level = Math.min(10, Math.floor(state.xp / 100) + 1);

  const today = getToday();
  if (!state.activity[today]) state.activity[today] = 0;
  state.activity[today] += amount;

  save();
  floatXP(amount, x, y);

  if (state.level > oldLevel) {
    setTimeout(() => showLevelUp(state.level), 600);
  }

  checkAchievements();

  const curTab = getCurrentTab();
  if (curTab === 'home') import('./app.js').then(m => m.renderHome());
  else if (curTab === 'dash') import('./app.js').then(m => m.renderDash());
  else if (curTab === 'prog') import('./app.js').then(m => m.renderProgress());
}

function showLevelUp(level) {
  const sub = document.getElementById('lu-sub');
  const badge = document.getElementById('lu-badge');
  const overlay = document.getElementById('lu-overlay');

  if (sub) sub.textContent = `You reached Level ${level}!`;
  if (badge) badge.textContent = `Level ${level} — ${getLevelTitle(level)}`;
  if (overlay) overlay.classList.add('on');

  makeConfetti();
  toast(`Level ${level}!`, getLevelTitle(level), 'amber');
}

export function closeLevelUp() {
  const overlay = document.getElementById('lu-overlay');
  if (overlay) overlay.classList.remove('on');
}

export function checkAchievements() {
  const state = getState();
  const totalMins = state.sessions.reduce((a, s) => a + (s.dur || 0), 0);

  const checks = {
    firstFocus: state.sessions.length > 0,
    streak7: state.streak >= 7,
    xp100: state.xp >= 100,
    tasks10: state.totalTasksDone >= 10,
    focus1hr: totalMins >= 60,
    level5: state.level >= 5
  };

  let changed = false;

  Object.keys(checks).forEach(key => {
    if (checks[key] && !state.achievements[key]) {
      state.achievements[key] = true;
      changed = true;
      const ach = ACH_D.find(a => a.id === key);
      if (ach) toast(`${ach.ico} Achievement!`, `${ach.name} unlocked`, 'amber');
    }
  });

  if (changed) save();
}

export function renderAchievements() {
  const grid = document.getElementById('ach-grid');
  if (!grid) return;

  const state = getState();

  grid.innerHTML = ACH_D.map(a => `
    <div class="ach ${state.achievements[a.id] ? 'unlocked' : 'locked'}">
      <div class="ach-ico">${a.ico}</div>
      <div class="ach-nm">${a.name}</div>
      <div class="ach-tip">${a.tip}</div>
    </div>
  `).join('');
}

function getCurrentTab() {
  const activePage = document.querySelector('.page.on');
  return activePage ? activePage.id.replace('pg-', '') : 'home';
}

window.closeLevelUp = closeLevelUp;