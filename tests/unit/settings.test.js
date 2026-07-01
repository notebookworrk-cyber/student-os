import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('settings.js', () => {
  function setupSettingsDOM() {
    document.body.innerHTML =
      '<div id="toasts"></div>' +
      '<div id="set-modal">' +
        '<input id="set-name" />' +
        '<input id="api-key-inp" type="password" />' +
        '<div id="dur-row">' +
          '<button class="d-btn" data-d="15">15</button>' +
          '<button class="d-btn on" data-d="25">25</button>' +
          '<button class="d-btn" data-d="30">30</button>' +
          '<button class="d-btn" data-d="45">45</button>' +
        '</div>' +
        '<div id="provider-select">' +
          '<button class="provider-btn active" data-provider="anthropic">Claude</button>' +
          '<button class="provider-btn" data-provider="gemini">Gemini</button>' +
        '</div>' +
        '<div id="ai-status"></div>' +
        '<div id="ai-status-desc"></div>' +
        '<input id="notif-toggle" type="checkbox" />' +
      '</div>' +
      '<input id="uname-in" />' +
      '<section id="pg-home" class="page on"><div id="hm-greet-name"></div></section>' +
      '<div id="pinned-list"></div>' +
      '<div id="all-list"></div>' +
      '<div id="sh-list"></div>' +
      '<div id="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>' +
      '<div id="lu-overlay"><div id="lu-sub"></div><div id="lu-badge"></div></div>' +
      '<div id="confetti"></div>' +
      '<div id="ring-time"></div>' +
      '<div id="ring-lbl"></div>' +
      '<div id="ring-wrap" class="ring-wrap rm-focus"></div>' +
      '<svg><circle id="ring" r="108" /></svg>' +
      '<div id="mode-row">' +
        '<button class="mode-btn on" data-m="focus">Focus</button>' +
        '<button class="mode-btn" data-m="short">Short</button>' +
        '<button class="mode-btn" data-m="long">Long</button>' +
      '</div>' +
      '<div id="play-btn"><span id="play-ico">▶</span></div>';
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();
  });

  describe('openSettings', () => {
    it('populates name field from state', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().name = 'Alice';
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.openSettings();

      expect(document.getElementById('set-name').value).toBe('Alice');
    });

    it('populates API key field from state', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().settings.apiKey = 'sk-ant-test-key';
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.openSettings();

      expect(document.getElementById('api-key-inp').value).toBe('sk-ant-test-key');
    });

    it('shows the settings modal', async () => {
      setupSettingsDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.openSettings();

      expect(document.getElementById('set-modal').classList.contains('on')).toBe(true);
    });

    it('highlights current duration button', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().settings.dur = 30;
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.openSettings();

      expect(document.querySelector('[data-d="30"]').classList.contains('on')).toBe(true);
      expect(document.querySelector('[data-d="25"]').classList.contains('on')).toBe(false);
    });

    it('shows active provider', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().settings.provider = 'gemini';
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.openSettings();

      expect(document.querySelector('[data-provider="gemini"]').classList.contains('active')).toBe(true);
      expect(document.querySelector('[data-provider="anthropic"]').classList.contains('active')).toBe(false);
    });
  });

  describe('saveName', () => {
    it('saves name from input field to state', async () => {
      setupSettingsDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const settingsMod = await import('../../src/js/settings.js');
      document.getElementById('set-name').value = 'Bob';
      settingsMod.saveName();

      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getState().name).toBe('Bob');
    });

    it('does not save empty name', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const origName = stateMod.getState().name;
      const settingsMod = await import('../../src/js/settings.js');
      document.getElementById('set-name').value = '';

      settingsMod.saveName();

      expect(stateMod.getState().name).toBe(origName);
    });
  });

  describe('saveApiKey', () => {
    it('saves valid API key', async () => {
      setupSettingsDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const settingsMod = await import('../../src/js/settings.js');
      document.getElementById('api-key-inp').value = 'sk-ant-' + 'a'.repeat(20);
      settingsMod.saveApiKey();

      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getState().settings.apiKey).toBe('sk-ant-' + 'a'.repeat(20));
    });

    it('clears API key when empty', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().settings.apiKey = 'sk-ant-old-key';
      const settingsMod = await import('../../src/js/settings.js');
      document.getElementById('api-key-inp').value = '';

      settingsMod.saveApiKey();

      expect(stateMod.getState().settings.apiKey).toBe('');
    });

    it('rejects invalid key format', async () => {
      setupSettingsDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().settings.apiKey = 'sk-ant-old-key';
      const settingsMod = await import('../../src/js/settings.js');
      document.getElementById('api-key-inp').value = 'bad-key-format';

      settingsMod.saveApiKey();

      expect(stateMod.getState().settings.apiKey).toBe('sk-ant-old-key');
    });
  });

  describe('setDur', () => {
    it('updates duration setting', async () => {
      setupSettingsDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.setDur(30);

      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getState().settings.dur).toBe(30);
    });

    it('highlights selected duration button', async () => {
      setupSettingsDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const settingsMod = await import('../../src/js/settings.js');
      settingsMod.setDur(45);

      expect(document.querySelector('[data-d="45"]').classList.contains('on')).toBe(true);
    });
  });

  describe('exported functions', () => {
    it('exports all expected functions', async () => {
      const settingsMod = await import('../../src/js/settings.js');
      expect(typeof settingsMod.openSettings).toBe('function');
      expect(typeof settingsMod.saveName).toBe('function');
      expect(typeof settingsMod.saveApiKey).toBe('function');
      expect(typeof settingsMod.setDur).toBe('function');
      expect(typeof settingsMod.resetAll).toBe('function');
      expect(typeof settingsMod.exportData).toBe('function');
      expect(typeof settingsMod.importData).toBe('function');
      expect(typeof settingsMod.toggleNotifs).toBe('function');
      expect(typeof settingsMod.initSettings).toBe('function');
    });
  });
});
