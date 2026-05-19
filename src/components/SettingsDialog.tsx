import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { LLMSettings } from '@/lib/settingsStore';

type Props = {
  initial: LLMSettings | null;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: LLMSettings) => void;
  open: boolean;
};

export function SettingsDialog({ initial, onOpenChange, onSave, open }: Props) {
  const [provider, setProvider] = useState<LLMSettings['provider']>(initial?.provider ?? 'openai');
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '');
  const [baseURL, setBaseURL] = useState(initial?.baseURL ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [rememberKey, setRememberKey] = useState(initial?.rememberKey ?? false);

  useEffect(() => {
    if (!open) return;
    setProvider(initial?.provider ?? 'openai');
    setApiKey(initial?.apiKey ?? '');
    setBaseURL(initial?.baseURL ?? '');
    setModel(initial?.model ?? '');
    setRememberKey(initial?.rememberKey ?? false);
  }, [initial, open]);

  const defaultModel =
    provider === 'claude' ? 'claude-sonnet-4-6' : provider === 'openai' ? 'gpt-4o' : 'deepseek-chat';
  const providers: Array<{ value: LLMSettings['provider']; label: string; hint: string }> = [
    { value: 'openai', label: 'OpenAI', hint: '官方 Chat Completions' },
    { value: 'claude', label: 'Claude', hint: 'Anthropic Messages' },
    { value: 'custom-openai-compat', label: '兼容协议', hint: 'DeepSeek / OpenAI 兼容服务' },
  ];

  function handleSave() {
    onSave({
      provider,
      apiKey,
      baseURL: baseURL || undefined,
      model: model || defaultModel,
      rememberKey,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-slate-200 bg-white text-slate-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">API 设置</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Provider</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {providers.map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    'cursor-pointer rounded-md border bg-white p-3 text-sm shadow-sm transition-colors',
                    provider === item.value
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 text-slate-800 hover:border-slate-400',
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={provider === item.value}
                    onChange={() => setProvider(item.value)}
                  />
                  <span className="block font-semibold">{item.label}</span>
                  <span className={cn('mt-1 block text-xs', provider === item.value ? 'text-slate-200' : 'text-slate-500')}>
                    {item.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              className="bg-white"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          {provider === 'custom-openai-compat' && (
            <div className="space-y-1">
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                id="baseURL"
                className="bg-white"
                placeholder="https://api.deepseek.com/v1"
                value={baseURL}
                onChange={(event) => setBaseURL(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              className="bg-white"
              placeholder={defaultModel}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={rememberKey} onChange={(event) => setRememberKey(event.target.checked)} />
            记住密钥（保存到本地浏览器）
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
