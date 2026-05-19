import { beforeEach, describe, expect, it } from 'vitest';
import { clearSettings, loadSettings, saveSettings } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing stored', () => {
    expect(loadSettings()).toBeNull();
  });

  it('round-trips settings when rememberKey=true', () => {
    saveSettings({ provider: 'openai', apiKey: 'sk-x', model: 'gpt-4o', rememberKey: true });
    const loaded = loadSettings();
    expect(loaded?.apiKey).toBe('sk-x');
  });

  it('does not persist apiKey when rememberKey=false', () => {
    saveSettings({ provider: 'openai', apiKey: 'sk-x', model: 'gpt-4o', rememberKey: false });
    const loaded = loadSettings();
    expect(loaded?.apiKey).toBe('');
    expect(loaded?.provider).toBe('openai');
  });

  it('clear removes stored settings', () => {
    saveSettings({ provider: 'openai', apiKey: 'sk-x', model: 'gpt-4o', rememberKey: true });
    clearSettings();
    expect(loadSettings()).toBeNull();
  });
});
