type Props = { score: number; verdict: '推荐购买' | '谨慎考虑' | '不推荐' };

export function ScoreRing({ score, verdict }: Props) {
  const tone = score >= 75 ? 'positive' : score < 50 ? 'negative' : 'neutral';
  const colorClass =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
        ? 'text-red-600'
        : 'text-amber-600';
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="flex flex-col items-center justify-center" data-tone={tone}>
      <svg width="180" height="180" viewBox="0 0 180 180" className={colorClass} aria-label="综合评分">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
        <text x="90" y="95" textAnchor="middle" fontSize="44" fontWeight="700" fill="currentColor">
          {Math.round(score)}
        </text>
      </svg>
      <div className="mt-2 text-lg font-semibold">{verdict}</div>
    </div>
  );
}
