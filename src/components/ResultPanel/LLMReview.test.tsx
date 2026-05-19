import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LLMReview } from './LLMReview';

async function* mockStream(chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

describe('LLMReview', () => {
  it('shows configure-key prompt when no apiKey', () => {
    render(<LLMReview startStream={() => mockStream(['ignored'])} hasApiKey={false} onOpenSettings={vi.fn()} />);
    expect(screen.getByText(/配置 API Key/)).toBeInTheDocument();
  });

  it('streams chunks and concatenates them when key is present', async () => {
    const user = userEvent.setup();
    render(<LLMReview startStream={() => mockStream(['这是', '一段', '点评'])} hasApiKey onOpenSettings={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /生成点评/ }));
    await waitFor(() => {
      expect(screen.getByTestId('llm-output')).toHaveTextContent('这是一段点评');
    });
  });

  it('renders markdown-like bold and bullets as formatted content', async () => {
    const user = userEvent.setup();
    render(
      <LLMReview
        startStream={() => mockStream(['**整体判断：** 可以买\n\n* **NPV**：100分'])}
        hasApiKey
        onOpenSettings={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /生成点评/ }));
    await waitFor(() => {
      expect(screen.getByTestId('llm-output')).toHaveTextContent('整体判断：可以买');
      expect(screen.getByText('NPV')).toBeInTheDocument();
    });
    expect(screen.getByTestId('llm-output')).not.toHaveTextContent('**NPV**');
  });

  it('shows retry button on stream error', async () => {
    const user = userEvent.setup();
    async function* errorStream(): AsyncGenerator<string> {
      yield '开始';
      throw new Error('API 401');
    }
    render(<LLMReview startStream={() => errorStream()} hasApiKey onOpenSettings={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /生成点评/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument());
  });
});
