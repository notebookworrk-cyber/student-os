import { describe, it, expect } from 'vitest';
import {
  esc,
  formatTime,
  formatDate,
  formatTimeShort,
  clamp,
  generateId,
  debounce,
  throttle,
  createElement,
  createFragment,
  validateApiKey,
  getProviderName,
  showModal,
  hideModal,
  onOverlayClick,
  toast,
  floatXP
} from '../../src/js/utils.js';

describe('formatTime', () => {
  it('converts seconds to MM:SS format', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });

  it('pads single digit minutes and seconds', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });
});

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
    expect(esc('"quoted"')).toBe('&quot;quoted&quot;');
    expect(esc("a & b")).toBe('a &amp; b');
    expect(esc('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(esc('')).toBe('');
  });

  it('converts non-string values to string', () => {
    expect(esc(42)).toBe('42');
    expect(esc(null)).toBe('null');
    expect(esc(undefined)).toBe('undefined');
  });
});

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('generateId', () => {
  it('generates a string id', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('debounce', () => {
  it('delays function execution', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});

describe('throttle', () => {
  it('limits function calls to once per interval', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

describe('validateApiKey', () => {
  it('returns valid for empty key', () => {
    const result = validateApiKey('', 'anthropic');
    expect(result.valid).toBe(true);
  });

  it('returns valid for empty trimmed key', () => {
    const result = validateApiKey('   ', 'anthropic');
    expect(result.valid).toBe(true);
  });

  describe('Anthropic keys', () => {
    it('validates key with sk-ant- prefix', () => {
      const validKey = 'sk-ant-' + 'a'.repeat(20);
      const result = validateApiKey(validKey, 'anthropic');
      expect(result.valid).toBe(true);
    });

    it('rejects key without sk-ant- prefix', () => {
      const result = validateApiKey('invalid-key', 'anthropic');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('sk-ant-');
    });

    it('rejects key shorter than 20 chars', () => {
      const result = validateApiKey('sk-ant-short', 'anthropic');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too short');
    });
  });

  describe('Gemini keys', () => {
    it('validates key with AIzaSy prefix', () => {
      const validKey = 'AIzaSy' + 'a'.repeat(30);
      const result = validateApiKey(validKey, 'gemini');
      expect(result.valid).toBe(true);
    });

    it('rejects key without AIzaSy prefix', () => {
      const result = validateApiKey('invalid-key', 'gemini');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('AIzaSy');
    });

    it('rejects key shorter than 30 chars', () => {
      const result = validateApiKey('AIzaSyShort', 'gemini');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('too short');
    });
  });
});

describe('getProviderName', () => {
  it('returns correct name for anthropic', () => {
    expect(getProviderName('anthropic')).toBe('Claude (Anthropic)');
  });

  it('returns correct name for gemini', () => {
    expect(getProviderName('gemini')).toBe('Gemini');
  });

  it('defaults to Claude for unknown provider', () => {
    expect(getProviderName('unknown')).toBe('Claude (Anthropic)');
  });
});

describe('createElement', () => {
  it('creates a DOM element from HTML string', () => {
    const el = createElement('<div class="test">Hello</div>');
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('test');
    expect(el.textContent).toBe('Hello');
  });
});

describe('createFragment', () => {
  it('creates a document fragment from HTML string', () => {
    const fragment = createFragment('<span>A</span><span>B</span>');
    expect(fragment.childNodes.length).toBe(2);
    expect(fragment.firstChild.textContent).toBe('A');
  });
});

describe('formatDate', () => {
  it('returns formatted date string', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe(date.toDateString());
  });
});

describe('formatTimeShort', () => {
  it('returns short time string', () => {
    const date = new Date('2025-01-15T14:30:00');
    const result = formatTimeShort(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('showModal and hideModal', () => {
  it('shows modal by adding on class', () => {
    document.body.innerHTML = '<div id="test-modal"></div>';
    showModal('test-modal');
    expect(document.getElementById('test-modal').classList.contains('on')).toBe(true);
  });

  it('hides modal by removing on class', () => {
    document.body.innerHTML = '<div id="test-modal" class="on"></div>';
    hideModal('test-modal');
    expect(document.getElementById('test-modal').classList.contains('on')).toBe(false);
  });

  it('does not throw for non-existent modal', () => {
    expect(() => showModal('nonexistent')).not.toThrow();
    expect(() => hideModal('nonexistent')).not.toThrow();
  });
});

describe('onOverlayClick', () => {
  it('hides modal when clicking overlay with matching id', () => {
    document.body.innerHTML = '<div id="test-modal" class="on"></div>';
    const event = { target: { id: 'test-modal' } };
    onOverlayClick(event, 'test-modal');
    expect(document.getElementById('test-modal').classList.contains('on')).toBe(false);
  });

  it('does not hide modal when clicking child element', () => {
    document.body.innerHTML = '<div id="test-modal" class="on"><div id="child"></div></div>';
    const event = { target: { id: 'child' } };
    onOverlayClick(event, 'test-modal');
    expect(document.getElementById('test-modal').classList.contains('on')).toBe(true);
  });
});

describe('toast', () => {
  it('creates toast element in toasts container', () => {
    document.body.innerHTML = '<div id="toasts"></div>';
    toast('Test Title', 'Test message', 'green');
    const toasts = document.getElementById('toasts');
    expect(toasts.children.length).toBe(1);
    expect(toasts.innerHTML).toContain('Test Title');
    expect(toasts.innerHTML).toContain('Test message');
  });
});

describe('floatXP', () => {
  it('creates floating XP element in body', () => {
    document.body.innerHTML = '';
    floatXP(50, 100, 200);
    const xpf = document.querySelector('.xpf');
    expect(xpf).toBeTruthy();
    expect(xpf.textContent).toContain('50');
  });
});
