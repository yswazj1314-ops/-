import type { DecisionInput, ScoreReport } from './schema';

export type ProviderConfig =
  | { provider: 'openai'; apiKey: string; model?: string }
  | { provider: 'claude'; apiKey: string; model?: string }
  | { provider: 'custom-openai-compat'; apiKey: string; baseURL: string; model: string };

type Message = { role: 'system' | 'user'; content: string };

const SYSTEM_PROMPT =
  '你是一位理性、坦诚的个人理财顾问。基于用户提供的财务计算结果和个人情况，' +
  '给出建设性的购买建议。请：1) 用 80-150 字的整体判断开头；' +
  '2) 详细说明计算过程，按“原始指标 → 子分 → 加权总分 → 结论”的顺序解释，必须引用关键数字；' +
  '3) 给出 3 条具体建议，并直接指出风险；4) 末尾给一条"如果你仍要买"的优化建议。' +
  '输出使用清晰短段落和一级项目列表，避免嵌套列表，少用 Markdown 符号。语气友好但不奉承。所有金额使用人民币 ¥。';

const ALGORITHM_RULES =
  '算法规则：NPV 由购买支出、年经济收益、情绪收益、维护成本、贷款还款和残值折现得到；' +
  '现金流冲击为购买后储蓄可覆盖的固定支出月数；购买力压力为购买价 /（年收入 + 储蓄 × 30%）；' +
  '单位使用成本为（购买价 + 维护成本 × 年限 - 残值）/ 年限。' +
  '综合评分 = NPV 分 × 40% + 现金流冲击分 × 25% + 购买力压力分 × 20% + 单位使用成本分 × 15%。' +
  '≥75 推荐购买，50-74 谨慎考虑，<50 不推荐。';

export function buildPrompt(input: DecisionInput, report: ScoreReport): Message[] {
  const userPayload = {
    input,
    metrics: report.rawMetrics,
    subscores: report.subscores,
    compositeScore: report.compositeScore,
    verdict: report.verdict,
    diagnostics: report.diagnostics,
    discountRate: report.discountRate,
  };

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `请评估这笔购买决策。商品："${input.itemName}"，综合评分 ${report.compositeScore.toFixed(0)}/100，` +
        `结论"${report.verdict}"。\n\n${ALGORITHM_RULES}\n\n` +
        '请不要只复述结论，要把这次分数如何从输入推导出来讲清楚。详细数据如下 JSON：\n\n' +
        '```json\n' +
        JSON.stringify(userPayload, null, 2) +
        '\n```',
    },
  ];
}

async function* readSSE(res: Response): AsyncGenerator<string> {
  if (!res.body) throw new Error('empty response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx = buf.indexOf('\n\n');
    while (idx !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of block.split('\n')) {
        if (line.startsWith('data: ')) yield line.slice(6);
      }
      idx = buf.indexOf('\n\n');
    }
  }
}

async function* streamOpenAI(
  baseURL: string,
  apiKey: string,
  model: string,
  messages: Message[],
): AsyncGenerator<string> {
  const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok) throw new Error(`LLM API ${res.status}: ${await res.text()}`);

  for await (const data of readSSE(res)) {
    if (data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    } catch {
      // ignore non-JSON SSE frames
    }
  }
}

async function* streamClaude(apiKey: string, model: string, messages: Message[]): AsyncGenerator<string> {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const userMessages = messages.filter((m) => m.role !== 'system');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: 1024,
      stream: true,
      messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);

  for await (const data of readSSE(res)) {
    try {
      const parsed = JSON.parse(data) as {
        type?: string;
        delta?: { text?: string };
      };
      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
        yield parsed.delta.text;
      }
    } catch {
      // ignore non-JSON SSE frames
    }
  }
}

export async function* streamReview(
  input: DecisionInput,
  report: ScoreReport,
  cfg: ProviderConfig,
): AsyncGenerator<string> {
  const messages = buildPrompt(input, report);
  if (cfg.provider === 'claude') {
    yield* streamClaude(cfg.apiKey, cfg.model ?? 'claude-sonnet-4-6', messages);
    return;
  }
  if (cfg.provider === 'openai') {
    yield* streamOpenAI('https://api.openai.com/v1', cfg.apiKey, cfg.model ?? 'gpt-4o', messages);
    return;
  }
  yield* streamOpenAI(cfg.baseURL, cfg.apiKey, cfg.model, messages);
}
