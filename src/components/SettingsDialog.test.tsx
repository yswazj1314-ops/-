import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsDialog } from './SettingsDialog';

describe('SettingsDialog', () => {
  it('saves settings on submit', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SettingsDialog open onOpenChange={vi.fn()} onSave={onSave} initial={null} />);
    await user.type(screen.getByLabelText(/API Key/i), 'fake-api-key');
    await user.click(screen.getByRole('button', { name: /保存/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'fake-api-key' }));
  });
});
