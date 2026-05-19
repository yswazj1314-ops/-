import type { ScoreReport } from '@/lib/schema';
import { LLMReview } from './LLMReview';
import { RadarChartCard } from './RadarChartCard';
import { ScoreRing } from './ScoreRing';

type Props = {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  report: ScoreReport;
  startStream: () => AsyncGenerator<string>;
};

export function ResultPanel({ hasApiKey, onOpenSettings, report, startStream }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
        <ScoreRing score={report.compositeScore} verdict={report.verdict} />
        <RadarChartCard subscores={report.subscores} />
      </div>
      {report.diagnostics.length > 0 && (
        <ul className="glass-surface list-inside list-disc rounded-md p-3 text-sm text-amber-950">
          {report.diagnostics.map((diagnostic) => (
            <li key={diagnostic}>{diagnostic}</li>
          ))}
        </ul>
      )}
      <LLMReview startStream={startStream} hasApiKey={hasApiKey} onOpenSettings={onOpenSettings} />
    </div>
  );
}
