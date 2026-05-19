import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Subscores } from '@/lib/schema';

export function RadarChartCard({ subscores }: { subscores: Subscores }) {
  const data = [
    { metric: 'NPV', score: subscores.npv },
    { metric: '现金流冲击', score: subscores.runway },
    { metric: '购买力压力', score: subscores.pressure },
    { metric: '单位使用成本', score: subscores.perYear },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>分项评分</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <div className="sr-only">
          {data.map((item) => (
            <span key={item.metric}>{item.metric}</span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar dataKey="score" fill="#0f766e" fillOpacity={0.28} stroke="#0f766e" />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
