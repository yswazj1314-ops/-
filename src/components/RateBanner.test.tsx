import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RateBanner } from './RateBanner';

describe('RateBanner', () => {
  it('renders compact summary on live source', () => {
    render(<RateBanner data={{ lpr1y: 3.45, lpr5y: 3.95, asOf: '2026-05-10', source: 'live' }} onOverride={vi.fn()} />);
    expect(screen.getByText(/3\.45/)).toBeInTheDocument();
  });

  it('shows warning style on fallback source', () => {
    const { container } = render(
      <RateBanner data={{ lpr1y: 3.45, lpr5y: 3.95, asOf: '2026-05-01', source: 'fallback' }} onOverride={vi.fn()} />,
    );
    expect(container.querySelector('[data-tone="warn"]')).not.toBeNull();
  });

  it('triggers onOverride when user submits manual values', async () => {
    const onOverride = vi.fn();
    const user = userEvent.setup();
    render(<RateBanner data={{ lpr1y: 3.45, lpr5y: 3.95, asOf: '2026-05-01', source: 'fallback' }} onOverride={onOverride} />);
    await user.click(screen.getByRole('button', { name: /手动输入/ }));
    await user.clear(screen.getByLabelText(/LPR 1Y/));
    await user.type(screen.getByLabelText(/LPR 1Y/), '3.5');
    await user.clear(screen.getByLabelText(/LPR 5Y/));
    await user.type(screen.getByLabelText(/LPR 5Y/), '4.0');
    await user.click(screen.getByRole('button', { name: /应用/ }));
    expect(onOverride).toHaveBeenCalledWith({ lpr1y: 3.5, lpr5y: 4 });
  });
});
