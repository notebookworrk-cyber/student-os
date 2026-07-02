const LVT = ['', 'Rookie', 'Learner', 'Focused', 'Disciplined', 'Grinder', 'Hustler', 'Scholar', 'Beast', 'Unstoppable', 'Legend'];

const QUOTES = [
  'The secret of getting ahead is getting started.',
  'Hard work beats talent when talent doesn\'t work hard.',
  'Success is the sum of small efforts repeated day in and day out.',
  'Don\'t watch the clock. Do what it does — keep going.',
  'You don\'t have to be great to start, but you have to start to be great.',
  'The expert in anything was once a beginner.',
  'Work hard in silence. Let success make the noise.',
  'Push yourself. No one else is going to do it for you.',
  'Discipline is choosing between what you want now and what you want most.',
  'Your future is created by what you do today, not tomorrow.'
];

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

const RING_C = 2 * Math.PI * 108;

const ACH_D = [
  { id: 'firstFocus', ico: '🎯', name: 'First Focus', tip: 'Complete 1 session' },
  { id: 'streak7', ico: '🔥', name: '7-Day Streak', tip: '7 days in a row' },
  { id: 'xp100', ico: '✨', name: '100 XP Club', tip: 'Earn 100+ XP' },
  { id: 'tasks10', ico: '📝', name: '10 Tasks Done', tip: 'Complete 10 tasks' },
  { id: 'focus1hr', ico: '⏱️', name: '1hr Focus', tip: '60 focus minutes total' },
  { id: 'level5', ico: '🏆', name: 'Level 5', tip: 'Reach Level 5' }
];

const SICO = {
  math: '📐', physics: '⚛️', chemistry: '🧪',
  english: '📖', history: '🏛️', biology: '🧬', other: '📦'
};

const DEFAULTS = {
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
    firstFocus: false,
    streak7: false,
    xp100: false,
    tasks10: false,
    focus1hr: false,
    level5: false
  },
  activity: {},
  settings: {
    dur: 25,
    apiKey: '',
    notifs: false,
    provider: 'anthropic'
  }
};

let S = { ...DEFAULTS };

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export function load() {
  try {
    const raw = localStorage.getItem('sos4');
    if (raw) {
      const saved = JSON.parse(raw);
      S = deepMerge(DEFAULTS, saved);
    }
  } catch (e) {
    console.warn('Load failed, using defaults', e);
    S = { ...DEFAULTS };
  }

  const today = new Date().toDateString();
  const yday = new Date(Date.now() - 86400000).toDateString();

  if (!S.lastDate) {
    S.streak = 1;
    S.lastDate = today;
  } else if (S.lastDate === yday) {
    S.streak++;
    if (S.streak > S.bestStreak) S.bestStreak = S.streak;
    S.lastDate = today;
  } else if (S.lastDate !== today) {
    S.streak = 1;
    S.lastDate = today;
  }

  if (!S.activity[today]) S.activity[today] = 0;
  if (!S.settings.provider) S.settings.provider = 'anthropic';
}

export function save() {
  try {
    localStorage.setItem('sos4', JSON.stringify(S));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function getState() {
  return S;
}

export function setState(partial) {
  S = { ...S, ...partial };
  save();
}

export function getToday() {
  return new Date().toDateString();
}

export function getLevelTitle(level) {
  // Level should be 1-10, but handle edge cases gracefully
  if (level < 1) return '';
  return LVT[Math.min(level, 10)] || 'Legend';
}

export { LVT, QUOTES, MISSIONS, COACH_M, RING_C, ACH_D, SICO, DEFAULTS };