import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App integration', () => {
  it('opens the algorithm rules dialog', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /计算规则/ }));

    expect(await screen.findByText(/价值计算规则/)).toBeInTheDocument();
    expect(screen.getByText(/购买力压力：购买价/)).toBeInTheDocument();
  });

  it('shows results panel after submitting valid form', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/商品名称/), '相机');
    await user.type(screen.getByLabelText(/购买价格/), '20000');
    await user.type(screen.getByLabelText(/预计使用年限/), '5');
    await user.type(screen.getByLabelText(/主要用途/), '摄影');
    await user.type(screen.getByLabelText(/预计残值/), '8000');
    await user.type(screen.getByLabelText(/年均维护成本/), '200');
    await user.type(screen.getByLabelText(/年龄/), '30');
    await user.type(screen.getByLabelText(/月收入/), '20000');
    await user.type(screen.getByLabelText(/总储蓄/), '80000');
    await user.type(screen.getByLabelText(/月固定支出/), '10000');

    await user.click(screen.getByRole('button', { name: /开始分析/ }));

    expect(await screen.findByText(/分项评分/)).toBeInTheDocument();
    expect(screen.getByText(/AI 顾问点评/)).toBeInTheDocument();
  });
});
