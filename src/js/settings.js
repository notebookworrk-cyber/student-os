import { getState, save, setState } from './state.js';
import { toast, validateApiKey, getProviderName, hideModal, esc } from './utils.js';
import { renderTasks } from './tasks.js';
import { renderDots, renderSessionHistory, setMode, setTimerSec } from './timer.js';
import { closeLevelUp } from './gamification.js';

let notifTimer = null;

export function initSettings() {
  setupDurationButtons();
  setupProviderButtons();
  updateAIStatus();
}

function setupDurationButtons() {
  document.querySelectorAll('#dur-row .d-btn').forEach(btn => {
    btn.addEventListener('click', () => setDur(parseInt(btn.dataset.d)));
  });
}

function setupProviderButtons() {
  document.querySelectorAll('#provider-select .provider-btn').forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.provider));
  });
}

export function openSettings() {
  const state = getState();

  const nameEl = document.getElementById('set-name');
  if (nameEl) nameEl.value = state.name;

  document.querySelectorAll('#dur-row .d-btn').forEach(b =>
    b.classList.toggle('on', parseInt(b.dataset.d) === state.settings.dur)
  );

  const apiEl = document.getElementById('api-key-inp');
  if (apiEl) apiEl.value = state.settings.apiKey || '';

  const notifEl = document.getElementById('notif-toggle');
  if (notifEl) notifEl.checked = !!state.settings.notifs;

  document.querySelectorAll('#provider-select .provider-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.provider === (state.settings.provider || 'anthropic'))
  );

  updateAIStatus();

  const modal = document.getElementById('set-modal');
  if (modal) modal.classList.add('on');
}

export function saveName() {
  const v = document.getElementById('set-name').value.trim();
  if (!v) return;

  const state = getState();
  state.name = v;
  save();

  const uname = document.getElementById('uname-in');
  if (uname) uname.value = v;

  hideModal('set-modal');
  import('./app.js').then(m => m.renderHome());
  toast('Name saved', 'Showing as ' + v, 'green');
}

function setProvider(provider) {
  const state = getState();
  state.settings.provider = provider;
  save();

  document.querySelectorAll('#provider-select .provider-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.provider === provider)
  );

  const hint = document.getElementById('ai-status');
  if (hint) {
    const prefix = provider === 'anthropic' ? 'sk-ant-' : 'AIzaSy';
    hint.innerHTML = `<span style="color:var(--t3)">Keys start with <code>${prefix}</code></span>`;
  }

  toast('Provider set', getProviderName(provider), 'purple');
  updateAIStatus();
}

export function saveApiKey() {
  const inp = document.getElementById('api-key-inp');
  const v = (inp.value || '').trim();

  const state = getState();
  const provider = state.settings.provider || 'anthropic';

  const validation = validateApiKey(v, provider);
  if (v && !validation.valid) {
    toast('Invalid key', validation.message, 'red');
    return;
  }

  state.settings.apiKey = v;
  save();
  updateAIStatus();

  if (v && validation.valid) {
    toast('API key saved', getProviderName(provider) + ' is now active', 'green');
  } else {
    toast('API key cleared', 'Using local knowledge base', 'amber');
  }
}

function updateAIStatus() {
  const state = getState();
  const apiKey = state.settings.apiKey || '';
  const provider = state.settings.provider || 'anthropic';
  const hasValidKey = provider === 'anthropic'
    ? apiKey.startsWith('sk-ant-')
    : apiKey.startsWith('AIzaSy');

  const statusEl = document.getElementById('ai-status');
  if (statusEl) {
    statusEl.innerHTML = hasValidKey
      ? '<span style="color:var(--green)">✅ ' + getProviderName(provider) + ' active</span>'
      : '<span style="color:var(--t3)">Using local knowledge base — add key for real AI</span>';
  }

  const descEl = document.getElementById('ai-status-desc');
  if (descEl) {
    descEl.textContent = hasValidKey
      ? getProviderName(provider) + ' is connected and ready'
      : 'Add your ' + getProviderName(provider) + ' API key for real AI answers';
  }
}

export function setDur(d) {
  const state = getState();
  state.settings.dur = d;
  save();

  document.querySelectorAll('#dur-row .d-btn').forEach(b =>
    b.classList.toggle('on', parseInt(b.dataset.d) === d)
  );

  import('./timer.js').then(m => {
    if (!m.getTimerState().timerRunning) {
      const mode = m.getTimerState().timerMode;
      if (mode === 'focus') {
        m.setTimerSec(d * 60);
        m.setMode('focus');
      }
    }
  });

  toast('Duration set', d + ' minute sessions', 'blue');
}

export function resetAll() {
  if (!confirm('Delete ALL data permanently?')) return;

  const state = getState();
  localStorage.removeItem('sos4');

  Object.assign(state, {
    name: 'Student',
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastDate: '',
    tasks: [],
    sessions: [],
    totalTasksDone: 0,
    todayFocusMins: 0,
    sessCount: 0,
    achievements: {
      firstFocus: false, streak7: false, xp100: false,
      tasks10: false, focus1hr: false, level5: false
    },
    activity: {},
    settings: { dur: 25, apiKey: '', notifs: false, provider: 'anthropic' }
  });

  save();
  hideModal('set-modal');

  import('./timer.js').then(m => {
    m.setMode('focus');
    m.setTimerSec(1500);
  });

  import('./app.js').then(m => {
    m.renderHome();
    m.renderDash();
    m.renderProgress();
  });

  renderTasks();
  renderDots();
  renderSessionHistory();

  setTimerSec(1500);

  const playIco = document.getElementById('play-ico');
  if (playIco) playIco.textContent = '▶';

  document.title = 'Student OS';

  toast('Reset done', 'Fresh start.', 'amber');
}

export function exportData() {
  const state = getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '3.0',
    name: state.name,
    level: state.level,
    xp: state.xp,
    streak: state.streak,
    bestStreak: state.bestStreak,
    totalTasksDone: state.totalTasksDone,
    todayFocusMins: state.todayFocusMins,
    sessCount: state.sessCount,
    sessions: state.sessions,
    tasks: state.tasks,
    activity: state.activity,
    achievements: state.achievements,
    settings: state.settings
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-os-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Exported!', 'Backup saved to your downloads.', 'green');
}

export function importData() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';

  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        if (typeof d.xp !== 'number' || !Array.isArray(d.tasks)) throw new Error('Invalid');

        const state = getState();
        ['name', 'level', 'xp', 'streak', 'bestStreak', 'totalTasksDone',
         'todayFocusMins', 'sessCount', 'sessions', 'tasks', 'activity',
         'achievements', 'settings'].forEach(k => {
          if (d[k] !== undefined) state[k] = d[k];
        });

        save();
        hideModal('set-modal');

        import('./app.js').then(m => {
          m.renderHome();
          m.renderDash();
          m.renderProgress();
        });
        renderTasks();
        renderDots();
        renderSessionHistory();

        toast('Imported!', 'Your backup has been restored.', 'green');
      } catch (err) {
        toast('Import failed', 'Not a valid Student OS backup.', 'red');
      }
    };
    reader.readAsText(file);
  };

  inp.click();
}

export function toggleNotifs(on) {
  const state = getState();
  state.settings.notifs = on;
  save();

  if (on) {
    requestNotifPermission().then(granted => {
      if (granted) {
        scheduleStudyReminders();
        toast('Notifications on', 'Study reminders enabled', 'green');
        setTimeout(() => sendNotif('Student OS 🧠', 'Notifications are working!'), 3000);
      } else {
        state.settings.notifs = false;
        save();
        const el = document.getElementById('notif-toggle');
        if (el) el.checked = false;
        toast('Permission denied', 'Allow notifications in your browser settings', 'red');
      }
    });
  } else {
    if (notifTimer) { clearInterval(notifTimer); notifTimer = null; }
    toast('Notifications off', 'Study reminders disabled', 'amber');
  }
}

export function scheduleStudyReminders() {
  if (notifTimer) clearInterval(notifTimer);
  const state = getState();
  if (!state.settings.notifs) return;

  notifTimer = setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < 7 || h > 22) return;

    if (state.todayFocusMins === 0 && h >= 10) {
      sendNotif("⚠️ You haven't studied yet today", "Open Student OS and start a focus session.", '📚');
    } else if (state.todayFocusMins > 0 && state.todayFocusMins < 60 && h >= 14) {
      sendNotif("Keep going, " + state.name + "!", "You've studied " + state.todayFocusMins + "m today.", '🔥');
    }
  }, 30 * 60 * 1000);
}

function notifSupported() {
  return 'Notification' in window;
}

async function requestNotifPermission() {
  if (!notifSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

function sendNotif(title, body, icon) {
  if (!notifSupported() || Notification.permission !== 'granted') return;
  if (!document.hidden && icon !== '⏰') return;
  try {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + icon + '</text></svg>'
    });
  } catch (e) {}
}

export function saveUname() {
  const v = document.getElementById('uname-in').value.trim();
  const state = getState();
  state.name = v || 'Student';
  save();
  import('./app.js').then(m => m.renderHome());
}
