import type { ClientProgress } from '../../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '../../utils/format';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ProgressHistoryTableProps {
  progress: ClientProgress[];
}

export function ProgressHistoryTable({ progress }: ProgressHistoryTableProps) {
  if (progress.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No progress entries yet</p>
        <p className="text-sm mt-1">Add your first measurement to start tracking</p>
      </div>
    );
  }

  const sortedProgress = [...progress].sort((a, b) => Number(b.timestamp - a.timestamp));

  const getTrend = (current: number, previous: number | undefined): 'up' | 'down' | 'neutral' => {
    if (previous === undefined) return 'neutral';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Neck (in)</TableHead>
            <TableHead className="text-right">Chest (in)</TableHead>
            <TableHead className="text-right">Waist (in)</TableHead>
            <TableHead className="text-right">Hips (in)</TableHead>
            <TableHead className="text-right">Thigh (in)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProgress.map((entry, index) => {
            const prevEntry = sortedProgress[index + 1];
            const weightTrend = getTrend(entry.weightKg, prevEntry?.weightKg);
            
            return (
              <TableRow key={entry.timestamp.toString()}>
                <TableCell className="font-medium">{formatDateTime(entry.timestamp)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {entry.weightKg.toFixed(1)}
                    {weightTrend === 'down' && <TrendingDown className="h-3 w-3 text-green-600" />}
                    {weightTrend === 'up' && <TrendingUp className="h-3 w-3 text-red-600" />}
                  </div>
                </TableCell>
                <TableCell className="text-right">{entry.neckInch.toFixed(1)}</TableCell>
                <TableCell className="text-right">{entry.chestInch.toFixed(1)}</TableCell>
                <TableCell className="text-right">{entry.waistInch.toFixed(1)}</TableCell>
                <TableCell className="text-right">{entry.hipsInch.toFixed(1)}</TableCell>
                <TableCell className="text-right">{entry.thighInch.toFixed(1)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
