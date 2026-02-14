import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { ExtendedClient } from '../../backend';
import { getFollowUpStatus } from '../../utils/followUp';
import { formatDateTime } from '../../utils/format';

interface FollowUpSectionProps {
  client: ExtendedClient;
}

export function FollowUpSection({ client }: FollowUpSectionProps) {
  const { isDone, latestEntry } = getFollowUpStatus(client);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Follow-up Status
        </CardTitle>
        <CardDescription>Track follow-up completion and notes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
          {isDone ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">Done</p>
                <p className="text-sm text-muted-foreground">Latest follow-up completed</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400">Not done</p>
                <p className="text-sm text-muted-foreground">Follow-up pending</p>
              </div>
            </>
          )}
        </div>

        {/* Follow-up History */}
        {client.followUpHistory.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-3">Follow-up History</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.followUpHistory
                    .slice()
                    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                    .map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {formatDateTime(entry.timestamp)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {entry.followUpDay}
                        </TableCell>
                        <TableCell>
                          {entry.done ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              <XCircle className="h-3 w-3" />
                              Not done
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          {entry.notes ? (
                            <span className="text-sm whitespace-pre-wrap">{entry.notes}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No follow-up history yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
