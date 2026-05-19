import { describe, it, expect } from 'vitest';
import { decisionInputSchema } from './schema';

const baseValid = {
  itemName: '相机',
  price: 20000,
  usageYears: 5,
  purpose: '摄影',
  annualEconomicReturn: 0,
  emotionScore: 8,
  annualMaintenance: 200,
  salvageValue: 8000,
  financing: { type: 'cash' as const },
  age: 30,
  monthlyIncome: 20000,
  savings: 80000,
  monthlyExpense: 10000,
  monthlyDebtPayment: 0,
  riskProfile: 'balanced' as const,
};

describe('decisionInputSchema', () => {
  it('accepts a valid cash purchase input', () => {
    expect(() => decisionInputSchema.parse(baseValid)).not.toThrow();
  });

  it('rejects price <= 0', () => {
    expect(() => decisionInputSchema.parse({ ...baseValid, price: 0 })).toThrow();
  });

  it('rejects emotionScore out of 1-10', () => {
    expect(() => decisionInputSchema.parse({ ...baseValid, emotionScore: 11 })).toThrow();
    expect(() => decisionInputSchema.parse({ ...baseValid, emotionScore: 0 })).toThrow();
  });

  it('rejects salvageValue > price', () => {
    expect(() =>
      decisionInputSchema.parse({ ...baseValid, salvageValue: 30000 }),
    ).toThrow();
  });

  it('accepts loan financing with required sub-fields', () => {
    const withLoan = {
      ...baseValid,
      financing: { type: 'loan' as const, rate: 5, termMonths: 24, downPayment: 5000 },
    };
    expect(() => decisionInputSchema.parse(withLoan)).not.toThrow();
  });

  it('rejects loan financing missing rate', () => {
    const bad = {
      ...baseValid,
      financing: { type: 'loan' as const, termMonths: 24, downPayment: 5000 },
    };
    expect(() => decisionInputSchema.parse(bad)).toThrow();
  });
});
