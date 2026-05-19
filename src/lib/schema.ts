import { z } from 'zod';

const cashFinancing = z.object({ type: z.literal('cash') });
const loanFinancing = z.object({
  type: z.literal('loan'),
  rate: z.number().min(0).max(30),
  termMonths: z.number().int().min(1).max(360),
  downPayment: z.number().min(0),
});

export const decisionInputSchema = z
  .object({
    itemName: z.string().min(1, '商品名称必填'),
    price: z.number().positive('购买价格必须 > 0'),
    usageYears: z.number().min(0.5).max(50),
    purpose: z.string().min(1, '请填写主要用途'),
    annualEconomicReturn: z.number().min(0),
    emotionScore: z.number().int().min(1).max(10),
    annualMaintenance: z.number().min(0),
    salvageValue: z.number().min(0),
    financing: z.discriminatedUnion('type', [cashFinancing, loanFinancing]),
    age: z.number().int().min(16).max(100),
    monthlyIncome: z.number().positive(),
    savings: z.number().min(0),
    monthlyExpense: z.number().min(0),
    monthlyDebtPayment: z.number().min(0),
    riskProfile: z.enum(['conservative', 'balanced', 'aggressive']),
  })
  .refine((d) => d.salvageValue <= d.price, {
    path: ['salvageValue'],
    message: '残值不能高于购买价',
  })
  .refine(
    (d) => d.financing.type === 'cash' || d.financing.downPayment <= d.price,
    { path: ['financing'], message: '首付不能高于购买价' },
  );

export type DecisionInput = z.infer<typeof decisionInputSchema>;

export type Subscores = {
  npv: number;
  runway: number;
  pressure: number;
  perYear: number;
};

export type ScoreReport = {
  discountRate: number;
  rawMetrics: {
    npv: number;
    pressureRatio: number;
    runwayMonths: number;
    annualUnitCost: number;
  };
  subscores: Subscores;
  compositeScore: number;
  verdict: '推荐购买' | '谨慎考虑' | '不推荐';
  diagnostics: string[];
};
