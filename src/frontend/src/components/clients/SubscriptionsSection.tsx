import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '../../utils/format';
import type { Subscription } from '../../backend';

interface SubscriptionsSectionProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
}

export function SubscriptionsSection({ subscriptions, isLoading }: SubscriptionsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No subscriptions yet</p>
        </CardContent>
      </Card>
    );
  }

  // Sort subscriptions by start date (most recent first)
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    return Number(b.startDate - a.startDate);
  });

  // Determine which subscription is current (most recent one)
  const currentSubscriptionIndex = 0;
  const now = BigInt(Date.now() * 1_000_000);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Plan Duration</TableHead>
              <TableHead>Extra Days</TableHead>
              <TableHead>Total Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubscriptions.map((subscription, index) => {
              const isCurrent = index === currentSubscriptionIndex;
              const isActive = now >= subscription.startDate && now <= subscription.endDate;
              const totalDays = Number(subscription.planDurationDays + subscription.extraDays);
              
              return (
                <TableRow key={subscription.createdAt.toString()}>
                  <TableCell>
                    {isCurrent && isActive ? (
                      <Badge variant="default">Current</Badge>
                    ) : isCurrent ? (
                      <Badge variant="secondary">Latest</Badge>
                    ) : (
                      <Badge variant="outline">Past</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>{formatDate(subscription.endDate)}</TableCell>
                  <TableCell>{subscription.planDurationDays.toString()} days</TableCell>
                  <TableCell>{subscription.extraDays.toString()} days</TableCell>
                  <TableCell className="font-medium">{totalDays} days</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
