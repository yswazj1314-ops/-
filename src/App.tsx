import { useEffect, useState } from 'react';
import { AlgorithmDialog } from '@/components/AlgorithmDialog';
import { InputForm } from '@/components/InputForm';
import { RateBanner } from '@/components/RateBanner';
import { ResultPanel } from '@/components/ResultPanel';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { useDecisionFlow } from '@/hooks/useDecisionFlow';
import { RISK_PROFILE_RATES } from '@/lib/calculator';
import { streamReview, type ProviderConfig } from '@/lib/llmService';
import { fetchLPR, type LPRData } from '@/lib/rateService';
import { loadSettings, saveSettings, type LLMSettings } from '@/lib/settingsStore';
import type { DecisionInput } from '@/lib/schema';

function emptyStream(): AsyncGenerator<string> {
  async function* iter() {
    return;
  }
  return iter();
}

function toProviderConfig(settings: LLMSettings): ProviderConfig {
  if (settings.provider === 'custom-openai-compat') {
    return {
      provider: 'custom-openai-compat',
      apiKey: settings.apiKey,
      baseURL: settings.baseURL ?? 'https://api.deepseek.com/v1',
      model: settings.model ?? 'deepseek-chat',
    };
  }
  if (settings.provider === 'claude') {
    return { provider: 'claude', apiKey: settings.apiKey, model: settings.model };
  }
  return { provider: 'openai', apiKey: settings.apiKey, model: settings.model };
}

export default function App() {
  const flow = useDecisionFlow();
  const [lpr, setLpr] = useState<LPRData | null>(null);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [algorithmOpen, setAlgorithmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void fetchLPR().then(setLpr);
    setSettings(loadSettings());
  }, []);

  function discountRateFor(input: DecisionInput) {
    if (input.riskProfile === 'conservative') return RISK_PROFILE_RATES.conservative;
    if (input.riskProfile === 'aggressive') return RISK_PROFILE_RATES.aggressive;
    return lpr ? lpr.lpr1y / 100 : RISK_PROFILE_RATES.balanced;
  }

  function handleSubmit(data: DecisionInput) {
    flow.compute(data, discountRateFor(data));
  }

  function handleSaveSettings(next: LLMSettings) {
    saveSettings(next);
    setSettings(next);
  }

  function handleRateOverride(value: { lpr1y: number; lpr5y: number }) {
    void fetchLPR({ override: value }).then((next) => {
      setLpr(next);
      if (flow.input) flow.compute(flow.input, flow.input.riskProfile === 'balanced' ? next.lpr1y / 100 : discountRateFor(flow.input));
    });
  }

  function startStream() {
    if (!flow.input || !flow.report || !settings?.apiKey) return emptyStream();
    return streamReview(flow.input, flow.report, toProviderConfig(settings));
  }

  return (
    <main className="glass-page min-h-screen text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-lg p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Decision Desk</p>
            <h1 className="text-2xl font-bold md:text-3xl">大件商品购买决策</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAlgorithmOpen(true)}>
              计算规则
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              API 设置
            </Button>
          </div>
        </header>

        {lpr && <RateBanner data={lpr} onOverride={handleRateOverride} />}

        <InputForm onSubmit={handleSubmit} />

        {flow.report && (
          <ResultPanel
            report={flow.report}
            startStream={startStream}
            hasApiKey={Boolean(settings?.apiKey)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        <AlgorithmDialog open={algorithmOpen} onOpenChange={setAlgorithmOpen} />
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onSave={handleSaveSettings}
          initial={settings}
        />
      </div>
    </main>
  );
}
