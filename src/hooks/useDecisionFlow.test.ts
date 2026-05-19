import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDecisionFlow } from './useDecisionFlow';
import type { DecisionInput } from '@/lib/schema';

const sample: DecisionInput = {
  itemName: '相机',
  price: 20000,
  usageYears: 5,
  purpose: '摄影',
  annualEconomicReturn: 0,
  emotionScore: 8,
  annualMaintenance: 200,
  salvageValue: 8000,
  financing: { type: 'cash' },
  age: 30,
  monthlyIncome: 20000,
  savings: 80000,
  monthlyExpense: 10000,
  monthlyDebtPayment: 0,
  riskProfile: 'balanced',
};

describe('useDecisionFlow', () => {
  it('produces a ScoreReport after compute()', () => {
    const { result } = renderHook(() => useDecisionFlow());
    act(() => result.current.compute(sample, 0.0345));
    expect(result.current.report).not.toBeNull();
    expect(result.current.report?.compositeScore).toBeGreaterThanOrEqual(0);
  });

  it('recomputes when riskProfile changes via setDiscountRate', () => {
    const { result } = renderHook(() => useDecisionFlow());
    act(() => result.current.compute(sample, 0.03));
    const score1 = result.current.report?.compositeScore;
    act(() => result.current.compute(sample, 0.07));
    const score2 = result.current.report?.compositeScore;
    expect(score1).not.toBe(score2);
  });

  it('reset() clears report and input', () => {
    const { result } = renderHook(() => useDecisionFlow());
    act(() => result.current.compute(sample, 0.0345));
    act(() => result.current.reset());
    expect(result.current.report).toBeNull();
    expect(result.current.input).toBeNull();
  });
});
