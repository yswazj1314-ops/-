import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputForm } from './index';

describe('InputForm', () => {
  it('shows validation error when itemName empty on submit', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /开始分析/ }));
    expect(await screen.findByText(/商品名称必填/)).toBeInTheDocument();
  });

  it('submits valid form data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InputForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/商品名称/), '相机');
    await user.type(screen.getByLabelText(/购买价格/), '20000');
    await user.type(screen.getByLabelText(/预计使用年限/), '5');
    await user.type(screen.getByLabelText(/主要用途/), '摄影');
    await user.type(screen.getByLabelText(/年均维护成本/), '200');
    await user.type(screen.getByLabelText(/预计残值/), '8000');
    await user.type(screen.getByLabelText(/年龄/), '30');
    await user.type(screen.getByLabelText(/月收入/), '20000');
    await user.type(screen.getByLabelText(/总储蓄/), '80000');
    await user.type(screen.getByLabelText(/月固定支出/), '10000');
    await user.click(screen.getByRole('button', { name: /开始分析/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ itemName: '相机', price: 20000 });
  });

  it('shows loan sub-fields when financing=loan selected', async () => {
    const user = userEvent.setup();
    render(<InputForm onSubmit={vi.fn()} />);
    await user.click(screen.getByLabelText(/分期付款/));
    expect(screen.getByLabelText(/贷款利率/)).toBeInTheDocument();
    expect(screen.getByLabelText(/首付/)).toBeInTheDocument();
  });
});
