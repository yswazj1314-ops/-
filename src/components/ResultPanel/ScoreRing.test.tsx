import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreRing } from './ScoreRing';

describe('ScoreRing', () => {
  it('renders the score number rounded to integer', () => {
    render(<ScoreRing score={72.6} verdict="谨慎考虑" />);
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('renders the verdict label', () => {
    render(<ScoreRing score={80} verdict="推荐购买" />);
    expect(screen.getByText('推荐购买')).toBeInTheDocument();
  });

  it('applies green color class for >=75', () => {
    const { container } = render(<ScoreRing score={80} verdict="推荐购买" />);
    expect(container.querySelector('[data-tone="positive"]')).not.toBeNull();
  });

  it('applies red color class for <50', () => {
    const { container } = render(<ScoreRing score={30} verdict="不推荐" />);
    expect(container.querySelector('[data-tone="negative"]')).not.toBeNull();
  });
});
