export type LLMSettings = {
  provider: 'claude' | 'openai' | 'custom-openai-compat';
  apiKey: string;
  baseURL?: string;
  model?: string;
  rememberKey: boolean;
};

const KEY = 'llmSettings';

export function saveSettings(settings: LLMSettings): void {
  const toSave = settings.rememberKey ? settings : { ...settings, apiKey: '' };
  localStorage.setItem(KEY, JSON.stringify(toSave));
}

export function loadSettings(): LLMSettings | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LLMSettings;
  } catch {
    return null;
  }
}

export function clearSettings(): void {
  localStorage.removeItem(KEY);
}
