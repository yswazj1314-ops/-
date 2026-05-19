import type { DecisionInput, ScoreReport } from './schema';

export type RawMetrics = ScoreReport['rawMetrics'];

function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function discount(amount: number, rate: number, year: number): number {
  return amount / Math.pow(1 + rate, year);
}

export function computeRawMetrics(input: DecisionInput, discountRate: number): RawMetrics {
  const years = Math.ceil(input.usageYears);
  const fracYear = input.usageYears - Math.floor(input.usageYears);
  const totalEmotionalBenefit = input.monthlyIncome * (input.emotionScore / 10);
  const annualEmotionalReturn = totalEmotionalBenefit / input.usageYears;
  const annualInflow = input.annualEconomicReturn + annualEmotionalReturn;

  const loan = input.financing.type === 'loan' ? input.financing : null;
  const t0Outflow = loan ? loan.downPayment : input.price;
  const loanPrincipal = loan ? input.price - loan.downPayment : 0;
  const monthlyLoan = loan
    ? monthlyPayment(loanPrincipal, loan.rate, loan.termMonths)
    : 0;
  const loanYears = loan ? loan.termMonths / 12 : 0;

  let npv = -t0Outflow;
  for (let t = 1; t <= years; t++) {
    const yearWeight = t === years && fracYear > 0 ? fracYear : 1;
    const loanThisYear =
      loan && t <= Math.ceil(loanYears)
        ? monthlyLoan * 12 * (t === Math.ceil(loanYears) && loanYears % 1 !== 0 ? loanYears % 1 : 1)
        : 0;
    const netFlow =
      (annualInflow - input.annualMaintenance) * yearWeight - loanThisYear;
    npv += discount(netFlow, discountRate, t);
  }
  npv += discount(input.salvageValue, discountRate, input.usageYears);

  const annualIncome = input.monthlyIncome * 12;
  const pressureRatio = input.price / (annualIncome + input.savings * 0.3);

  const cashOutflowNow = t0Outflow;
  const runwayMonths =
    input.monthlyExpense > 0
      ? (input.savings - cashOutflowNow) / input.monthlyExpense
      : Number.POSITIVE_INFINITY;

  const annualUnitCost =
    (input.price + input.annualMaintenance * input.usageYears - input.salvageValue) /
    input.usageYears;

  return { npv, pressureRatio, runwayMonths, annualUnitCost };
}

const clamp = (n: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, n));

function npvSubscore(npv: number, price: number): number {
  const high = price * 0.3;
  const low = -price * 0.5;
  if (npv >= high) return 100;
  if (npv >= 0) return 60 + 40 * (npv / high);
  if (npv >= low) return 60 * (1 + npv / Math.abs(low));
  return 0;
}

function runwaySubscore(months: number): number {
  if (!Number.isFinite(months) || months >= 12) return 100;
  if (months >= 6) return 80 + 20 * ((months - 6) / 6);
  if (months >= 3) return 50 + 30 * ((months - 3) / 3);
  if (months >= 0) return 20 * (months / 3);
  return 0;
}

function pressureSubscore(ratio: number): number {
  if (ratio <= 0.15) return 100;
  if (ratio <= 0.30) return 80 + 20 * ((0.30 - ratio) / 0.15);
  if (ratio <= 0.50) return 50 + 30 * ((0.50 - ratio) / 0.20);
  if (ratio < 1.0) return 50 * ((1.0 - ratio) / 0.5);
  return 0;
}

function perYearSubscore(annualReturn: number, annualUnitCost: number): number {
  if (annualUnitCost <= 0) return 100;
  if (annualReturn <= 0) return 0;
  const ratio = annualReturn / annualUnitCost;
  if (ratio >= 1.5) return 100;
  if (ratio >= 1.0) return 70 + 30 * ((ratio - 1.0) / 0.5);
  if (ratio >= 0.5) return 40 + 30 * ((ratio - 0.5) / 0.5);
  return 40 * (ratio / 0.5);
}

export function normalizeSubscores(
  raw: RawMetrics,
  ctx: { price: number; annualEconomicReturn: number },
): { npv: number; runway: number; pressure: number; perYear: number } {
  return {
    npv: clamp(npvSubscore(raw.npv, ctx.price)),
    runway: clamp(runwaySubscore(raw.runwayMonths)),
    pressure: clamp(pressureSubscore(raw.pressureRatio)),
    perYear: clamp(perYearSubscore(ctx.annualEconomicReturn, raw.annualUnitCost)),
  };
}

export const RISK_PROFILE_RATES = {
  conservative: 0.03,
  balanced: 0.0345,
  aggressive: 0.07,
} as const;

const WEIGHTS = { npv: 0.4, runway: 0.25, pressure: 0.2, perYear: 0.15 } as const;

function buildDiagnostics(raw: RawMetrics, input: DecisionInput): string[] {
  const out: string[] = [];
  if (raw.runwayMonths < 3) {
    out.push(`购买后剩余应急金仅 ${raw.runwayMonths.toFixed(1)} 个月，低于 3 个月安全线`);
  } else if (raw.runwayMonths < 6) {
    out.push(`购买后剩余应急金 ${raw.runwayMonths.toFixed(1)} 个月，建议保持 6 个月以上`);
  }
  if (raw.pressureRatio > 0.5) {
    out.push(`购买力压力系数 ${raw.pressureRatio.toFixed(2)}，超出舒适区间（0.5）`);
  } else if (raw.pressureRatio > 0.3) {
    out.push(`购买力压力系数 ${raw.pressureRatio.toFixed(2)}，处于一般水平`);
  }
  if (raw.npv < 0) {
    out.push(`净现值（NPV）为 ${raw.npv.toFixed(0)} 元，从纯财务角度本笔支出不划算`);
  }
  if (input.annualEconomicReturn === 0 && input.emotionScore <= 5) {
    out.push('既无经济收益又情绪偏好不强，购买动机较弱');
  }
  const debtRatio = input.monthlyDebtPayment / input.monthlyIncome;
  if (debtRatio > 0.4) {
    out.push(`月还款占月收入 ${(debtRatio * 100).toFixed(0)}%，债务负担较重`);
  }
  return out;
}

export function computeReport(input: DecisionInput, discountRate: number): ScoreReport {
  const raw = computeRawMetrics(input, discountRate);
  const subs = normalizeSubscores(raw, {
    price: input.price,
    annualEconomicReturn: input.annualEconomicReturn,
  });
  const composite =
    WEIGHTS.npv * subs.npv +
    WEIGHTS.runway * subs.runway +
    WEIGHTS.pressure * subs.pressure +
    WEIGHTS.perYear * subs.perYear;
  const verdict: ScoreReport['verdict'] =
    composite >= 75 ? '推荐购买' : composite >= 50 ? '谨慎考虑' : '不推荐';
  return {
    discountRate,
    rawMetrics: raw,
    subscores: subs,
    compositeScore: composite,
    verdict,
    diagnostics: buildDiagnostics(raw, input),
  };
}
