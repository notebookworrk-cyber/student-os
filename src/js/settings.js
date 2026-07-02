import { getState, save, setState } from './state.js';
import { toast, validateApiKey, getProviderName, hideModal } from './utils.js';
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
        
        // Validate the imported data structure
        if (typeof d !== 'object' || d === null) {
          throw new Error('Invalid data format');
        }
        
        // Validate required top-level fields
        if (typeof d.name !== 'string') throw new Error('Invalid or missing name');
        if (typeof d.level !== 'number' || d.level < 1 || d.level > 10) throw new Error('Invalid or missing level');
        if (typeof d.xp !== 'number' || d.xp < 0) throw new Error('Invalid or missing xp');
        if (typeof d.streak !== 'number' || d.streak < 0) throw new Error('Invalid or missing streak');
        if (typeof d.bestStreak !== 'number' || d.bestStreak < 0) throw new Error('Invalid or missing bestStreak');
        if (typeof d.totalTasksDone !== 'number' || d.totalTasksDone < 0) throw new Error('Invalid or missing totalTasksDone');
        if (typeof d.todayFocusMins !== 'number' || d.todayFocusMins < 0) throw new Error('Invalid or missing todayFocusMins');
        if (typeof d.sessCount !== 'number' || d.sessCount < 0) throw new Error('Invalid or missing sessCount');
        if (typeof d.lastDate !== 'string') throw new Error('Invalid or missing lastDate');
        if (!Array.isArray(d.tasks)) throw new Error('Invalid or missing tasks');
        if (!Array.isArray(d.sessions)) throw new Error('Invalid or missing sessions');
        if (typeof d.activity !== 'object' || d.activity === null) throw new Error('Invalid or missing activity');
        if (!d.achievements || typeof d.achievements !== 'object') throw new Error('Invalid or missing achievements');
        if (!d.settings || typeof d.settings !== 'object') throw new Error('Invalid or missing settings');
        
        // Validate nested objects
        const requiredAchievements = ['firstFocus', 'streak7', 'xp100', 'tasks10', 'focus1hr', 'level5'];
        for (const key of requiredAchievements) {
          if (typeof d.achievements[key] !== 'boolean') {
            throw new Error(`Invalid or missing achievement: ${key}`);
          }
        }
        
        const requiredSettings = ['dur', 'apiKey', 'notifs', 'provider'];
        for (const key of requiredSettings) {
          if (d.settings[key] === undefined) {
            throw new Error(`Invalid or missing setting: ${key}`);
          }
        }
        if (typeof d.settings.dur !== 'number' || d.settings.dur <= 0) {
          throw new Error('Invalid duration setting');
        }
        if (typeof d.settings.apiKey !== 'string') {
          throw new Error('Invalid API key setting');
        }
        if (typeof d.settings.notifs !== 'boolean') {
          throw new Error('Invalid notifications setting');
        }
        if (d.settings.provider !== 'anthropic' && d.settings.provider !== 'gemini') {
          throw new Error('Invalid provider setting');
        }
        
        // Validate task objects
        for (let i = 0; i < d.tasks.length; i++) {
          const task = d.tasks[i];
          if (typeof task !== 'object' || task === null) {
            throw new Error(`Invalid task at index ${i}`);
          }
          if (typeof task.id !== 'number') throw new Error(`Invalid or missing id for task at index ${i}`);
          if (typeof task.name !== 'string') throw new Error(`Invalid or missing name for task at index ${i}`);
          if (typeof task.sub !== 'string') throw new Error(`Invalid or missing subject for task at index ${i}`);
          if (typeof task.pri !== 'string') throw new Error(`Invalid or missing priority for task at index ${i}`);
          if (typeof task.time !== 'string') throw new Error(`Invalid or missing time for task at index ${i}`);
          if (typeof task.done !== 'boolean') throw new Error(`Invalid or missing done flag for task at index ${i}`);
          if (task.doneDate !== null && typeof task.doneDate !== 'string') {
            throw new Error(`Invalid doneDate for task at index ${i}`);
          }
          if (typeof task.pinned !== 'boolean') {
            throw new Error(`Invalid or missing pinned flag for task at index ${i}`);
          }
        }
        
        // Validate session objects
        for (let i = 0; i < d.sessions.length; i++) {
          const session = d.sessions[i];
          if (typeof session !== 'object' || session === null) {
            throw new Error(`Invalid session at index ${i}`);
          }
          if (typeof session.dur !== 'number' || session.dur <= 0) {
            throw new Error(`Invalid or missing duration for session at index ${i}`);
          }
          if (typeof session.time !== 'string') {
            throw new Error(`Invalid or missing time for session at index ${i}`);
          }
          if (typeof session.ts !== 'number') {
            throw new Error(`Invalid or missing timestamp for session at index ${i}`);
          }
        }
        
        // All validation passed, apply the data
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
