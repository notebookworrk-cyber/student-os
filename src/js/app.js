import { load, getState, save, getToday, getLevelTitle, QUOTES, LVT, RING_C, MISSIONS, COACH_M } from './state.js';
import { initTasks, renderTasks, addTask, deleteTask, toggleTask, dailyReset, selectPriority, setFilter } from './tasks.js';
import { initTimer, setMode, toggleTimer, resetTimer, skipMode, renderDots, renderSessionHistory } from './timer.js';
import { initAI, sendAI, useChip, aiKey, autoR, clearChat } from './ai.js';
import { initSettings, openSettings, saveApiKey, saveName, setDur, resetAll, exportData, importData, toggleNotifs, saveUname } from './settings.js';
import { gainXP, checkAchievements, closeLevelUp, renderAchievements } from './gamification.js';
import { toast, showModal, hideModal, onOverlayClick, makeConfetti, formatTime, esc, floatXP } from './utils.js';

let curTab = 'home';
let timerRunning = false;

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
  setupExitDF();

  if (state.settings.notifs && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      import('./settings.js').then(m => m.scheduleStudyReminders());
      console.log('✅ Study reminders scheduled');
    } else {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          import('./settings.js').then(m => m.scheduleStudyReminders());
          console.log('✅ Study reminders scheduled (permission granted)');
        }
      });
    }
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

  app.innerHTML = `
<div class="bg-grid"></div>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>

<button class="btn btn-ghost exit-df" id="exit-df-btn" onclick="exitDF()">&#x26F6; Exit Deep Focus</button>
<div id="toasts"></div>

<!-- Level Up -->
<div id="lu-overlay">
  <div class="confetti-w" id="confetti"></div>
  <div class="lu-emoji">&#x1F3C6;</div>
  <div class="lu-title">LEVEL UP!</div>
  <div class="lu-sub" id="lu-sub">You reached a new level!</div>
  <div class="lu-badge" id="lu-badge">Level 1 &mdash; Rookie</div>
  <button class="btn btn-blue" style="margin-top:24px;font-size:15px;padding:13px 30px;border-radius:50px" onclick="closeLevelUp()">Let's Go &#x1F525;</button>
</div>

<!-- Task Modal -->
<div class="overlay" id="task-modal" onclick="onOverlayClick(event,'task-modal')">
  <div class="panel">
    <div class="panel-title">New Mission <button class="panel-close" onclick="hideModal('task-modal')">&#x2715;</button></div>
    <div class="f-group"><label class="f-label">Task Name</label><input class="f-input" id="t-name" placeholder="e.g. Solve 20 integration problems..." maxlength="80"></div>
    <div class="f-row">
      <div class="f-group"><label class="f-label">Subject</label>
        <select class="f-select" id="t-sub">
          <option value="math">Math</option><option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option><option value="english">English</option>
          <option value="history">History</option><option value="biology">Biology</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="f-group"><label class="f-label">Est. Time</label><input class="f-input" id="t-time" placeholder="30 min" maxlength="20"></div>
    </div>
    <div class="f-group"><label class="f-label">Priority</label>
      <div class="pri-row" id="pri-row">
        <button class="p-opt s-h" data-p="high" onclick="selectPriority('high')">&#x1F534; High</button>
        <button class="p-opt" data-p="medium" onclick="selectPriority('medium')">&#x1F7E1; Med</button>
        <button class="p-opt" data-p="low" onclick="selectPriority('low')">&#x1F7E2; Low</button>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn-ghost" style="flex:1" onclick="hideModal('task-modal')">Cancel</button>
      <button class="btn btn-blue" style="flex:1" onclick="addTask()">Add Mission</button>
    </div>
  </div>
</div>

<!-- Settings Modal -->
<div class="overlay" id="set-modal" onclick="onOverlayClick(event,'set-modal')">
  <div class="panel">
    <div class="panel-title">Settings <button class="panel-close" onclick="hideModal('set-modal')">&#x2715;</button></div>
    <div class="set-sec"><h4>Profile</h4>
      <div class="f-group"><label class="f-label">Display Name</label><input class="f-input" id="set-name" placeholder="Your name" maxlength="24"></div>
      <button class="btn btn-blue" style="width:100%" onclick="saveName()">Save Name</button>
    </div>
    <div class="set-sec"><h4>Focus Duration (minutes)</h4>
      <div class="dur-row" id="dur-row">
        <button class="d-btn" data-d="15" onclick="setDur(15)">15</button>
        <button class="d-btn" data-d="20" onclick="setDur(20)">20</button>
        <button class="d-btn on" data-d="25" onclick="setDur(25)">25</button>
        <button class="d-btn" data-d="30" onclick="setDur(30)">30</button>
        <button class="d-btn" data-d="45" onclick="setDur(45)">45</button>
        <button class="d-btn" data-d="60" onclick="setDur(60)">60</button>
      </div>
    </div>
    <div class="set-sec"><h4>AI API Key</h4>
      <p style="font-size:11px;color:var(--t3);margin-bottom:10px;line-height:1.5">Add your <a href="https://console.anthropic.com" target="_blank" style="color:var(--purple)">Anthropic API key</a> to unlock real Claude AI. Without it, local answers are used.</p>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="f-input" id="api-key-inp" type="password" placeholder="sk-ant-api03-..." maxlength="120" style="font-family:var(--fm);font-size:12px;letter-spacing:.5px">
        <button class="btn btn-blue" style="flex-shrink:0;padding:10px 14px" onclick="saveApiKey()">Save</button>
      </div>
      <div id="ai-status" style="font-size:11px;margin-top:7px;color:var(--t3)"></div>
    </div>
    <div class="set-sec"><h4>AI Provider</h4>
      <div id="provider-select">
        <button class="provider-btn active" data-provider="anthropic">Claude (Anthropic)</button>
        <button class="provider-btn" data-provider="gemini">Gemini (Google)</button>
      </div>
      <p style="font-size:11px;color:var(--t3);margin-top:8px;line-height:1.5">Switch between AI providers. API keys are provider-specific.</p>
    </div>
    <div class="set-sec"><h4>Preferences</h4>
      <div class="set-row">
        <label>Study Reminders</label>
        <label class="tgl"><input type="checkbox" id="notif-toggle" onchange="toggleNotifs(this.checked)"><span class="tgl-track"></span></label>
      </div>
      <p style="font-size:11px;color:var(--t3);margin-top:6px;line-height:1.5">Get nudged when you haven't studied. Only fires between 7am&ndash;10pm.</p>
    </div>
    <div class="set-sec"><h4>About</h4>
      <div class="set-row"><label>Version</label><span style="color:var(--t3);font-family:var(--fm);font-size:11px">v4.0.0</span></div>
    </div>
    <div class="set-sec"><h4>Backup &amp; Restore</h4>
      <div style="display:flex;gap:10px;margin-bottom:8px">
        <button class="btn btn-ghost" style="flex:1;font-size:13px" onclick="exportData()">&#x2B07; Export</button>
        <button class="btn btn-ghost" style="flex:1;font-size:13px" onclick="importData()">&#x2B06; Import</button>
      </div>
      <p style="font-size:11px;color:var(--t3);line-height:1.5">Export saves XP, tasks &amp; progress as JSON. Import restores from a backup.</p>
    </div>
    <div class="set-sec"><h4>Danger Zone</h4>
      <button class="btn btn-red" style="width:100%" onclick="resetAll()">Reset All Data</button>
    </div>
  </div>
</div>

<div id="app-inner">
  <nav id="nav-mobile">
    <button class="mn-item on" data-t="home" onclick="go('home',this)">
      <svg viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4.1-2.8.1-4.2.1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2.1-2.4.2-3.6.2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9.1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>Home
    </button>
    <button class="mn-item" data-t="dash" onclick="go('dash',this)">
      <svg viewBox="0 0 576 512"><path d="M304 240l0-223.4c0-9 7-16.6 16-16.6C443.7 0 544 100.3 544 224c0 9-7.6 16-16.6 16L304 240zM32 272C32 150.7 122.1 50.3 239 34.3c9.2-1.3 17 5.9 17 15.2L256 288 412.5 444.5c6.7 6.7 6.2 17.7-1.5 23.1C371.8 495.6 323.8 512 272 512C139.5 512 32 404.6 32 272zm526.4 16c9.3 0 16.5 7.8 15.2 17c-7.7 55.5-34.6 105-73.2 142.4c-6.4 6.1-16.6 5.5-22.6-.9L320 288l238.4 0z"/></svg>Dash
    </button>
    <button class="mn-item" data-t="focus" onclick="go('focus',this)">
      <svg viewBox="0 0 448 512"><path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-104-76.3-190.2-176-205.6l0-34.4 16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>Focus
    </button>
    <button class="mn-item" data-t="tasks" onclick="go('tasks',this)">
      <svg viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg>Tasks
    </button>
    <button class="mn-item" data-t="prog" onclick="go('prog',this)">
      <svg viewBox="0 0 512 512"><path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg>Progress
    </button>
    <button class="mn-item" data-t="ai" onclick="go('ai',this)">
      <svg viewBox="0 0 640 512"><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-240 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm144 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm-144-64c-8.8 0-16 7.2-16 16s7.2 16 16 16l224 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-224 0zM256 256a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm160-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM0 336c0-26.5 21.5-48 48-48l16 0 0 128-16 0c-26.5 0-48-21.5-48-48l0-32zm576 32c0 26.5-21.5 48-48 48l-16 0 0-128 16 0c26.5 0 48 21.5 48 48l0 32z"/></svg>AI Help
    </button>
  </nav>

  <nav id="nav-desktop">
    <div class="logo-w">Student <span>OS</span></div>
    <button class="sd-item on" data-t="home" onclick="go('home',this)"><svg viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4.1-2.8.1-4.2.1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2.1-2.4.2-3.6.2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9.1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg> Home</button>
    <button class="sd-item" data-t="dash" onclick="go('dash',this)"><svg viewBox="0 0 576 512"><path d="M304 240l0-223.4c0-9 7-16.6 16-16.6C443.7 0 544 100.3 544 224c0 9-7.6 16-16.6 16L304 240zM32 272C32 150.7 122.1 50.3 239 34.3c9.2-1.3 17 5.9 17 15.2L256 288 412.5 444.5c6.7 6.7 6.2 17.7-1.5 23.1C371.8 495.6 323.8 512 272 512C139.5 512 32 404.6 32 272zm526.4 16c9.3 0 16.5 7.8 15.2 17c-7.7 55.5-34.6 105-73.2 142.4c-6.4 6.1-16.6 5.5-22.6-.9L320 288l238.4 0z"/></svg> Dashboard</button>
    <button class="sd-item" data-t="focus" onclick="go('focus',this)"><svg viewBox="0 0 448 512"><path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l16 0 0 34.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-104-76.3-190.2-176-205.6l0-34.4 16 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L176 0zm72 192l0 128c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-128c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg> Focus</button>
    <button class="sd-item" data-t="tasks" onclick="go('tasks',this)"><svg viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg> Tasks</button>
    <button class="sd-item" data-t="prog" onclick="go('prog',this)"><svg viewBox="0 0 512 512"><path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg> Progress</button>
    <button class="sd-item" data-t="ai" onclick="go('ai',this)"><svg viewBox="0 0 640 512"><path d="M320 0c17.7 0 32 14.3 32 32l0 64 120 0c39.8 0 72 32.2 72 72l0 272c0 39.8-32.2 72-72 72l-240 0c-39.8 0-72-32.2-72-72l0-272c0-39.8 32.2-72 72-72l120 0 0-64c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm144 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-32 0zm-144-64c-8.8 0-16 7.2-16 16s7.2 16 16 16l224 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-224 0zM256 256a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm160-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM0 336c0-26.5 21.5-48 48-48l16 0 0 128-16 0c-26.5 0-48-21.5-48-48l0-32zm576 32c0 26.5-21.5 48-48 48l-16 0 0-128 16 0c26.5 0 48 21.5 48 48l0 32z"/></svg> AI Help</button>
  </nav>

  <main id="main">

    <!-- HOME -->
    <section class="page on" id="pg-home">
      <div class="home-pg">
        <div class="hm-top">
          <div>
            <div class="hm-greet-time" id="hm-greet-time">Good morning</div>
            <div class="hm-greet-name" id="hm-greet-name">Student</div>
          </div>
          <button class="hm-set-btn" onclick="openSettings()">&#x2699;</button>
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

        <button class="hm-cta" onclick="go('focus',null)">
          &#x1F525; Start Focus Session
        </button>

        <div class="hm-quick">
          <button class="hm-qbtn" onclick="showModal('task-modal')">&#x2795; Add Task</button>
          <button class="hm-qbtn" onclick="go('tasks',null)">&#x1F4CB; View Tasks</button>
        </div>

        <div class="hm-chips">
          <div class="hm-chip">
            <div class="hm-chip-val" id="hm-streak" style="color:var(--amber)">0</div>
            <div class="hm-chip-lbl">Streak</div>
          </div>
          <div class="hm-chip">
            <div class="hm-chip-val" id="hm-sessions" style="color:var(--blue)">0</div>
            <div class="hm-chip-lbl">Sessions</div>
          </div>
          <div class="hm-chip">
            <div class="hm-chip-val" id="hm-done" style="color:var(--green)">0</div>
            <div class="hm-chip-lbl">Done Today</div>
          </div>
        </div>

        <div class="hm-coach">
          <div class="hm-coach-av">&#x1F916;</div>
          <div class="hm-coach-txt" id="hm-coach">Analyzing your study patterns...</div>
        </div>
      </div>
    </section>

    <!-- DASHBOARD -->
    <section class="page" id="pg-dash">
      <div class="pg-head">
        <div>
          <div class="pg-greet" id="greet"></div>
          <div class="pg-title">Hey, <input class="uname-in" id="uname-in" value="Student" onblur="saveUname()" onkeydown="if(event.key==='Enter')this.blur()" maxlength="20"></div>
        </div>
        <button class="btn btn-ghost" onclick="openSettings()" style="align-self:flex-start;margin-top:22px">&#x2699; Settings</button>
      </div>
      <div class="dbg">
        <div class="card sc c-amber"><div class="sc-lbl">&#x1F525; Streak</div><div class="sc-val" id="d-streak">0</div><div class="sc-sub">days in a row</div></div>
        <div class="card sc c-cyan"><div class="sc-lbl">&#x2B50; Total XP</div><div class="sc-val" id="d-xp">0</div><div class="sc-sub">points earned</div></div>
        <div class="card sc c-purple"><div class="sc-lbl">&#x1F3C6; Level</div><div class="sc-val" id="d-level">1</div><div class="sc-sub" id="d-ltitle">Rookie</div></div>
        <div class="card sc c-green"><div class="sc-lbl">&#x2705; Done Today</div><div class="sc-val" id="d-done">0</div><div class="sc-sub">tasks today</div></div>
        <div class="card sc c-blue"><div class="sc-lbl">&#x23F0; Focus Min</div><div class="sc-val" id="d-fmin">0</div><div class="sc-sub">minutes today</div></div>
        <div class="card quote-card" style="grid-column:1/-1"><p id="quote-el"></p></div>
        <div class="qa-row" style="grid-column:1/-1">
          <button class="btn btn-blue" onclick="go('focus',null)">&#x25B6; Start Focus</button>
          <button class="btn btn-ghost" onclick="showModal('task-modal')">+ Add Task</button>
        </div>
        <div class="card week-card" style="grid-column:1/-1">
          <div class="sec-ttl" style="margin-bottom:10px">This Week</div>
          <div class="week-row" id="week-row"></div>
        </div>
      </div>
    </section>

    <!-- FOCUS -->
    <section class="page" id="pg-focus">
      <div class="focus-wrap">
        <div class="focus-title">Focus Mode</div>
        <div class="mode-row" id="mode-row">
          <button class="mt on" data-m="focus" onclick="setMode('focus')">&#x23F1; Focus</button>
          <button class="mt" data-m="short" onclick="setMode('short')">&#x2615; Short</button>
          <button class="mt" data-m="long" onclick="setMode('long')">&#x1F319; Long</button>
        </div>
        <div class="ring-wrap rm-focus" id="ring-wrap">
          <svg class="ring-svg" viewBox="0 0 250 250">
            <circle class="ring-bg" cx="125" cy="125" r="108"/>
            <circle class="ring-prog" id="ring" cx="125" cy="125" r="108" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/>
          </svg>
          <div class="ring-inner">
            <div class="ring-time" id="ring-time">25:00</div>
            <div class="ring-lbl" id="ring-lbl">FOCUS</div>
          </div>
        </div>
        <div class="ctrl-row">
          <button class="c-btn c-btn-sm" onclick="resetTimer()">&#x21BA;</button>
          <button class="c-btn c-btn-main" id="play-btn" onclick="toggleTimer()"><span id="play-ico">&#x25B6;</span></button>
          <button class="c-btn c-btn-sm" onclick="skipMode()">&#x23ED;</button>
        </div>
        <div class="dots-row">
          <div class="dots-lbl">Session Progress</div>
          <div class="dots" id="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
        </div>
        <div class="sound-row">
          <button class="s-btn" onclick="tgSound(this)" data-s="rain">&#x1F327; Rain</button>
          <button class="s-btn" onclick="tgSound(this)" data-s="waves">&#x1F30A; Waves</button>
          <button class="s-btn" onclick="tgSound(this)" data-s="white">&#x25A1; Noise</button>
        </div>
        <div class="sh-list"><h4>Recent Sessions</h4><div id="sh-list"></div></div>
        <button class="btn btn-ghost deep-btn" onclick="enterDF()">&#x1F319; Deep Focus</button>
      </div>
    </section>

    <!-- TASKS -->
    <section class="page" id="pg-tasks">
      <div class="tasks-wrap">
        <div class="tasks-head">
          <div class="pg-title" style="font-family:var(--fh);font-size:21px;font-weight:800;letter-spacing:-.3px">Daily Missions</div>
          <button class="btn btn-blue" onclick="showModal('task-modal')">+ New</button>
        </div>
        <div class="filter-row">
          <div class="ftabs" id="ftabs">
            <button class="ftab on" onclick="setFilter('all',this)">All</button>
            <button class="ftab" onclick="setFilter('active',this)">Active</button>
            <button class="ftab" onclick="setFilter('completed',this)">Done</button>
            <button class="ftab" onclick="setFilter('physics',this)">Physics</button>
            <button class="ftab" onclick="setFilter('math',this)">Math</button>
          </div>
          <button class="btn btn-ghost" style="font-size:11.5px;padding:5px 11px" onclick="dailyReset()">&#x21BA; Reset</button>
        </div>
        <div class="sec-ttl">Pinned</div><div id="pinned-list"></div>
        <div style="margin-top:18px"><div class="sec-ttl">All Tasks</div><div id="all-list"></div></div>
      </div>
    </section>

    <!-- PROGRESS -->
    <section class="page" id="pg-prog">
      <div class="prog-wrap">
        <div class="pg-title" style="font-family:var(--fh);font-size:21px;font-weight:800;margin-bottom:16px;letter-spacing:-.3px">Your Progress</div>
        <div class="card xp-card">
          <div class="xp-top">
            <div class="lv-badge"><span class="lv-num" id="p-lv">LV 1</span><span class="lv-title-t" id="p-title">Rookie</span></div>
            <div class="xp-nums"><b id="p-cur">0</b> / <b id="p-max">100</b> XP</div>
          </div>
          <div class="xp-bar-out"><div class="xp-bar-in" id="xp-bar" style="width:0%"></div></div>
        </div>
        <div class="sg">
          <div class="card ms"><div class="ms-val" id="ps-xp" style="color:var(--cyan)">0</div><div class="ms-lbl">Total XP</div></div>
          <div class="card ms"><div class="ms-val" id="ps-sess" style="color:var(--blue)">0</div><div class="ms-lbl">Sessions</div></div>
          <div class="card ms"><div class="ms-val" id="ps-tasks" style="color:var(--green)">0</div><div class="ms-lbl">Tasks Done</div></div>
          <div class="card ms"><div class="ms-val" id="ps-mins" style="color:var(--purple)">0</div><div class="ms-lbl">Focus Mins</div></div>
          <div class="card ms"><div class="ms-val" id="ps-best" style="color:var(--amber)">0</div><div class="ms-lbl">Best Streak</div></div>
          <div class="card ms"><div class="ms-val" id="ps-lv" style="color:var(--pink)">1</div><div class="ms-lbl">Level</div></div>
        </div>
        <div class="card bar-card"><div class="sec-ttl" style="margin-bottom:0">Weekly XP</div><div class="bar-wrap" id="bar-wrap"></div></div>
        <div class="card hm30-card"><div class="sec-ttl" style="margin-bottom:0">30-Day Activity</div><div class="hm30" id="hm30"></div></div>
        <div class="card ach-card"><div class="sec-ttl" style="margin-bottom:0">Achievements</div><div class="ach-grid" id="ach-grid"></div></div>
      </div>
    </section>

    <!-- AI HELP -->
    <section class="page" id="pg-ai">
      <div class="ai-shell">
        <div class="ai-head">
          <h2>&#x1F916; AI Study Help</h2>
          <div class="ai-head-sub">Ask anything. I'll actually explain it.</div>
          <button class="btn btn-ghost" style="margin-top:10px;font-size:12px;padding:5px 11px" onclick="clearChat()">Clear chat</button>
        </div>
        <div class="chips">
          <button class="chip" onclick="useChip(this)">Newton's Laws</button>
          <button class="chip" onclick="useChip(this)">Photosynthesis</button>
          <button class="chip" onclick="useChip(this)">Opportunity cost</button>
          <button class="chip" onclick="useChip(this)">Recursion</button>
          <button class="chip" onclick="useChip(this)">Gravity</button>
          <button class="chip" onclick="useChip(this)">Osmosis</button>
          <button class="chip" onclick="useChip(this)">Derivatives</button>
          <button class="chip" onclick="useChip(this)">Mitosis vs Meiosis</button>
          <button class="chip" onclick="useChip(this)">Acids and bases</button>
          <button class="chip" onclick="useChip(this)">Ohm's Law</button>
          <button class="chip" onclick="useChip(this)">Supply and demand</button>
          <button class="chip" onclick="useChip(this)">Quadratic formula</button>
        </div>
        <div class="msgs" id="msgs"></div>
        <div class="ai-inp-area">
          <div class="ai-inp-row">
            <textarea class="ai-inp" id="ai-inp" rows="1" placeholder="Ask anything..." onkeydown="aiKey(event)" oninput="autoR(this)"></textarea>
            <button class="ai-send" onclick="sendAI()">&#x27A4;</button>
          </div>
        </div>
      </div>
    </section>

  </main>
</div>

<button id="pwa-install-btn" onclick="installPWA()" style="display:none;position:fixed;bottom:calc(var(--nh)+16px);left:50%;transform:translateX(-50%);z-index:300;align-items:center;gap:8px;padding:10px 20px;background:linear-gradient(135deg,var(--purple),var(--blue));color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:50px;font-family:var(--fh);font-size:13px;font-weight:700;box-shadow:0 8px 28px rgba(139,92,246,.4);cursor:pointer;white-space:nowrap">
  &#x1F4F2; Install App
</button>
`;

  document.body.prepend(app.querySelector('#exit-df-btn'));
  document.body.appendChild(app.querySelector('#lu-overlay'));
  document.body.appendChild(app.querySelector('#pwa-install-btn'));
}


function setupNavigation() {
  document.querySelectorAll('.mn-item, .sd-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.closest('.mn-item, .sd-item')) {
        const tab = btn.dataset.t;
        if (tab) go(tab, btn);
      }
    });
  });
}

export function go(tab, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const pg = document.getElementById('pg-' + tab);
  if (!pg) return;
  pg.classList.add('on');

  document.querySelectorAll('.mn-item, .sd-item').forEach(n => n.classList.remove('on'));
  document.querySelectorAll('[data-t="' + tab + '"]').forEach(n => n.classList.add('on'));

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
window.tgSound = function (btn) {
  const was = btn.classList.contains('on');
  document.querySelectorAll('.s-btn').forEach(b => b.classList.remove('on'));
  if (!was) {
    btn.classList.add('on');
    toast('Sound', btn.dataset.s + ' (UI only)', 'cyan');
  }
};

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
window.closeLevelUp = closeLevelUp;
window.onOverlayClick = onOverlayClick;
window.hideModal = hideModal;
window.selectPriority = selectPriority;
window.addTask = addTask;
window.saveName = saveName;
window.saveApiKey = saveApiKey;
window.sendAI = sendAI;
window.useChip = useChip;
window.clearChat = clearChat;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.skipMode = skipMode;
window.setMode = setMode;
window.enterDF = enterDF;
window.exitDF = exitDF;
window.installPWA = installPWA;
window.go = go;
window.showModal = showModal;
window.setFilter = setFilter;
window.dailyReset = dailyReset;
window.toggleNotifs = toggleNotifs;
window.exportData = exportData;
window.importData = importData;
window.resetAll = resetAll;
window.saveUname = saveUname;
window.tgSound = tgSound;
window.aiKey = aiKey;
window.autoR = autoR;
