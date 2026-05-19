import { Fragment, type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  startStream: () => AsyncGenerator<string>;
};

type TextBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; text: string };

function normalizeMarkdownNoise(value: string): string {
  return value
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function renderInline(value: string): ReactNode[] {
  const parts = normalizeMarkdownNoise(value).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-slate-950">
          {part.slice(2, -2).trim()}
        </strong>
      );
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function parseBlocks(value: string): TextBlock[] {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    blocks.push({ kind: 'list', items: list });
    list = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^#{1,3}\s+(.+)$/) ?? trimmed.match(/^\*\*([^*]{2,28})[:：]?\*\*$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', text: heading[1] });
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/) ?? trimmed.match(/^\d+[.)、]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function ReviewText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div data-testid="llm-output" className="min-h-24 space-y-4 text-sm leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h4 key={`${block.text}-${index}`} className="pt-1 text-base font-semibold text-slate-950">
              {renderInline(block.text)}
            </h4>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={`list-${index}`} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={`${block.text}-${index}`}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

export function LLMReview({ hasApiKey, onOpenSettings, startStream }: Props) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setText('');
    setError(null);
    setState('streaming');
    try {
      for await (const piece of startStream()) {
        setText((prev) => prev + piece);
      }
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setState('error');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 顾问点评</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasApiKey ? (
          <div className="space-y-2 text-sm">
            <p>请先完成密钥设置，才能调用大模型生成点评。</p>
            <Button onClick={onOpenSettings} variant="outline">
              配置 API Key
            </Button>
          </div>
        ) : state === 'idle' ? (
          <Button onClick={run}>生成点评</Button>
        ) : (
          <>
            <ReviewText text={text} />
            {state === 'streaming' && <p className="text-sm text-slate-500">生成中...</p>}
            {state === 'error' && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-red-500">
                调用失败：{error}
                <Button size="sm" variant="outline" onClick={run}>
                  重试
                </Button>
              </div>
            )}
            {state === 'done' && (
              <Button size="sm" variant="outline" onClick={run}>
                重新生成
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
