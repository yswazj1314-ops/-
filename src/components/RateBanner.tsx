import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LPRData } from '@/lib/rateService';

type Props = {
  data: LPRData;
  onOverride: (value: { lpr1y: number; lpr5y: number }) => void;
};

const sourceLabel: Record<LPRData['source'], string> = {
  cache: '缓存',
  fallback: '兜底',
  live: '实时',
  manual: '手动',
};

export function RateBanner({ data, onOverride }: Props) {
  const [editing, setEditing] = useState(false);
  const [lpr1y, setLpr1y] = useState(data.lpr1y.toString());
  const [lpr5y, setLpr5y] = useState(data.lpr5y.toString());

  useEffect(() => {
    setLpr1y(data.lpr1y.toString());
    setLpr5y(data.lpr5y.toString());
  }, [data.lpr1y, data.lpr5y]);

  const tone = data.source === 'fallback' ? 'warn' : 'info';
  const bg =
    tone === 'warn'
      ? 'border-amber-200/70 bg-amber-50/70 text-amber-950'
      : 'border-white/70 bg-white/55 text-slate-700';

  function applyOverride() {
    onOverride({ lpr1y: Number.parseFloat(lpr1y), lpr5y: Number.parseFloat(lpr5y) });
    setEditing(false);
  }

  return (
    <div data-tone={tone} className={`backdrop-blur-xl flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-xs shadow-md shadow-slate-900/5 ${bg}`}>
      <span>
        当前 LPR 1Y <b>{data.lpr1y}%</b> / 5Y <b>{data.lpr5y}%</b>（{data.asOf}，来源：{sourceLabel[data.source]}）
      </span>
      {!editing && data.source !== 'manual' && (
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          手动输入
        </Button>
      )}
      {editing && (
        <span className="flex flex-wrap items-center gap-2">
          <Label htmlFor="lpr1y" className="text-xs">
            LPR 1Y
          </Label>
          <Input id="lpr1y" className="h-7 w-20" value={lpr1y} onChange={(event) => setLpr1y(event.target.value)} />
          <Label htmlFor="lpr5y" className="text-xs">
            LPR 5Y
          </Label>
          <Input id="lpr5y" className="h-7 w-20" value={lpr5y} onChange={(event) => setLpr5y(event.target.value)} />
          <Button size="sm" onClick={applyOverride}>
            应用
          </Button>
        </span>
      )}
    </div>
  );
}
