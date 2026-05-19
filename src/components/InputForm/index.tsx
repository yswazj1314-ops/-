import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { decisionInputSchema, type DecisionInput } from '@/lib/schema';
import { FinanceSection } from './FinanceSection';
import { ItemSection } from './ItemSection';
import { PreferenceSection } from './PreferenceSection';

type Props = {
  defaultValues?: Partial<DecisionInput>;
  onSubmit: (data: DecisionInput) => void;
};

const DEFAULTS: Partial<DecisionInput> = {
  annualEconomicReturn: 0,
  annualMaintenance: 0,
  emotionScore: 5,
  financing: { type: 'cash' },
  monthlyDebtPayment: 0,
  riskProfile: 'balanced',
  salvageValue: 0,
};

export function InputForm({ defaultValues, onSubmit }: Props) {
  const form = useForm<DecisionInput>({
    resolver: zodResolver(decisionInputSchema),
    defaultValues: { ...DEFAULTS, ...defaultValues } as DecisionInput,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <ItemSection form={form} />
      <FinanceSection form={form} />
      <PreferenceSection form={form} />
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          开始分析
        </Button>
      </div>
    </form>
  );
}
