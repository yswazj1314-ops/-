import { useCallback, useState } from 'react';
import { computeReport } from '@/lib/calculator';
import type { DecisionInput, ScoreReport } from '@/lib/schema';

export function useDecisionFlow() {
  const [input, setInput] = useState<DecisionInput | null>(null);
  const [report, setReport] = useState<ScoreReport | null>(null);

  const compute = useCallback((next: DecisionInput, discountRate: number) => {
    setInput(next);
    setReport(computeReport(next, discountRate));
  }, []);

  const reset = useCallback(() => {
    setInput(null);
    setReport(null);
  }, []);

  return { input, report, compute, reset };
}
