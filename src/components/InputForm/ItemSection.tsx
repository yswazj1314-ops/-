import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { DecisionInput } from '@/lib/schema';

type Props = { form: UseFormReturn<DecisionInput> };

export function ItemSection({ form }: Props) {
  const {
    formState: { errors },
    register,
    setValue,
    watch,
  } = form;
  const emotion = watch('emotionScore') ?? 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品信息</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="商品名称" error={errors.itemName?.message} id="itemName">
          <Input id="itemName" {...register('itemName')} placeholder="例如：相机" />
        </Field>
        <Field label="购买价格（元）" error={errors.price?.message} id="price">
          <Input id="price" type="number" {...register('price', { valueAsNumber: true })} />
        </Field>
        <Field label="预计使用年限（年）" error={errors.usageYears?.message} id="usageYears">
          <Input id="usageYears" type="number" step="0.5" {...register('usageYears', { valueAsNumber: true })} />
        </Field>
        <Field label="预计残值（元）" error={errors.salvageValue?.message} id="salvageValue">
          <Input id="salvageValue" type="number" {...register('salvageValue', { valueAsNumber: true })} />
        </Field>
        <Field label="年均维护成本（元/年）" error={errors.annualMaintenance?.message} id="annualMaintenance">
          <Input
            id="annualMaintenance"
            type="number"
            {...register('annualMaintenance', { valueAsNumber: true })}
          />
        </Field>
        <Field label="年经济收益（元/年）" error={errors.annualEconomicReturn?.message} id="annualEconomicReturn">
          <Input
            id="annualEconomicReturn"
            type="number"
            {...register('annualEconomicReturn', { valueAsNumber: true })}
          />
        </Field>
        <Field label="主要用途" error={errors.purpose?.message} id="purpose" className="md:col-span-2">
          <Textarea id="purpose" {...register('purpose')} placeholder="一句话描述这笔购买的用途" />
        </Field>
        <Field
          label={`情绪偏好评分：${emotion}/10`}
          error={errors.emotionScore?.message}
          id="emotionScore"
          className="md:col-span-2"
        >
          <Slider
            id="emotionScore"
            min={1}
            max={10}
            step={1}
            value={[emotion]}
            onValueChange={(value) => setValue('emotionScore', value[0], { shouldValidate: true })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  className,
  error,
  id,
  label,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
