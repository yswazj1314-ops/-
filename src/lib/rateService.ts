// 兜底 LPR（人工校对：2026-05；如需更新请同步修改）
export const FALLBACK_LPR = { lpr1y: 3.45, lpr5y: 3.95, asOf: '2026-05-01' } as const;

const CACHE_KEY = 'rateCache';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DEFAULT_LPR_URL = import.meta.env.VITE_LPR_API_URL ?? '/lpr.json';

export type LPRSource = 'live' | 'cache' | 'fallback' | 'manual';

export type LPRData = {
  lpr1y: number;
  lpr5y: number;
  asOf: string;
  source: LPRSource;
};

type CacheEntry = { data: LPRData; timestamp: number };

function isValidLPRPayload(value: unknown): value is Pick<LPRData, 'lpr1y' | 'lpr5y' | 'asOf'> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.lpr1y === 'number' &&
    typeof candidate.lpr5y === 'number' &&
    typeof candidate.asOf === 'string'
  );
}

export function getCachedLPR(): LPRData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function setCache(data: LPRData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() } satisfies CacheEntry));
  } catch {
    // localStorage 不可用时静默忽略。
  }
}

export async function fetchLPR(
  opts: { override?: { lpr1y: number; lpr5y: number } } = {},
): Promise<LPRData> {
  if (opts.override) {
    return {
      ...opts.override,
      asOf: new Date().toISOString().slice(0, 10),
      source: 'manual',
    };
  }

  const cached = getCachedLPR();
  if (cached) return { ...cached, source: 'cache' };

  try {
    const res = await fetch(DEFAULT_LPR_URL);
    if (res.ok) {
      const json = (await res.json()) as unknown;
      if (isValidLPRPayload(json)) {
        const data: LPRData = { ...json, source: 'live' };
        setCache(data);
        return data;
      }
    }
  } catch {
    // fall through to fallback
  }

  return { ...FALLBACK_LPR, source: 'fallback' };
}
