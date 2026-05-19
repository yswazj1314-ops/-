import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPrompt, streamReview } from './llmService';
import type { DecisionInput, ScoreReport } from './schema';

const input: DecisionInput = {
  itemName: '相机',
  price: 20000,
  usageYears: 5,
  purpose: '摄影',
  annualEconomicReturn: 0,
  emotionScore: 8,
  annualMaintenance: 200,
  salvageValue: 8000,
  financing: { type: 'cash' },
  age: 30,
  monthlyIncome: 20000,
  savings: 80000,
  monthlyExpense: 10000,
  monthlyDebtPayment: 0,
  riskProfile: 'balanced',
};

const report: ScoreReport = {
  discountRate: 0.0345,
  rawMetrics: { npv: -2000, pressureRatio: 0.08, runwayMonths: 6, annualUnitCost: 2600 },
  subscores: { npv: 50, runway: 80, pressure: 100, perYear: 0 },
  compositeScore: 65,
  verdict: '谨慎考虑',
  diagnostics: ['净现值为负'],
};

function makeSSEResponse(chunks: string[]): Response {
  const body = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      chunks.forEach((chunk) => controller.enqueue(enc.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('buildPrompt', () => {
  it('embeds itemName and verdict', () => {
    const messages = buildPrompt(input, report);
    const userMsg = messages.find((m) => m.role === 'user')?.content;
    expect(userMsg).toContain('相机');
    expect(userMsg).toContain('谨慎考虑');
  });

  it('mentions diagnostics', () => {
    const messages = buildPrompt(input, report);
    const userMsg = messages.find((m) => m.role === 'user')?.content;
    expect(userMsg).toContain('净现值为负');
  });

  it('asks the model to explain the calculation process', () => {
    const messages = buildPrompt(input, report);
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const userMsg = messages.find((m) => m.role === 'user')?.content;
    expect(systemMsg).toContain('详细说明计算过程');
    expect(userMsg).toContain('综合评分 = NPV 分');
  });
});

describe('streamReview - OpenAI compatible', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('parses SSE chunks and yields concatenated text', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeSSEResponse([
        'data: {"choices":[{"delta":{"content":"建议"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"购买"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const out: string[] = [];
    for await (const piece of streamReview(input, report, {
      provider: 'openai',
      apiKey: 'test-openai-key',
      model: 'gpt-4o',
    })) {
      out.push(piece);
    }
    expect(out.join('')).toBe('建议购买');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-openai-key' }),
      }),
    );
  });

  it('passes custom baseURL when provider is custom-openai-compat', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeSSEResponse(['data: [DONE]\n\n']));
    for await (const _piece of streamReview(input, report, {
      provider: 'custom-openai-compat',
      apiKey: 'test-openai-key',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    })) {
      // drain
    }
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.deepseek.com/v1/chat/completions');
  });

  it('throws on non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    await expect(async () => {
      for await (const _piece of streamReview(input, report, {
        provider: 'openai',
        apiKey: 'bad',
        model: 'gpt-4o',
      })) {
        // drain
      }
    }).rejects.toThrow(/401/);
  });
});

describe('streamReview - Claude', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses Claude messages endpoint with x-api-key header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeSSEResponse([
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"建议"}}\n\n',
        'event: message_stop\n',
        'data: {"type":"message_stop"}\n\n',
      ]),
    );
    const out: string[] = [];
    for await (const piece of streamReview(input, report, {
      provider: 'claude',
      apiKey: 'test-claude-key',
      model: 'claude-sonnet-4-6',
    })) {
      out.push(piece);
    }
    expect(out.join('')).toBe('建议');
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      'x-api-key': 'test-claude-key',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    });
  });
});
