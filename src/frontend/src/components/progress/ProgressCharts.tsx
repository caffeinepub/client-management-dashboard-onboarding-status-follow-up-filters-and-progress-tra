import type { ClientProgress } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDate } from '../../utils/format';
import { Weight, Ruler } from 'lucide-react';

interface ProgressChartsProps {
  progress: ClientProgress[];
}

export function ProgressCharts({ progress }: ProgressChartsProps) {
  if (progress.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No progress data available</p>
            <p className="text-sm mt-1">Add measurements to see charts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedProgress = [...progress].sort((a, b) => Number(a.timestamp - b.timestamp));

  const weightData = sortedProgress.map((entry) => ({
    date: formatDate(entry.timestamp),
    weight: entry.weightKg,
  }));

  const measurementsData = sortedProgress.map((entry) => ({
    date: formatDate(entry.timestamp),
    neck: entry.neckInch,
    chest: entry.chestInch,
    waist: entry.waistInch,
    hips: entry.hipsInch,
    thigh: entry.thighInch,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5 text-primary" />
            Weight Progress
          </CardTitle>
          <CardDescription>Track weight changes over time (kg)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))' }}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Body Measurements
          </CardTitle>
          <CardDescription>Track body measurements over time (inches)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={measurementsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="neck"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="Neck"
              />
              <Line
                type="monotone"
                dataKey="chest"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Chest"
              />
              <Line
                type="monotone"
                dataKey="waist"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                name="Waist"
              />
              <Line
                type="monotone"
                dataKey="hips"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                name="Hips"
              />
              <Line
                type="monotone"
                dataKey="thigh"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                name="Thigh"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
