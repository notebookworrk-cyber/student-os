import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('state.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getState', () => {
    it('returns defaults after load with empty localStorage', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const state = stateMod.getState();
      expect(state.name).toBe('Student');
      expect(state.xp).toBe(0);
      expect(state.level).toBe(1);
      expect(state.streak).toBe(1);
      expect(state.settings.dur).toBe(25);
      expect(state.settings.apiKey).toBe('');
      expect(state.settings.notifs).toBe(false);
      expect(state.settings.provider).toBe('anthropic');
      expect(state.achievements.firstFocus).toBe(false);
      expect(state.achievements.streak7).toBe(false);
    });

    it('initializes streak to 1 on first load', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const state = stateMod.getState();
      expect(state.lastDate).toBe(new Date().toDateString());
      expect(state.streak).toBe(1);
    });

    it('initializes today activity to 0 on first load', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const state = stateMod.getState();
      expect(state.activity[new Date().toDateString()]).toBe(0);
    });
  });

  describe('save', () => {
    it('persists state to localStorage', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().name = 'TestUser';
      stateMod.save();

      const raw = JSON.parse(localStorage.getItem('sos4'));
      expect(raw.name).toBe('TestUser');
      expect(raw.xp).toBe(0);
    });

    it('overwrites existing localStorage data', async () => {
      localStorage.setItem('sos4', JSON.stringify({ name: 'Old', xp: 50 }));
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();

      expect(stateMod.getState().name).toBe('Old');
      expect(stateMod.getState().xp).toBe(50);

      stateMod.getState().name = 'New';
      stateMod.save();

      const raw = JSON.parse(localStorage.getItem('sos4'));
      expect(raw.name).toBe('New');
    });

    it('merges saved data with defaults on load', async () => {
      localStorage.setItem('sos4', JSON.stringify({
        name: 'Alice',
        xp: 150,
        tasks: [{ id: 1, name: 'Test' }]
      }));
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const state = stateMod.getState();
      expect(state.name).toBe('Alice');
      expect(state.xp).toBe(150);
      expect(state.level).toBe(1);
      expect(state.settings.dur).toBe(25);
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].name).toBe('Test');
    });
  });

  describe('getToday', () => {
    it('returns current date as a date string', async () => {
      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getToday()).toBe(new Date().toDateString());
    });
  });

  describe('getLevelTitle', () => {
    it('returns Legend for level 0 (falsy fallback)', async () => {
      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getLevelTitle(0)).toBe('Legend');
    });

    it('returns correct title for each level 1-10', async () => {
      const stateMod = await import('../../src/js/state.js');
      const expected = ['', 'Rookie', 'Learner', 'Focused', 'Disciplined',
        'Grinder', 'Hustler', 'Scholar', 'Beast', 'Unstoppable', 'Legend'];
      for (let level = 1; level <= 10; level++) {
        expect(stateMod.getLevelTitle(level)).toBe(expected[level]);
      }
    });

    it('returns Legend for levels beyond 10', async () => {
      const stateMod = await import('../../src/js/state.js');
      expect(stateMod.getLevelTitle(11)).toBe('Legend');
      expect(stateMod.getLevelTitle(100)).toBe('Legend');
    });
  });

  describe('setState', () => {
    it('updates state with partial object and persists', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.setState({ name: 'Bob', xp: 50 });
      expect(stateMod.getState().name).toBe('Bob');
      expect(stateMod.getState().xp).toBe(50);

      const raw = JSON.parse(localStorage.getItem('sos4'));
      expect(raw.name).toBe('Bob');
    });
  });

  describe('exports', () => {
    it('LVT has 11 entries', async () => {
      const { LVT } = await import('../../src/js/state.js');
      expect(LVT).toHaveLength(11);
      expect(LVT[1]).toBe('Rookie');
    });

    it('ACH_D has 6 achievements', async () => {
      const { ACH_D } = await import('../../src/js/state.js');
      expect(ACH_D).toHaveLength(6);
      expect(ACH_D[0]).toEqual({ id: 'firstFocus', ico: '🎯', name: 'First Focus', tip: 'Complete 1 session' });
    });

    it('DEFAULTS has correct structure', async () => {
      const { DEFAULTS } = await import('../../src/js/state.js');
      expect(DEFAULTS.level).toBe(1);
      expect(DEFAULTS.xp).toBe(0);
      expect(DEFAULTS.streak).toBe(0);
      expect(DEFAULTS.tasks).toEqual([]);
      expect(DEFAULTS.sessions).toEqual([]);
      expect(DEFAULTS.settings.dur).toBe(25);
    });

    it('QUOTES has 10 entries', async () => {
      const { QUOTES } = await import('../../src/js/state.js');
      expect(QUOTES).toHaveLength(10);
    });

    it('SICO has subject icons', async () => {
      const { SICO } = await import('../../src/js/state.js');
      expect(SICO.math).toBe('📐');
      expect(SICO.physics).toBe('⚛️');
    });

    it('RING_C is calculated correctly', async () => {
      const { RING_C } = await import('../../src/js/state.js');
      expect(RING_C).toBe(2 * Math.PI * 108);
    });
  });
});
