import { describe, it, expect } from 'vitest';
import { computeRawMetrics, normalizeSubscores, computeReport, RISK_PROFILE_RATES } from './calculator';
import type { DecisionInput } from './schema';

const sampleCash: DecisionInput = {
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

describe('computeRawMetrics — NPV', () => {
  it('returns negative NPV when costs dominate inflow', () => {
    const highCost: DecisionInput = {
      ...sampleCash,
      annualMaintenance: 5000,
      emotionScore: 1,
      salvageValue: 0,
    };
    const m = computeRawMetrics(highCost, 0.0345);
    expect(m.npv).toBeLessThan(0);
  });

  it('emotional cashflow = monthlyIncome × score/10 / usageYears per year', () => {
    // emotionScore=8, monthlyIncome=20000, usageYears=5
    // total emotional benefit = 20000 × 0.8 = 16000
    // yearly = 16000 / 5 = 3200
    // r=0 → undiscounted NPV ≈ -20000 + (3200 - 200) × 5 + 8000 = +3000
    const m = computeRawMetrics(sampleCash, 0);
    expect(m.npv).toBeCloseTo(3000, 0);
  });

  it('handles loan financing: t=0 outflow = downPayment, monthly = monthlyPayment × 12', () => {
    const withLoan: DecisionInput = {
      ...sampleCash,
      financing: { type: 'loan', rate: 6, termMonths: 24, downPayment: 5000 },
    };
    const m = computeRawMetrics(withLoan, 0);
    expect(m.npv).toBeLessThan(sampleCash.price);
  });
});

describe('computeRawMetrics — pressure ratio', () => {
  it('pressure = price / (annualIncome + savings × 0.3)', () => {
    const m = computeRawMetrics(sampleCash, 0);
    expect(m.pressureRatio).toBeCloseTo(20000 / 264000, 4);
  });
});

describe('computeRawMetrics — runway months', () => {
  it('cash: runway = (savings - price) / monthlyExpense', () => {
    const m = computeRawMetrics(sampleCash, 0);
    expect(m.runwayMonths).toBeCloseTo(6, 4);
  });

  it('loan: runway = (savings - downPayment) / monthlyExpense', () => {
    const withLoan: DecisionInput = {
      ...sampleCash,
      financing: { type: 'loan', rate: 6, termMonths: 24, downPayment: 5000 },
    };
    const m = computeRawMetrics(withLoan, 0);
    expect(m.runwayMonths).toBeCloseTo(7.5, 4);
  });

  it('returns negative runway when downPayment exceeds savings', () => {
    const broke: DecisionInput = { ...sampleCash, savings: 5000 };
    const m = computeRawMetrics(broke, 0);
    expect(m.runwayMonths).toBeLessThan(0);
  });
});

describe('computeRawMetrics — annual unit cost', () => {
  it('= (price + maintenance×years - salvage) / years', () => {
    const m = computeRawMetrics(sampleCash, 0);
    expect(m.annualUnitCost).toBeCloseTo(2600, 4);
  });
});

describe('normalizeSubscores — NPV subscore', () => {
  it('NPV ≥ price×0.3 → 100', () => {
    const s = normalizeSubscores({
      npv: 6000, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.npv).toBe(100);
  });

  it('NPV = 0 → 60', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.npv).toBe(60);
  });

  it('NPV = price × 0.15 → 60 + 40 × 0.5 = 80', () => {
    const s = normalizeSubscores({
      npv: 3000, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.npv).toBeCloseTo(80, 4);
  });

  it('NPV = -price×0.5 → 0', () => {
    const s = normalizeSubscores({
      npv: -10000, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.npv).toBe(0);
  });

  it('NPV way below -price×0.5 → clamped to 0', () => {
    const s = normalizeSubscores({
      npv: -50000, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.npv).toBe(0);
  });
});

describe('normalizeSubscores — runway subscore', () => {
  it('runway ≥ 12 months → 100', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 24, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.runway).toBe(100);
  });

  it('runway = 6 months → 80', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 6, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.runway).toBe(80);
  });

  it('runway = 3 months → 50', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 3, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.runway).toBe(50);
  });

  it('runway = 0 → 0', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 0, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.runway).toBe(0);
  });

  it('negative runway → 0', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: -5, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.runway).toBe(0);
  });
});

describe('normalizeSubscores — pressure subscore', () => {
  it('ratio ≤ 0.15 → 100', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.pressure).toBe(100);
  });

  it('ratio = 0.30 → 80', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.30, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.pressure).toBe(80);
  });

  it('ratio = 0.50 → 50', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.50, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.pressure).toBe(50);
  });

  it('ratio = 1.0 → 0', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 1.0, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.pressure).toBe(0);
  });

  it('ratio > 1.0 → 0', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 2.0, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 5000 });
    expect(s.pressure).toBe(0);
  });
});

describe('normalizeSubscores — perYear subscore', () => {
  it('return/cost ratio ≥ 1.5 → 100', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 1000,
    }, { price: 20000, annualEconomicReturn: 2000 });
    expect(s.perYear).toBe(100);
  });

  it('ratio = 1.0 → 70', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 1000,
    }, { price: 20000, annualEconomicReturn: 1000 });
    expect(s.perYear).toBe(70);
  });

  it('ratio = 0.5 → 40', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 1000,
    }, { price: 20000, annualEconomicReturn: 500 });
    expect(s.perYear).toBe(40);
  });

  it('return = 0 → 0', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 1000,
    }, { price: 20000, annualEconomicReturn: 0 });
    expect(s.perYear).toBe(0);
  });

  it('cost = 0 (free thing) → 100', () => {
    const s = normalizeSubscores({
      npv: 0, pressureRatio: 0.1, runwayMonths: 12, annualUnitCost: 0,
    }, { price: 20000, annualEconomicReturn: 100 });
    expect(s.perYear).toBe(100);
  });
});

describe('computeReport — composite score & verdict', () => {
  it('returns 推荐购买 when composite ≥ 75', () => {
    const allHigh: DecisionInput = {
      ...sampleCash,
      annualEconomicReturn: 10000,
      monthlyIncome: 100000,
      savings: 500000,
      monthlyExpense: 5000,
      salvageValue: 15000,
    };
    const report = computeReport(allHigh, 0.0345);
    expect(report.compositeScore).toBeGreaterThanOrEqual(75);
    expect(report.verdict).toBe('推荐购买');
  });

  it('returns 不推荐 when composite < 50', () => {
    const broke: DecisionInput = {
      ...sampleCash,
      price: 50000,
      annualEconomicReturn: 0,
      monthlyIncome: 5000,
      savings: 8000,
      monthlyExpense: 4000,
      emotionScore: 2,
      salvageValue: 0,
    };
    const report = computeReport(broke, 0.0345);
    expect(report.compositeScore).toBeLessThan(50);
    expect(report.verdict).toBe('不推荐');
  });

  it('weighted formula = 0.4·npv + 0.25·runway + 0.20·pressure + 0.15·perYear', () => {
    const report = computeReport(sampleCash, 0.0345);
    const { npv, runway, pressure, perYear } = report.subscores;
    const expected = 0.4 * npv + 0.25 * runway + 0.2 * pressure + 0.15 * perYear;
    expect(report.compositeScore).toBeCloseTo(expected, 4);
  });

  it('uses discountRate matching riskProfile', () => {
    const conservative: DecisionInput = { ...sampleCash, riskProfile: 'conservative' };
    const aggressive: DecisionInput = { ...sampleCash, riskProfile: 'aggressive' };
    expect(computeReport(conservative, RISK_PROFILE_RATES.conservative).discountRate).toBe(0.03);
    expect(computeReport(aggressive, RISK_PROFILE_RATES.aggressive).discountRate).toBe(0.07);
  });
});

describe('computeReport — diagnostics', () => {
  it('flags low runway', () => {
    const broke: DecisionInput = { ...sampleCash, savings: 22000, monthlyExpense: 10000 };
    const report = computeReport(broke, 0.0345);
    expect(report.diagnostics.some((d) => d.includes('应急金'))).toBe(true);
  });

  it('flags high pressure ratio', () => {
    const stretched: DecisionInput = {
      ...sampleCash, price: 200000, monthlyIncome: 8000, savings: 30000,
    };
    const report = computeReport(stretched, 0.0345);
    expect(report.diagnostics.some((d) => d.includes('压力'))).toBe(true);
  });

  it('flags negative NPV', () => {
    const report = computeReport(sampleCash, 0.0345);
    if (report.rawMetrics.npv < 0) {
      expect(report.diagnostics.some((d) => d.includes('NPV') || d.includes('净现值'))).toBe(true);
    }
  });
});
