import { load, getState, save, getToday, getLevelTitle, QUOTES, LVT, RING_C } from './state.js';
import { initTasks, renderTasks, addTask, deleteTask, toggleTask, dailyReset } from './tasks.js';
import { initTimer, setMode, toggleTimer, resetTimer, skipMode, renderDots, renderSessionHistory } from './timer.js';
import { initAI, sendAI, useChip, aiKey, autoR, clearChat } from './ai.js';
import { initSettings, openSettings, saveApiKey, saveName, setDur, resetAll, exportData, importData, toggleNotifs, saveUname } from './settings.js';
import { gainXP, checkAchievements, closeLevelUp, renderAchievements } from './gamification.js';
import { toast, showModal, hideModal, onOverlayClick, makeConfetti, formatTime, esc, floatXP } from './utils.js';

let curTab = 'home';
let timerRunning = false;

const MISSIONS = [
  'Complete 2 focus sessions today',
  'Finish 3 tasks before midnight',
  'Study for 50+ minutes total',
  'Complete a Physics or Math task',
  'Maintain your streak — study now'
];

const COACH_M = [
  'You haven\'t studied yet today. <b>One session sets the tone for everything.</b>',
  'Top students study 3+ hours daily. <b>Where are you right now?</b>',
  'Boards don\'t care about your mood. <b>Show up anyway.</b>',
  'One 25-min session right now beats zero sessions all day. <b>Start.</b>',
  '<b>Stop planning. Start doing.</b> Your future self will thank you.'
];

const SICO = {
  math: '📐', physics: '⚛️', chemistry: '🧪',
  english: '📖', history: '🏛️', biology: '🧬', other: '📦'
};

document.addEventListener('DOMContentLoaded', () => {
  load();
  const state = getState();
  createAppShell();
  renderHome();
  renderDash();
  renderProgress();
  initTasks();
  initTimer();
  initAI();
  initSettings();
  setupNavigation();
  setupKeyboard();
  setupPWA();
  setupSoundButtons();
  setupExitDF();

  if (state.settings.notifs && 'Notification' in window && Notification.permission === 'granted') {
    import('./settings.js').then(m => m.scheduleStudyReminders());
  }

  const ring = document.getElementById('ring');
  if (ring) {
    ring.style.strokeDasharray = RING_C;
    ring.style.willChange = 'stroke-dashoffset';
  }

  const xpBar = document.getElementById('hm-xp-bar');
  if (xpBar) xpBar.style.willChange = 'width';
});

function createAppShell() {
  const app = document.getElementById('app');
  if (!app) return;

  const state = getState();

  app.innerHTML = `
<div id="app-inner">
  <header class="header" id="app-header">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      Student OS
    </div>
    <nav class="nav" id="nav-header">
      <button class="nav-btn on" data-t="home">Home</button>
      <button class="nav-btn" data-t="dash">Dashboard</button>
      <button class="nav-btn" data-t="focus">Focus</button>
      <button class="nav-btn" data-t="tasks">Tasks</button>
      <button class="nav-btn" data-t="prog">Progress</button>
      <button class="nav-btn" data-t="ai">AI</button>
    </nav>
  </header>

  <main class="main" id="main">

    <!-- HOME -->
    <section class="page on" id="pg-home">
      <div class="section">
        <div class="hm-top">
          <div>
            <div class="hm-greet-time" id="hm-greet-time">Good morning</div>
            <div class="hm-greet-name" id="hm-greet-name">${esc(state.name)}</div>
          </div>
          <button class="btn btn-ghost btn-sm hm-set-btn" onclick="openSettings()">&#x2699; Settings</button>
        </div>

        <div class="hm-stat st-zero" id="hm-stat">
          <div class="hm-stat-num" id="hm-stat-num">0 min</div>
          <div class="hm-stat-sub" id="hm-stat-sub">studied today</div>
          <div class="hm-status s-behind" id="hm-status">&#x25CF; You are falling behind</div>
          <div class="hm-urgency" id="hm-urgency">&#x23F3; Calculating...</div>
        </div>

        <div class="hm-level">
          <div class="hm-level-row">
            <div>
              <span class="hm-lv-num" id="hm-lv-num">LV 1</span>
              <span class="hm-lv-title" id="hm-lv-title" style="margin-left:8px">Rookie</span>
            </div>
            <div class="hm-xp-right"><b id="hm-xp-cur">0</b> / 100 XP</div>
          </div>
          <div class="hm-xp-track"><div class="hm-xp-bar" id="hm-xp-bar" style="width:0%"></div></div>
        </div>

        <div class="hm-mission">
          <div>
            <div class="hm-mission-lbl">Daily Mission</div>
            <div class="hm-mission-txt" id="hm-mission-txt">Complete 2 focus sessions today</div>
          </div>
          <div class="hm-mission-xp">+50 XP</div>
        </div>

        <button class="btn btn-primary w-full" onclick="go('focus')" style="margin-bottom:12px">
          &#x1F525; Start Focus Session
        </button>

        <div class="grid-2" style="margin-bottom:12px">
          <button class="btn btn-secondary" onclick="showModal('task-modal')">&#x2795; Add Task</button>
          <button class="btn btn-secondary" onclick="go('tasks')">&#x1F4CB; View Tasks</button>
        </div>

        <div class="grid-3" style="margin-bottom:12px">
          <div class="card stat">
            <div class="stat-num" id="hm-streak" style="color:var(--amber)">0</div>
            <div class="stat-label">Streak</div>
          </div>
          <div class="card stat">
            <div class="stat-num" id="hm-sessions" style="color:var(--blue)">0</div>
            <div class="stat-label">Sessions</div>
          </div>
          <div class="card stat">
            <div class="stat-num" id="hm-done" style="color:var(--green)">0</div>
            <div class="stat-label">Done Today</div>
          </div>
        </div>

        <div class="hm-coach card" style="display:flex;gap:12px;align-items:flex-start">
          <div style="font-size:24px">&#x1F916;</div>
          <div class="hm-coach-txt" id="hm-coach" style="font-size:.9rem;color:var(--t2);line-height:1.6">Analyzing your study patterns...</div>
        </div>
      </div>
    </section>

    <!-- DASHBOARD -->
    <section class="page" id="pg-dash">
      <div class="section">
        <div class="section-title">Dashboard</div>
        <div class="grid-2" style="margin-bottom:12px">
          <div class="card stat"><div class="stat-num" id="d-streak" style="color:var(--amber)">0</div><div class="stat-label">Streak</div></div>
          <div class="card stat"><div class="stat-num" id="d-xp" style="color:var(--cyan)">0</div><div class="stat-label">Total XP</div></div>
          <div class="card stat"><div class="stat-num" id="d-level" style="color:var(--purple)">1</div><div class="stat-label" id="d-ltitle">Rookie</div></div>
          <div class="card stat"><div class="stat-num" id="d-done" style="color:var(--green)">0</div><div class="stat-label">Done Today</div></div>
          <div class="card stat"><div class="stat-num" id="d-fmin" style="color:var(--blue)">0</div><div class="stat-label">Focus Min</div></div>
          <div class="card" style="grid-column:1/-1"><p id="quote-el" style="font-style:italic;color:var(--t2)"></p></div>
        </div>
        <div class="flex gap-8" style="margin-bottom:12px">
          <button class="btn btn-primary btn-sm" onclick="go('focus')">&#x25B6; Start Focus</button>
          <button class="btn btn-secondary btn-sm" onclick="showModal('task-modal')">+ Add Task</button>
        </div>
        <div class="card"><div class="section-title" style="font-size:.85rem">This Week</div><div class="week-row" id="week-row" style="display:flex;gap:8px"></div></div>
      </div>
    </section>

    <!-- FOCUS -->
    <section class="page" id="pg-focus">
      <div class="section">
        <div class="section-title">Focus Mode</div>
        <div class="mode-row">
          <button class="mode-btn on" data-m="focus" onclick="setMode('focus')">&#x23F1; Focus</button>
          <button class="mode-btn" data-m="short" onclick="setMode('short')">&#x2615; Short</button>
          <button class="mode-btn" data-m="long" onclick="setMode('long')">&#x1F319; Long</button>
        </div>
        <div class="ring-wrap rm-focus" id="ring-wrap">
          <svg class="ring-svg" viewBox="0 0 250 250">
            <circle class="ring-bg" cx="125" cy="125" r="108"/>
            <circle class="ring" id="ring" cx="125" cy="125" r="108" stroke-dasharray="678.6" stroke-dashoffset="0"/>
          </svg>
          <div class="ring-time" id="ring-time">25:00</div>
          <div class="ring-label" id="ring-lbl">FOCUS</div>
        </div>
        <div class="flex gap-8" style="justify-content:center;margin:16px 0">
          <button class="btn btn-secondary btn-sm" onclick="resetTimer()">&#x21BA;</button>
          <button class="btn btn-primary" id="play-btn" onclick="toggleTimer()" style="min-width:60px"><span id="play-ico">&#x25B6;</span></button>
          <button class="btn btn-secondary btn-sm" onclick="skipMode()">&#x23ED;</button>
        </div>
        <div class="dots" id="dots" style="margin-bottom:12px">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
        <div class="flex gap-8" style="justify-content:center;margin-bottom:12px">
          <button class="chip s-btn" data-s="rain">&#x1F327; Rain</button>
          <button class="chip s-btn" data-s="waves">&#x1F30A; Waves</button>
          <button class="chip s-btn" data-s="white">&#x25A1; Noise</button>
        </div>
        <div class="section-title" style="font-size:.85rem">Recent Sessions</div>
        <div id="sh-list"></div>
        <button class="btn btn-ghost w-full" onclick="enterDF()" style="margin-top:12px">&#x1F319; Deep Focus</button>
      </div>
    </section>

    <!-- TASKS -->
    <section class="page" id="pg-tasks">
      <div class="section">
        <div class="flex justify-between items-center gap-8" style="margin-bottom:12px">
          <div class="section-title" style="margin-bottom:0">Daily Missions</div>
          <button class="btn btn-primary btn-sm" onclick="showModal('task-modal')">+ New</button>
        </div>
        <div class="flex justify-between items-center gap-8" style="margin-bottom:12px">
          <div class="flex gap-8" id="ftabs">
            <button class="chip on" data-f="all">All</button>
            <button class="chip" data-f="active">Active</button>
            <button class="chip" data-f="completed">Done</button>
            <button class="chip" data-f="physics">Physics</button>
            <button class="chip" data-f="math">Math</button>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="dailyReset()">&#x21BA; Reset</button>
        </div>
        <div class="section-title" style="font-size:.8rem;color:var(--t3)">Pinned</div>
        <div id="pinned-list"></div>
        <div class="section-title" style="font-size:.8rem;color:var(--t3);margin-top:16px">All Tasks</div>
        <div id="all-list"></div>
      </div>
    </section>

    <!-- PROGRESS -->
    <section class="page" id="pg-prog">
      <div class="section">
        <div class="section-title">Your Progress</div>
        <div class="card" style="margin-bottom:12px">
          <div class="flex justify-between items-center gap-8" style="margin-bottom:8px">
            <div class="badge"><span id="p-lv">LV 1</span> &middot; <span id="p-title">Rookie</span></div>
            <div style="font-size:.8rem;color:var(--t3)"><b id="p-cur">0</b> / <b id="p-max">100</b> XP</div>
          </div>
          <div class="xp-bar-wrap"><div class="xp-bar" id="xp-bar" style="width:0%"></div></div>
        </div>
        <div class="grid-3" style="margin-bottom:12px">
          <div class="card stat"><div class="stat-num" id="ps-xp" style="color:var(--cyan)">0</div><div class="stat-label">Total XP</div></div>
          <div class="card stat"><div class="stat-num" id="ps-sess" style="color:var(--blue)">0</div><div class="stat-label">Sessions</div></div>
          <div class="card stat"><div class="stat-num" id="ps-tasks" style="color:var(--green)">0</div><div class="stat-label">Tasks Done</div></div>
          <div class="card stat"><div class="stat-num" id="ps-mins" style="color:var(--purple)">0</div><div class="stat-label">Focus Mins</div></div>
          <div class="card stat"><div class="stat-num" id="ps-best" style="color:var(--amber)">0</div><div class="stat-label">Best Streak</div></div>
          <div class="card stat"><div class="stat-num" id="ps-lv" style="color:var(--pink)">1</div><div class="stat-label">Level</div></div>
        </div>
        <div class="card" style="margin-bottom:12px">
          <div class="section-title" style="font-size:.85rem">Weekly XP</div>
          <div class="bar-chart" id="bar-wrap"></div>
        </div>
        <div class="card" style="margin-bottom:12px">
          <div class="section-title" style="font-size:.85rem">30-Day Activity</div>
          <div class="hm30" id="hm30"></div>
        </div>
        <div class="card">
          <div class="section-title" style="font-size:.85rem">Achievements</div>
          <div class="ach-grid" id="ach-grid"></div>
        </div>
      </div>
    </section>

    <!-- AI HELP -->
    <section class="page" id="pg-ai">
      <div class="section" style="display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:400px">
        <div class="flex justify-between items-center gap-8" style="margin-bottom:8px">
          <div class="section-title" style="margin-bottom:0">&#x1F916; AI Study Help</div>
          <button class="btn btn-ghost btn-sm" onclick="clearChat()">Clear chat</button>
        </div>
        <div style="font-size:.8rem;color:var(--t3);margin-bottom:12px">Ask anything. I'll actually explain it.</div>
        <div class="flex gap-8" style="margin-bottom:12px;overflow-x:auto">
          <button class="chip" onclick="useChip(this)">Newton's Laws</button>
          <button class="chip" onclick="useChip(this)">Photosynthesis</button>
          <button class="chip" onclick="useChip(this)">Recursion</button>
          <button class="chip" onclick="useChip(this)">Derivatives</button>
        </div>
        <div class="ai-chat" style="flex:1;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column">
          <div class="msgs" id="msgs" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px"></div>
          <div class="ai-inp-area">
            <div class="ai-inp-row">
              <textarea class="ai-inp" id="ai-inp" rows="1" placeholder="Ask anything..." style="flex:1;min-height:44px;max-height:110px;resize:none;padding:10px 14px;border-radius:12px;background:var(--card);border:1px solid var(--border);color:var(--t1)"></textarea>
              <button class="ai-send" onclick="sendAI()" style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--purple),var(--blue));color:#fff;border:none;font-size:1.2rem;display:flex;align-items:center;justify-content:center">&#x27A4;</button>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <nav class="bottom-nav" id="bottom-nav">
    <button class="bn-item on" data-t="home"><span class="bn-ico">&#x1F3E0;</span> Home</button>
    <button class="bn-item" data-t="dash"><span class="bn-ico">&#x1F4CA;</span> Dash</button>
    <button class="bn-item" data-t="focus"><span class="bn-ico">&#x23F1;</span> Focus</button>
    <button class="bn-item" data-t="tasks"><span class="bn-ico">&#x2705;</span> Tasks</button>
    <button class="bn-item" data-t="prog"><span class="bn-ico">&#x1F3C6;</span> Progress</button>
    <button class="bn-item" data-t="ai"><span class="bn-ico">&#x1F916;</span> AI</button>
  </nav>
</div>

<!-- Task Modal -->
<div class="modal-overlay" id="task-modal" onclick="onOverlayClick(event,'task-modal')">
  <div class="modal">
    <div class="modal-title">New Mission</div>
    <div class="setting-row"><label class="setting-title">Task Name</label></div>
    <input class="f-input" id="t-name" placeholder="e.g. Solve 20 integration problems..." maxlength="80" style="margin-bottom:12px">
    <div class="grid-2" style="margin-bottom:12px">
      <div>
        <label class="setting-title" style="display:block;margin-bottom:6px;font-size:.8rem">Subject</label>
        <select class="f-input" id="t-sub">
          <option value="math">Math</option><option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option><option value="english">English</option>
          <option value="history">History</option><option value="biology">Biology</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label class="setting-title" style="display:block;margin-bottom:6px;font-size:.8rem">Est. Time</label>
        <input class="f-input" id="t-time" placeholder="30 min" maxlength="20">
      </div>
    </div>
    <div style="margin-bottom:12px">
      <label class="setting-title" style="display:block;margin-bottom:6px;font-size:.8rem">Priority</label>
      <div class="flex gap-8" id="pri-row">
        <button class="chip s-h" data-p="high" style="background:rgba(239,68,68,.15);color:var(--red);border-color:rgba(239,68,68,.3)">&#x1F534; High</button>
        <button class="chip" data-p="medium">&#x1F7E1; Med</button>
        <button class="chip" data-p="low">&#x1F7E2; Low</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal('task-modal')">Cancel</button>
      <button class="btn btn-primary" onclick="addTask()">Add Mission</button>
    </div>
  </div>
</div>

<!-- Settings Modal -->
<div class="modal-overlay" id="set-modal" onclick="onOverlayClick(event,'set-modal')">
  <div class="modal">
    <div class="modal-title">Settings</div>

    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title">Display Name</span>
        <span class="setting-desc">Your study profile name</span>
      </div>
    </div>
    <div class="flex gap-8" style="margin-bottom:16px">
      <input class="f-input" id="set-name" placeholder="Your name" maxlength="24" style="flex:1">
      <button class="btn btn-primary btn-sm" onclick="saveName()">Save</button>
    </div>

    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title">Focus Duration</span>
        <span class="setting-desc">Minutes per session</span>
      </div>
    </div>
    <div class="dur-btns" id="dur-row" style="margin-bottom:16px">
      <button class="d-btn" data-d="15">15</button>
      <button class="d-btn" data-d="20">20</button>
      <button class="d-btn on" data-d="25">25</button>
      <button class="d-btn" data-d="30">30</button>
      <button class="d-btn" data-d="45">45</button>
      <button class="d-btn" data-d="60">60</button>
    </div>

    <div class="setting-row" style="flex-direction:column;align-items:flex-start">
      <div class="setting-label" style="margin-bottom:8px">
        <span class="setting-title">AI Provider</span>
        <span class="setting-desc">Choose your AI backend</span>
      </div>
      <div class="provider-select" id="provider-select">
        <button class="provider-btn active" data-provider="anthropic">&#x1F916; Claude</button>
        <button class="provider-btn" data-provider="gemini">&#x1F30D; Gemini</button>
      </div>
    </div>

    <div class="setting-row" style="flex-direction:column;align-items:flex-start;margin-bottom:8px">
      <div class="setting-label" style="margin-bottom:8px">
        <span class="setting-title">API Key</span>
        <span class="setting-desc" id="ai-status-desc">Add your API key for real AI answers</span>
      </div>
      <div class="flex gap-8" style="width:100%">
        <input class="f-input" id="api-key-inp" type="password" placeholder="sk-ant-..." maxlength="120" style="font-family:monospace;font-size:.75rem;flex:1">
        <button class="btn btn-primary btn-sm" onclick="saveApiKey()">Save</button>
      </div>
      <div class="api-key-hint" id="ai-status"></div>
    </div>

    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title">Study Reminders</span>
        <span class="setting-desc">Get nudged when you haven't studied</span>
      </div>
      <label class="toggle">
        <input type="checkbox" id="notif-toggle" onchange="toggleNotifs(this.checked)">
        <span class="toggle-slider"></span>
      </label>
    </div>

    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title">Backup &amp; Restore</span>
        <span class="setting-desc">Export or import your progress</span>
      </div>
    </div>
    <div class="flex gap-8" style="margin-bottom:16px">
      <button class="btn btn-secondary btn-sm" style="flex:1" onclick="exportData()">&#x2B07; Export</button>
      <button class="btn btn-secondary btn-sm" style="flex:1" onclick="importData()">&#x2B06; Import</button>
    </div>

    <div class="setting-row">
      <div class="setting-label">
        <span class="setting-title" style="color:var(--red)">Danger Zone</span>
        <span class="setting-desc">Reset all data permanently</span>
      </div>
    </div>
    <button class="btn btn-secondary btn-sm w-full" style="border-color:var(--red);color:var(--red)" onclick="resetAll()">Reset All Data</button>
  </div>
</div>

<!-- Level Up Overlay -->
<div id="lu-overlay">
  <div class="modal" style="text-align:center;max-width:340px;background:linear-gradient(135deg,#1a1625,#0d0f1a);border-color:var(--amber)">
    <div style="font-size:3rem;margin-bottom:8px">&#x1F3C6;</div>
    <div id="lu-badge" style="font-size:1.5rem;font-weight:700;color:var(--amber)">Level 1 &mdash; Rookie</div>
    <div id="lu-sub" style="color:var(--t2);margin-bottom:16px">You reached a new level!</div>
    <button class="btn btn-primary" onclick="closeLevelUp()" style="margin-top:8px">Let's Go &#x1F525;</button>
    <div id="confetti" style="position:fixed;inset:0;pointer-events:none;z-index:350;overflow:hidden"></div>
  </div>
</div>

<!-- Deep Focus Exit -->
<button class="btn btn-ghost btn-sm exit-df" id="exit-df-btn" onclick="exitDF()" style="display:none">&#x26F6; Exit Deep Focus</button>

<!-- PWA Install Button -->
<button id="pwa-install-btn" onclick="installPWA()" style="display:none">&#x1F4F2; Install App</button>
`;

  // Move PWA install button, confetti, and deep focus exit to body level
  document.body.prepend(app.querySelector('#exit-df-btn'));
  document.body.appendChild(app.querySelector('#lu-overlay'));
  document.body.appendChild(app.querySelector('#pwa-install-btn'));
  document.body.appendChild(app.querySelector('#confetti'));
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn, .bn-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.t;
      if (tab) go(tab);
    });
  });
}

export function go(tab, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const pg = document.getElementById('pg-' + tab);
  if (!pg) return;
  pg.classList.add('on');

  document.querySelectorAll('.nav-btn, .bn-item').forEach(n => n.classList.remove('on'));
  document.querySelectorAll(`[data-t="${tab}"]`).forEach(n => n.classList.add('on'));

  curTab = tab;

  if (tab === 'home') renderHome();
  if (tab === 'dash') renderDash();
  if (tab === 'tasks') renderTasks();
  if (tab === 'prog') renderProgress();
  if (tab === 'ai') {
    const msgs = document.getElementById('msgs');
    if (msgs && msgs.children.length === 0) initAI();
  }

  document.title = tab === 'focus' && timerRunning ? '⏱ Focus' : 'Student OS';
}

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['task-modal', 'set-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('on')) hideModal(id);
      });
    }
    if (curTab === 'focus' && e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      toggleTimer();
    }
    if (curTab === 'ai' && e.key === 'Enter' && !e.shiftKey && document.activeElement?.id === 'ai-inp') {
      e.preventDefault();
      sendAI();
    }
  });

  document.addEventListener('click', e => {
    const target = e.target;
    if (target.id === 'task-modal' || target.id === 'set-modal') {
      hideModal(target.id);
    }
  });
}

/* ── HOME ── */
export function renderHome() {
  const state = getState();
  const now = new Date();
  const h = now.getHours();
  const ml = (23 - h) * 60 + (59 - now.getMinutes());
  const hl = Math.floor(ml / 60);
  const mn = ml % 60;
  const fm = state.todayFocusMins;

  const gtEl = document.getElementById('hm-greet-time');
  if (gtEl) gtEl.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const gnEl = document.getElementById('hm-greet-name');
  if (gnEl) gnEl.textContent = state.name;

  const block = document.getElementById('hm-stat');
  const numEl = document.getElementById('hm-stat-num');
  const statusEl = document.getElementById('hm-status');
  if (block && numEl && statusEl) {
    numEl.textContent = fm + ' min';
    if (fm === 0) {
      block.className = 'hm-stat st-zero';
      statusEl.className = 'hm-status s-behind';
      statusEl.innerHTML = '&#x25CF; You are falling behind';
    } else if (fm < 30) {
      block.className = 'hm-stat st-low';
      statusEl.className = 'hm-status s-ok';
      statusEl.innerHTML = '&#x25CF; Keep pushing';
    } else if (fm < 60) {
      block.className = 'hm-stat st-mid';
      statusEl.className = 'hm-status s-ok';
      statusEl.innerHTML = '&#x25CF; On track';
    } else {
      block.className = 'hm-stat st-good';
      statusEl.className = 'hm-status s-good';
      statusEl.innerHTML = '&#x25CF; Crushing it today';
    }
  }

  const urgEl = document.getElementById('hm-urgency');
  if (urgEl) urgEl.textContent = '⏳ ' + hl + 'h ' + mn + 'm left today';

  const xpInLv = state.xp % 100;
  const lvNumEl = document.getElementById('hm-lv-num');
  if (lvNumEl) lvNumEl.textContent = 'LV ' + state.level;
  const lvTiEl = document.getElementById('hm-lv-title');
  if (lvTiEl) lvTiEl.textContent = getLevelTitle(state.level);
  const xpCurEl = document.getElementById('hm-xp-cur');
  if (xpCurEl) xpCurEl.textContent = xpInLv;
  const xpBarEl = document.getElementById('hm-xp-bar');
  if (xpBarEl) xpBarEl.style.width = xpInLv + '%';

  const mEl = document.getElementById('hm-mission-txt');
  if (mEl) mEl.textContent = MISSIONS[Math.floor(Date.now() / 86400000) % MISSIONS.length];

  const strEl = document.getElementById('hm-streak');
  if (strEl) strEl.textContent = state.streak;
  const sessEl = document.getElementById('hm-sessions');
  if (sessEl) sessEl.textContent = state.sessions.length;
  const doneEl = document.getElementById('hm-done');
  if (doneEl) doneEl.textContent = state.tasks.filter(t => t.done && t.doneDate === getToday()).length;

  const cEl = document.getElementById('hm-coach');
  if (cEl) {
    let msg;
    if (fm === 0 && h >= 15) msg = 'It\'s already afternoon and you haven\'t started. <b>Open the focus timer. Now.</b>';
    else if (fm === 0) msg = 'You haven\'t studied yet today. <b>One session now sets the tone for everything.</b>';
    else if (state.streak >= 3) msg = 'You\'re on a <b>' + state.streak + '-day streak.</b> One more session keeps the chain alive.';
    else msg = COACH_M[Math.floor(Date.now() / 3600000) % COACH_M.length];
    cEl.innerHTML = msg;
  }
}

/* ── DASHBOARD ── */
export function renderDash() {
  const state = getState();
  const h = new Date().getHours();
  const greet = document.getElementById('greet');
  if (greet) greet.textContent = h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤' : 'Good Evening 🌙';

  numUp('d-streak', state.streak);
  numUp('d-xp', state.xp);
  numUp('d-level', state.level);
  const ltEl = document.getElementById('d-ltitle');
  if (ltEl) ltEl.textContent = getLevelTitle(state.level);
  numUp('d-done', state.tasks.filter(t => t.done && t.doneDate === getToday()).length);
  numUp('d-fmin', state.todayFocusMins);

  const qEl = document.getElementById('quote-el');
  if (qEl) qEl.textContent = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  renderWeek();
}

function numUp(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el._numUpTimer) { clearInterval(el._numUpTimer); el._numUpTimer = null; }
  if (target === 0) { el.textContent = '0'; return; }
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  el._numUpTimer = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) { clearInterval(el._numUpTimer); el._numUpTimer = null; }
  }, 18);
}

function renderWeek() {
  const w = document.getElementById('week-row');
  if (!w) return;
  w.innerHTML = '';
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const state = getState();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toDateString();
    const el = document.createElement('div');
    el.className = 'wd' + (state.activity[ds] > 0 ? ' act' : '') + (i === 0 ? ' tod' : '');
    el.textContent = days[d.getDay()];
    w.appendChild(el);
  }
}

/* ── PROGRESS ── */
export function renderProgress() {
  const state = getState();
  const xpInLv = state.xp % 100;

  const pLv = document.getElementById('p-lv');
  if (pLv) pLv.textContent = 'LV ' + state.level;
  const pTitle = document.getElementById('p-title');
  if (pTitle) pTitle.textContent = getLevelTitle(state.level);
  const pCur = document.getElementById('p-cur');
  if (pCur) pCur.textContent = xpInLv;
  const pMax = document.getElementById('p-max');
  if (pMax) pMax.textContent = 100;
  const xpBar = document.getElementById('xp-bar');
  if (xpBar) xpBar.style.width = xpInLv + '%';

  numUp('ps-xp', state.xp);
  numUp('ps-sess', state.sessions.length);
  numUp('ps-tasks', state.totalTasksDone);
  numUp('ps-mins', state.sessions.reduce((a, s) => a + (s.dur || 0), 0));
  numUp('ps-best', state.bestStreak);
  numUp('ps-lv', state.level);

  renderBarChart();
  renderHM30();
  renderAchievements();
}

function renderBarChart() {
  const wrap = document.getElementById('bar-wrap');
  if (!wrap) return;
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const state = getState();
  let maxXP = 1;
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const v = state.activity[d.toDateString()] || 0;
    if (v > maxXP) maxXP = v;
    data.push({ lbl: days[d.getDay()], v, isToday: i === 0 });
  }
  const frag = document.createDocumentFragment();
  data.forEach(d => {
    const h = Math.max(4, Math.round((d.v / maxXP) * 75));
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = '<div class="bar-fill' + (d.isToday ? ' bar-fill-today' : '') + '" style="height:' + h + 'px" title="' + d.v + ' XP"></div><div class="bar-lbl">' + (d.isToday ? '<b>' + d.lbl + '</b>' : d.lbl) + '</div>';
    frag.appendChild(col);
  });
  wrap.innerHTML = '';
  wrap.appendChild(frag);
}

function renderHM30() {
  const c = document.getElementById('hm30');
  if (!c) return;
  c.innerHTML = '';
  const today = new Date();
  const state = getState();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const xp = state.activity[d.toDateString()] || 0;
    const v = xp === 0 ? 0 : xp < 25 ? 1 : xp < 75 ? 2 : 3;
    const el = document.createElement('div');
    el.className = 'hmc';
    if (v) el.setAttribute('data-v', v);
    el.title = d.toDateString() + ': ' + xp + ' XP';
    c.appendChild(el);
  }
}

export function getCurrentTab() {
  return curTab;
}

/* ── PWA ── */
let installPrompt = null;

function setupPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'flex';
  });

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
    toast('Installed!', 'Student OS is now on your home screen', 'green');
  });
}

window.installPWA = function () {
  if (installPrompt) {
    installPrompt.prompt();
    installPrompt.userChoice.then(r => {
      if (r.outcome === 'accepted') toast('Installing...', 'Adding to your home screen', 'purple');
      installPrompt = null;
    });
  } else {
    toast('Install', 'Open in Chrome/Safari and use "Add to Home Screen"', 'blue');
  }
};

/* ── Sound Toggle ── */
function setupSoundButtons() {
  document.querySelectorAll('.s-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const was = btn.classList.contains('on');
      document.querySelectorAll('.s-btn').forEach(b => b.classList.remove('on'));
      if (!was) {
        btn.classList.add('on');
        toast('Sound', btn.dataset.s + ' (UI only)', 'cyan');
      }
    });
  });
}

/* ── Deep Focus ── */
window.enterDF = function () {
  document.body.classList.add('df');
  document.getElementById('exit-df-btn').style.display = 'flex';
  toast('Deep Focus', 'Nav hidden. Full focus.', 'purple');
};

window.exitDF = function () {
  document.body.classList.remove('df');
  document.getElementById('exit-df-btn').style.display = 'none';
};

function setupExitDF() {
  document.getElementById('exit-df-btn').style.display = 'none';
}

/* ── Global Exports ── */
window.go = go;
window.showModal = showModal;
window.hideModal = hideModal;
window.onOverlayClick = onOverlayClick;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.delTask = deleteTask;
window.dailyReset = dailyReset;
window.setMode = setMode;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.skipMode = skipMode;
window.openSettings = openSettings;
window.saveApiKey = saveApiKey;
window.saveName = saveName;
window.setDur = setDur;
window.resetAll = resetAll;
window.exportData = exportData;
window.importData = importData;
window.toggleNotifs = toggleNotifs;
window.sendAI = sendAI;
window.useChip = useChip;
window.clearChat = clearChat;
window.closeLevelUp = closeLevelUp;
window.aiKey = aiKey;
window.autoR = autoR;
window.go = go;
window.showModal = showModal;
window.hideModal = hideModal;
window.onOverlayClick = onOverlayClick;
window.dailyReset = dailyReset;
