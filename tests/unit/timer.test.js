import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('timer.js', () => {
  function setupTimerDOM() {
    document.body.innerHTML =
      '<div id="toasts"></div>' +
      '<div id="ring-time">25:00</div>' +
      '<div id="ring-lbl">FOCUS</div>' +
      '<div id="ring-wrap" class="ring-wrap rm-focus"></div>' +
      '<svg><circle id="ring" r="108" /></svg>' +
      '<div id="mode-row">' +
        '<button class="mode-btn on" data-m="focus">Focus</button>' +
        '<button class="mode-btn" data-m="short">Short</button>' +
        '<button class="mode-btn" data-m="long">Long</button>' +
      '</div>' +
      '<div id="play-btn"><span id="play-ico">▶</span></div>' +
      '<div id="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>' +
      '<div id="sh-list"></div>' +
      '<div id="confetti"></div>' +
      '<div id="lu-overlay"><div id="lu-sub"></div><div id="lu-badge"></div></div>';
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();
    vi.useRealTimers();
  });

  describe('getTimerState', () => {
    it('returns default timer state', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      const state = timerMod.getTimerState();
      expect(state).toHaveProperty('timerSec');
      expect(state).toHaveProperty('timerTotal');
      expect(state).toHaveProperty('timerMode');
      expect(state).toHaveProperty('timerRunning');
      expect(state.timerMode).toBe('focus');
      expect(state.timerRunning).toBe(false);
    });

    it('starts with 1500 seconds (25 min) for focus mode', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      const state = timerMod.getTimerState();
      expect(state.timerSec).toBe(1500);
      expect(state.timerTotal).toBe(1500);
    });
  });

  describe('setMode', () => {
    it('switches to short break mode (5 min)', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.setMode('short');
      const state = timerMod.getTimerState();
      expect(state.timerMode).toBe('short');
      expect(state.timerSec).toBe(300);
    });

    it('switches to long break mode (15 min)', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.setMode('long');
      const state = timerMod.getTimerState();
      expect(state.timerMode).toBe('long');
      expect(state.timerSec).toBe(900);
    });

    it('switches back to focus mode', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      timerMod.setMode('short');
      timerMod.setMode('focus');
      expect(timerMod.getTimerState().timerMode).toBe('focus');
      expect(timerMod.getTimerState().timerSec).toBe(1500);
    });
  });

  describe('toggleTimer', () => {
    it('starts the timer', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.toggleTimer();
      const state = timerMod.getTimerState();
      expect(state.timerRunning).toBe(true);
      expect(document.getElementById('play-ico').textContent).toBe('⏸');
    });

    it('pauses a running timer', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.toggleTimer();
      timerMod.toggleTimer();
      expect(timerMod.getTimerState().timerRunning).toBe(false);
      expect(document.getElementById('play-ico').textContent).toBe('▶');
    });
  });

  describe('resetTimer', () => {
    it('resets to initial duration', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.toggleTimer();
      timerMod.resetTimer();
      const state = timerMod.getTimerState();
      expect(state.timerRunning).toBe(false);
      expect(state.timerSec).toBe(1500);
    });

    it('resets ring display text', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.setMode('short');
      timerMod.resetTimer();

      expect(document.getElementById('ring-time').textContent).toBe('05:00');
    });
  });

  describe('skipMode', () => {
    it('switches to short break from focus mode', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.skipMode();
      expect(timerMod.getTimerState().timerMode).toBe('short');
    });

    it('switches to focus from break', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      timerMod.setMode('short');

      timerMod.skipMode();
      expect(timerMod.getTimerState().timerMode).toBe('focus');
    });

    it('switches to long break after 4 sessions', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().sessCount = 3;
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      timerMod.skipMode();
      expect(timerMod.getTimerState().timerMode).toBe('long');
    });
  });

  describe('timer display', () => {
    it('shows correct ring time for focus mode', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();

      expect(document.getElementById('ring-time').textContent).toBe('25:00');
    });

    it('shows correct ring time for short break', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      timerMod.setMode('short');

      expect(document.getElementById('ring-time').textContent).toBe('05:00');
    });
  });

  describe('renderDots', () => {
    it('renders session dots correctly', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.initTimer();
      expect(document.querySelectorAll('#dots .dot').length).toBe(4);
    });
  });

  describe('renderSessionHistory', () => {
    it('shows empty state when no sessions', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const timerMod = await import('../../src/js/timer.js');
      timerMod.renderSessionHistory();
      const shList = document.getElementById('sh-list');
      expect(shList.innerHTML).toContain('No sessions yet');
    });

    it('renders session items when sessions exist', async () => {
      setupTimerDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().sessions.push({ dur: 25, time: '10:00 AM', ts: Date.now() });
      stateMod.getState().sessions.push({ dur: 30, time: '11:00 AM', ts: Date.now() });
      const timerMod = await import('../../src/js/timer.js');
      timerMod.renderSessionHistory();
      const shList = document.getElementById('sh-list');
      expect(shList.querySelectorAll('.sh-item').length).toBe(2);
    });
  });
});
