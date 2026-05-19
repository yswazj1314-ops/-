import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DecisionInput } from '@/lib/schema';

type Props = { form: UseFormReturn<DecisionInput> };

export function FinanceSection({ form }: Props) {
  const {
    formState: { errors },
    register,
    watch,
  } = form;
  const financingType = watch('financing.type');
  const financingErrors = errors.financing as
    | { rate?: { message?: string }; termMonths?: { message?: string }; downPayment?: { message?: string } }
    | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人财务</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="年龄" id="age" error={errors.age?.message}>
          <Input id="age" type="number" {...register('age', { valueAsNumber: true })} />
        </Field>
        <Field label="月收入（元）" id="monthlyIncome" error={errors.monthlyIncome?.message}>
          <Input id="monthlyIncome" type="number" {...register('monthlyIncome', { valueAsNumber: true })} />
        </Field>
        <Field label="总储蓄（元）" id="savings" error={errors.savings?.message}>
          <Input id="savings" type="number" {...register('savings', { valueAsNumber: true })} />
        </Field>
        <Field label="月固定支出（元）" id="monthlyExpense" error={errors.monthlyExpense?.message}>
          <Input id="monthlyExpense" type="number" {...register('monthlyExpense', { valueAsNumber: true })} />
        </Field>
        <Field label="现有月还款（元）" id="monthlyDebtPayment" error={errors.monthlyDebtPayment?.message}>
          <Input
            id="monthlyDebtPayment"
            type="number"
            {...register('monthlyDebtPayment', { valueAsNumber: true })}
          />
        </Field>

        <div className="space-y-2 md:col-span-2">
          <Label>付款方式</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="cash" {...register('financing.type')} />
              全款支付
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="loan" {...register('financing.type')} />
              分期付款
            </label>
          </div>
        </div>

        {financingType === 'loan' && (
          <>
            <Field label="贷款利率（%/年）" id="loanRate" error={financingErrors?.rate?.message}>
              <Input id="loanRate" type="number" step="0.01" {...register('financing.rate', { valueAsNumber: true })} />
            </Field>
            <Field label="贷款期限（月）" id="termMonths" error={financingErrors?.termMonths?.message}>
              <Input id="termMonths" type="number" {...register('financing.termMonths', { valueAsNumber: true })} />
            </Field>
            <Field label="首付（元）" id="downPayment" error={financingErrors?.downPayment?.message}>
              <Input id="downPayment" type="number" {...register('financing.downPayment', { valueAsNumber: true })} />
            </Field>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
