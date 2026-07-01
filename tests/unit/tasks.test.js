import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('tasks.js', () => {
  function setupTaskDOM() {
    document.body.innerHTML =
      '<div id="toasts"></div>' +
      '<div id="task-modal">' +
        '<input id="t-name" />' +
        '<select id="t-sub"><option value="math">Math</option></select>' +
        '<input id="t-time" />' +
        '<div id="pri-row">' +
          '<button class="chip s-h on" data-p="high">High</button>' +
          '<button class="chip" data-p="medium">Med</button>' +
          '<button class="chip" data-p="low">Low</button>' +
        '</div>' +
        '<div id="ftabs">' +
          '<button class="chip on" data-f="all">All</button>' +
          '<button class="chip" data-f="active">Active</button>' +
          '<button class="chip" data-f="completed">Done</button>' +
        '</div>' +
      '</div>' +
      '<div id="pinned-list"></div>' +
      '<div id="all-list"></div>';
    window.hideModal = vi.fn();
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();
  });

  describe('addTask', () => {
    it('rejects empty task name with visual feedback', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      const nameEl = document.getElementById('t-name');
      nameEl.value = '';

      tasksMod.addTask();

      expect(nameEl.style.borderColor).toBeTruthy();
    });

    it('creates task with correct structure', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      document.getElementById('t-name').value = 'Read chapter 5';

      tasksMod.addTask();

      expect(stateMod.getState().tasks).toHaveLength(1);
      expect(stateMod.getState().tasks[0].name).toBe('Read chapter 5');
      expect(stateMod.getState().tasks[0].pri).toBe('high');
      expect(stateMod.getState().tasks[0].done).toBe(false);
      expect(stateMod.getState().tasks[0].sub).toBe('math');
      expect(typeof stateMod.getState().tasks[0].id).toBe('number');
    });

    it('pins task if fewer than 3 pinned', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      document.getElementById('t-name').value = 'Pinned task';

      tasksMod.addTask();

      expect(stateMod.getState().tasks[0].pinned).toBe(true);
    });
  });

  describe('toggleTask', () => {
    it('marks task as done', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push({
        id: 1, name: 'Test', sub: 'math', pri: 'high',
        done: false, doneDate: null, pinned: true, time: '—'
      });

      tasksMod.toggleTask(1);

      expect(stateMod.getState().tasks[0].done).toBe(true);
      expect(stateMod.getState().tasks[0].doneDate).toBeTruthy();
    });

    it('increments totalTasksDone when completing', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push({
        id: 2, name: 'Another', sub: 'physics', pri: 'low',
        done: false, doneDate: null, pinned: false, time: '—'
      });

      tasksMod.toggleTask(2);

      expect(stateMod.getState().totalTasksDone).toBe(1);
    });

    it('unmarks a done task', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push({
        id: 3, name: 'Done task', sub: 'math', pri: 'high',
        done: true, doneDate: new Date().toDateString(), pinned: false, time: '—'
      });
      stateMod.getState().totalTasksDone = 1;

      tasksMod.toggleTask(3);

      expect(stateMod.getState().tasks[0].done).toBe(false);
      expect(stateMod.getState().totalTasksDone).toBe(0);
    });

    it('does nothing for non-existent task', async () => {
      setupTaskDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const tasksMod = await import('../../src/js/tasks.js');
      expect(() => tasksMod.toggleTask(999)).not.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('removes a task by id', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push(
        { id: 1, name: 'First', sub: 'math', pri: 'high', done: false, pinned: false, time: '—' },
        { id: 2, name: 'Second', sub: 'physics', pri: 'low', done: false, pinned: false, time: '—' }
      );

      tasksMod.deleteTask(1);

      expect(stateMod.getState().tasks).toHaveLength(1);
      expect(stateMod.getState().tasks[0].name).toBe('Second');
    });

    it('does nothing for non-existent id', async () => {
      setupTaskDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const tasksMod = await import('../../src/js/tasks.js');
      expect(() => tasksMod.deleteTask(999)).not.toThrow();
    });
  });

  describe('selectPriority', () => {
    it('adds visual class to selected priority button', async () => {
      setupTaskDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const tasksMod = await import('../../src/js/tasks.js');

      tasksMod.selectPriority('low');

      const btn = document.querySelector('[data-p="low"]');
      expect(btn.className).toContain('s-l');
    });

    it('removes active class from other buttons', async () => {
      setupTaskDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const tasksMod = await import('../../src/js/tasks.js');
      document.querySelector('[data-p="high"]').className = 'p-opt s-h';

      tasksMod.selectPriority('medium');

      expect(document.querySelector('[data-p="high"]').className).not.toContain('s-h');
    });
  });

  describe('renderTasks', () => {
    it('renders task items in all list', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push(
        { id: 1, name: 'A', sub: 'math', pri: 'high', done: false, pinned: false, time: '—' },
        { id: 2, name: 'B', sub: 'physics', pri: 'low', done: true, pinned: false, time: '—' }
      );

      tasksMod.renderTasks();

      const allList = document.getElementById('all-list');
      const items = allList.querySelectorAll('.task-item');
      expect(items.length).toBe(2);
    });

    it('shows empty state when no tasks', async () => {
      setupTaskDOM();
      await import('../../src/js/state.js').then(m => m.load());
      const tasksMod = await import('../../src/js/tasks.js');

      tasksMod.renderTasks();

      const allList = document.getElementById('all-list');
      expect(allList.innerHTML).toContain('No tasks');
    });

    it('filters active tasks', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push(
        { id: 1, name: 'Active', sub: 'math', pri: 'high', done: false, pinned: false, time: '—' },
        { id: 2, name: 'Done', sub: 'physics', pri: 'low', done: true, pinned: false, time: '—' }
      );

      const activeBtn = document.querySelector('[data-f="active"]');
      tasksMod.setFilter('active', activeBtn);

      const allList = document.getElementById('all-list');
      const items = allList.querySelectorAll('.task-item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Active');
    });

    it('filters completed tasks', async () => {
      setupTaskDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      const tasksMod = await import('../../src/js/tasks.js');
      stateMod.getState().tasks.push(
        { id: 1, name: 'Active', sub: 'math', pri: 'high', done: false, pinned: false, time: '—' },
        { id: 2, name: 'Done', sub: 'physics', pri: 'low', done: true, pinned: false, time: '—' }
      );

      const doneBtn = document.querySelector('[data-f="completed"]');
      tasksMod.setFilter('completed', doneBtn);

      const allList = document.getElementById('all-list');
      const items = allList.querySelectorAll('.task-item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Done');
    });
  });
});
