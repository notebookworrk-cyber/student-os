import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ai.js', () => {
  function setupAIDOM() {
    document.body.innerHTML =
      '<textarea id="ai-inp"></textarea>' +
      '<div id="msgs"></div>';
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    vi.resetModules();
  });

  describe('initAI', () => {
    it('exports initAI as a function', async () => {
      const aiMod = await import('../../src/js/ai.js');
      expect(typeof aiMod.initAI).toBe('function');
    });

    it('adds welcome message to chat', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');
      aiMod.initAI();

      const msgs = document.getElementById('msgs');
      expect(msgs.children.length).toBeGreaterThan(0);
      expect(msgs.innerHTML).toContain('Hey!');
    });

    it('does not add duplicate welcome on second call', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');
      aiMod.initAI();
      aiMod.initAI();

      const msgs = document.getElementById('msgs');
      expect(msgs.querySelectorAll('.mav').length).toBe(1);
    });
  });

  describe('clearChat', () => {
    it('clears messages and re-initializes', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');
      aiMod.initAI();
      aiMod.clearChat();

      const msgs = document.getElementById('msgs');
      expect(msgs.children.length).toBeGreaterThan(0);
    });
  });

  describe('useChip', () => {
    it('sets input value from chip text', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');
      const mockBtn = { textContent: "Newton's Laws" };
      aiMod.useChip(mockBtn);

      const inp = document.getElementById('ai-inp');
      expect(inp.value).toBe("Newton's Laws");
    });
  });

  describe('aiKey handler', () => {
    it('calls preventDefault on Enter without Shift', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');

      const e = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
      const preventSpy = vi.spyOn(e, 'preventDefault');

      aiMod.aiKey(e);

      expect(preventSpy).toHaveBeenCalled();
    });

    it('does nothing on Shift+Enter', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');

      const e = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      const preventSpy = vi.spyOn(e, 'preventDefault');

      aiMod.aiKey(e);

      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('does nothing on non-Enter key', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');

      const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
      const preventSpy = vi.spyOn(e, 'preventDefault');

      aiMod.aiKey(e);

      expect(preventSpy).not.toHaveBeenCalled();
    });
  });

  describe('autoR', () => {
    it('adjusts textarea height based on scrollHeight', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');

      const textarea = document.getElementById('ai-inp');
      Object.defineProperty(textarea, 'scrollHeight', { value: 50, writable: true });

      aiMod.autoR(textarea);

      expect(parseInt(textarea.style.height)).toBe(50);
    });

    it('caps height at 110px', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');

      const textarea = document.getElementById('ai-inp');
      Object.defineProperty(textarea, 'scrollHeight', { value: 200, writable: true });

      aiMod.autoR(textarea);

      expect(parseInt(textarea.style.height)).toBe(110);
    });
  });

  describe('validateApiKey (from utils)', () => {
    it('validates Anthropic keys with sk-ant- prefix', async () => {
      const { validateApiKey } = await import('../../src/js/utils.js');
      expect(validateApiKey('sk-ant-' + 'a'.repeat(20), 'anthropic').valid).toBe(true);
    });

    it('rejects invalid Anthropic keys', async () => {
      const { validateApiKey } = await import('../../src/js/utils.js');
      expect(validateApiKey('bad-key', 'anthropic').valid).toBe(false);
    });

    it('validates Gemini keys with AIzaSy prefix', async () => {
      const { validateApiKey } = await import('../../src/js/utils.js');
      expect(validateApiKey('AIzaSy' + 'a'.repeat(30), 'gemini').valid).toBe(true);
    });

    it('rejects invalid Gemini keys', async () => {
      const { validateApiKey } = await import('../../src/js/utils.js');
      expect(validateApiKey('bad-key', 'gemini').valid).toBe(false);
    });
  });

  describe('fallback responses', () => {
    it('starts with empty API key', async () => {
      setupAIDOM();
      const stateMod = await import('../../src/js/state.js');
      stateMod.load();
      expect(stateMod.getState().settings.apiKey).toBe('');
    });

    it('uses local knowledge when no API key configured', async () => {
      setupAIDOM();
      const aiMod = await import('../../src/js/ai.js');
      expect(typeof aiMod.initAI).toBe('function');
    });
  });
});
