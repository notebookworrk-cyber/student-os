export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function formatDate(date = new Date()) {
  return date.toDateString();
}

export function formatTimeShort(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function createFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

export function toast(title, msg, color = 'blue') {
  const colors = {
    blue: 'var(--blue)',
    green: 'var(--green)',
    amber: 'var(--amber)',
    pink: 'var(--pink)',
    purple: 'var(--purple)',
    cyan: 'var(--cyan)',
    red: 'var(--red)'
  };

  const container = document.getElementById('toasts');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="font-size:16px;color:${colors[color] || colors.blue}">●</span>
    <div class="toast-txt"><strong>${esc(title)}</strong><br>${esc(msg)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 280);
  }, 3000);
}

export function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('on');
}

export function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('on');
}

export function onOverlayClick(event, id) {
  if (event.target.id === id) hideModal(id);
}

export function floatXP(amount, x, y) {
  const el = document.createElement('div');
  el.className = 'xpf';
  el.textContent = `+${amount} XP ✨`;
  el.style.left = (x || window.innerWidth / 2 - 40) + 'px';
  el.style.top = (y || 200) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

export function makeConfetti() {
  const container = document.getElementById('confetti');
  if (!container) return;

  container.innerHTML = '';
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'cf';
    const size = 5 + Math.random() * 8;
    const duration = 2 + Math.random() * 2;
    const delay = Math.random() * 1.2;
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    fragment.appendChild(el);
  }

  container.appendChild(fragment);
  setTimeout(() => { container.innerHTML = ''; }, 4400);
}

export function validateApiKey(key, provider) {
  if (!key || !key.trim()) return { valid: true, message: '' };

  const trimmed = key.trim();

  if (provider === 'anthropic') {
    if (!trimmed.startsWith('sk-ant-')) {
      return { valid: false, message: 'Anthropic keys must start with "sk-ant-"' };
    }
    if (trimmed.length < 20) {
      return { valid: false, message: 'Anthropic key appears too short' };
    }
  } else if (provider === 'gemini') {
    if (!trimmed.startsWith('AIzaSy')) {
      return { valid: false, message: 'Gemini keys must start with "AIzaSy"' };
    }
    if (trimmed.length < 30) {
      return { valid: false, message: 'Gemini key appears too short' };
    }
  }

  return { valid: true, message: '' };
}

export function getProviderName(provider) {
  return provider === 'gemini' ? 'Gemini' : 'Claude (Anthropic)';
}