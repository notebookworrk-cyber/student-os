import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('gamification.js', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML =
      '<div id="toasts"></div>' +
      '<div id="lu-overlay"><div id="lu-sub"></div><div id="lu-badge"></div></div>' +
      '<div id="confetti"></div>' +
      '<div id="ach-grid"></div>' +
      '<section id="pg-focus" class="page on"></section>';
    vi.resetModules();
  });

  describe('gainXP', () => {
    it('adds XP to state', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(50, 100, 100);
      expect(stateMod.getState().xp).toBe(50);
    });

    it('records XP in today activity', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(30, 100, 100);
      expect(stateMod.getState().activity[stateMod.getToday()]).toBe(30);
    });

    it('accumulates XP when added multiple times', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(25, 100, 100);
      gamMod.gainXP(25, 100, 100);
      expect(stateMod.getState().activity[stateMod.getToday()]).toBe(50);
    });
  });

  describe('level thresholds', () => {
    it('starts at level 1 with 0 XP', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      expect(stateMod.getState().level).toBe(1);
      expect(stateMod.getState().xp).toBe(0);
    });

    it('reaches level 2 at 100 XP', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(100, 100, 100);
      expect(stateMod.getState().level).toBe(2);
    });

    it('reaches level 5 at 400 XP', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(400, 100, 100);
      expect(stateMod.getState().level).toBe(5);
    });

    it('caps at level 10', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(2000, 100, 100);
      expect(stateMod.getState().level).toBe(10);
      expect(stateMod.getState().xp).toBe(2000);
    });

    it('calculates XP within current level correctly', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(150, 100, 100);
      expect(stateMod.getState().level).toBe(2);
      expect(stateMod.getState().xp).toBe(150);
    });
  });

  describe('checkAchievements', () => {
    it('unlocks firstFocus when sessions exist', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().sessions.push({ dur: 25 });
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.checkAchievements();
      expect(stateMod.getState().achievements.firstFocus).toBe(true);
    });

    it('unlocks xp100 at 100+ XP', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(100, 100, 100);
      expect(stateMod.getState().achievements.xp100).toBe(true);
    });

    it('unlocks tasks10 at 10 tasks done', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().totalTasksDone = 10;
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.checkAchievements();
      expect(stateMod.getState().achievements.tasks10).toBe(true);
    });

    it('unlocks focus1hr at 60+ total focus minutes', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().sessions.push({ dur: 30 }, { dur: 30 });
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.checkAchievements();
      expect(stateMod.getState().achievements.focus1hr).toBe(true);
    });

    it('unlocks level5 at level 5+', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.gainXP(400, 100, 100);
      expect(stateMod.getState().achievements.level5).toBe(true);
    });

    it('unlocks streak7 at 7+ day streak', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().streak = 7;
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.checkAchievements();
      expect(stateMod.getState().achievements.streak7).toBe(true);
    });

    it('does not unlock achievements that are not yet earned', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.checkAchievements();
      expect(stateMod.getState().achievements.firstFocus).toBe(false);
      expect(stateMod.getState().achievements.streak7).toBe(false);
      expect(stateMod.getState().achievements.xp100).toBe(false);
    });
  });

  describe('renderAchievements', () => {
    it('renders achievement cards in the grid', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.renderAchievements();
      const grid = document.getElementById('ach-grid');
      expect(grid.children.length).toBe(6);
      expect(grid.querySelector('.ach')).toBeTruthy();
      expect(grid.querySelector('.ach-nm').textContent).toBe('First Focus');
    });

    it('marks unlocked achievements', async () => {
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      stateMod.getState().achievements.firstFocus = true;
      stateMod.getState().achievements.xp100 = true;
      const gamMod = await import('../../src/js/gamification.js');
      gamMod.renderAchievements();
      const grid = document.getElementById('ach-grid');
      expect(grid.querySelectorAll('.unlocked').length).toBe(2);
      expect(grid.querySelectorAll('.locked').length).toBe(4);
    });
  });

  describe('closeLevelUp', () => {
    it('removes on class from overlay', async () => {
      const gamMod = await import('../../src/js/gamification.js');
      const overlay = document.getElementById('lu-overlay');
      overlay.classList.add('on');
      gamMod.closeLevelUp();
      expect(overlay.classList.contains('on')).toBe(false);
    });
  });
});
