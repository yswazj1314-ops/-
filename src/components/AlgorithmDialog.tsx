import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const sections = [
  {
    title: '1. 原始指标',
    items: [
      'NPV：把当前支出、年经济收益、情绪收益、维护成本、贷款还款和期末残值折现到今天。',
      '现金流冲击：购买后剩余储蓄可覆盖多少个月固定支出。',
      '购买力压力：购买价 /（年收入 + 总储蓄 × 30%）。',
      '单位使用成本：（购买价 + 年维护成本 × 使用年限 - 预计残值）/ 使用年限。',
    ],
  },
  {
    title: '2. 情绪收益',
    items: [
      '情绪总收益 = 月收入 × 情绪偏好评分 / 10。',
      '年情绪收益 = 情绪总收益 / 预计使用年限。',
      '年总流入 = 年经济收益 + 年情绪收益。',
    ],
  },
  {
    title: '3. 子分规则',
    items: [
      'NPV 分：≥ 购买价 × 30% 记 100 分；0 记 60 分；≤ -购买价 × 50% 记 0 分，中间线性插值。',
      '现金流冲击分：≥ 12 个月记 100 分；6 个月记 80 分；3 个月记 50 分；0 个月记 0 分。',
      '购买力压力分：≤ 0.15 记 100 分；0.30 约 80 分；0.50 约 50 分；≥ 1.0 记 0 分。',
      '单位使用成本分：年经济收益 / 单位使用成本 ≥ 1.5 记 100 分；1.0 记 70 分；0.5 记 40 分；0 记 0 分。',
    ],
  },
  {
    title: '4. 综合评分与结论',
    items: [
      '综合评分 = NPV 分 × 40% + 现金流冲击分 × 25% + 购买力压力分 × 20% + 单位使用成本分 × 15%。',
      '≥ 75：推荐购买；50-74：谨慎考虑；< 50：不推荐。',
      '保守档折现率 3%，平衡档使用 LPR 1Y，进取档折现率 7%。',
    ],
  },
];

export function AlgorithmDialog({ onOpenChange, open }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-slate-200 bg-white text-slate-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">价值计算规则</DialogTitle>
          <DialogDescription>查看综合评分背后的指标、归一化规则、权重和结论阈值。</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-6 text-slate-700">
          <p className="rounded-md border border-slate-200 bg-slate-50 p-3">
            这套模型不是替你做决定，而是把一笔大额支出拆成财务回报、现金流安全、收入压力和使用成本四个维度，再给出可解释的参考分。
          </p>
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="font-semibold text-slate-950">{section.title}</h3>
              <ul className="list-inside list-disc space-y-1">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
