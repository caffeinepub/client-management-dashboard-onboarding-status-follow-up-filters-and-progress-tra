import { useState } from 'react';
import { useGetClientsByFollowUpDay, useGetAllClientSummaries } from '../hooks/useQueries';
import { useRouter } from '../hooks/useRouter';
import { FollowUpDay } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Clock, StickyNote, Users, Pause, AlertCircle } from 'lucide-react';
import { ClientStatusBadge } from '../components/clients/ClientStatusBadge';
import { getDisplayStatus, computeClientMetrics } from '../utils/status';
import { formatDate } from '../utils/format';
import { formatClientCode } from '../utils/clientCode';

const followUpDays: { value: FollowUpDay; label: string }[] = [
  { value: FollowUpDay.monday, label: 'Monday' },
  { value: FollowUpDay.tuesday, label: 'Tuesday' },
  { value: FollowUpDay.wednesday, label: 'Wednesday' },
  { value: FollowUpDay.thursday, label: 'Thursday' },
  { value: FollowUpDay.friday, label: 'Friday' },
  { value: FollowUpDay.saturday, label: 'Saturday' },
  { value: FollowUpDay.sunday, label: 'Sunday' },
];

export function DashboardPage() {
  const [selectedDay, setSelectedDay] = useState<FollowUpDay | null>(FollowUpDay.monday);
  const { data: allSummaries, isLoading: allSummariesLoading } = useGetAllClientSummaries();
  const { data: clients, isLoading: followUpLoading } = useGetClientsByFollowUpDay(selectedDay);
  const { navigate } = useRouter();

  const metrics = allSummaries ? computeClientMetrics(allSummaries) : { active: 0, paused: 0, expired: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage follow-ups and track client progress</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-600/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold">
                {allSummariesLoading ? '...' : metrics.active}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paused Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-600/10 flex items-center justify-center">
                <Pause className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold">
                {allSummariesLoading ? '...' : metrics.paused}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-600/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold">
                {allSummariesLoading ? '...' : metrics.expired}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Follow-up Schedule</CardTitle>
              <CardDescription>View clients scheduled for follow-up by day</CardDescription>
            </div>
            <Select
              value={selectedDay || undefined}
              onValueChange={(value) => setSelectedDay(value as FollowUpDay)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {followUpDays.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {followUpLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : clients && clients.length > 0 ? (
            <div className="space-y-3">
              {clients.map((client) => (
                <div
                  key={client.code.toString()}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`client/${client.code.toString()}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{client.name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {formatClientCode(client.code.toString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{client.mobileNumber}</span>
                      </div>
                    </div>
                    {client.endDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Ends: {formatDate(client.endDate)}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`client/${client.code.toString()}`);
                  }}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No clients scheduled for follow-up on {selectedDay}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
