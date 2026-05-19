import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { DecisionInput } from '@/lib/schema';

type Props = { form: UseFormReturn<DecisionInput> };

export function PreferenceSection({ form }: Props) {
  const { register } = form;
  return (
    <Card>
      <CardHeader>
        <CardTitle>市场偏好</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>机会成本档位</Label>
        <div className="mt-2 flex flex-wrap gap-4">
          {(['conservative', 'balanced', 'aggressive'] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input type="radio" value={value} {...register('riskProfile')} />
              {value === 'conservative' ? '保守 (3%)' : value === 'balanced' ? '平衡 (LPR)' : '进取 (7%)'}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
