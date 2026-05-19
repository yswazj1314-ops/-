import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlgorithmDialog } from './AlgorithmDialog';

describe('AlgorithmDialog', () => {
  it('renders the score formula and verdict thresholds', () => {
    render(<AlgorithmDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/综合评分 = NPV 分/)).toBeInTheDocument();
    expect(screen.getByText(/≥ 75：推荐购买/)).toBeInTheDocument();
  });
});
