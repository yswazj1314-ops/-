import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadarChartCard } from './RadarChartCard';

describe('RadarChartCard', () => {
  it('renders all four axis labels', () => {
    render(<RadarChartCard subscores={{ npv: 80, runway: 70, pressure: 90, perYear: 60 }} />);
    expect(screen.getByText('NPV')).toBeInTheDocument();
    expect(screen.getByText('现金流冲击')).toBeInTheDocument();
    expect(screen.getByText('购买力压力')).toBeInTheDocument();
    expect(screen.getByText('单位使用成本')).toBeInTheDocument();
  });
});
