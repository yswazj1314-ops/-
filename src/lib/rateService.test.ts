import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_LPR, fetchLPR, getCachedLPR } from './rateService';

describe('RateService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns cached value when fresh (< 24h)', async () => {
    const cached = { lpr1y: 3.4, lpr5y: 3.9, asOf: '2026-05-17', source: 'cache' as const };
    localStorage.setItem(
      'rateCache',
      JSON.stringify({ data: cached, timestamp: Date.now() - 1000 * 60 * 60 }),
    );
    const result = await fetchLPR();
    expect(result.lpr1y).toBe(3.4);
    expect(result.source).toBe('cache');
  });

  it('returns fallback when fetch fails and no cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));
    const result = await fetchLPR();
    expect(result.lpr1y).toBe(FALLBACK_LPR.lpr1y);
    expect(result.source).toBe('fallback');
  });

  it('caches the live fetched value', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ lpr1y: 3.5, lpr5y: 4, asOf: '2026-05-15' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const result = await fetchLPR();
    expect(result.source).toBe('live');
    expect(result.lpr1y).toBe(3.5);
    const cached = getCachedLPR();
    expect(cached?.lpr1y).toBe(3.5);
  });

  it('treats cache older than 24h as expired', async () => {
    const old = { lpr1y: 3.2, lpr5y: 3.8, asOf: '2026-05-01', source: 'cache' as const };
    localStorage.setItem(
      'rateCache',
      JSON.stringify({ data: old, timestamp: Date.now() - 1000 * 60 * 60 * 25 }),
    );
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('still down'));
    const result = await fetchLPR();
    expect(result.source).toBe('fallback');
  });

  it('manual override bypasses fetch and cache', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await fetchLPR({ override: { lpr1y: 4, lpr5y: 4.5 } });
    expect(result.lpr1y).toBe(4);
    expect(result.source).toBe('manual');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
