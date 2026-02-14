import { useState } from 'react';
import { useGetClientsByFollowUpDay, useGetAllClients } from '../hooks/useQueries';
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
  const { data: clients, isLoading } = useGetClientsByFollowUpDay(selectedDay);
  const { data: allClients, isLoading: allClientsLoading } = useGetAllClients();
  const { navigate } = useRouter();

  const metrics = allClients ? computeClientMetrics(allClients) : { active: 0, paused: 0, expired: 0 };

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
                {allClientsLoading ? '...' : metrics.active}
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
                {allClientsLoading ? '...' : metrics.paused}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-600/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold">
                {allClientsLoading ? '...' : metrics.expired}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Follow-up Schedule
          </CardTitle>
          <CardDescription>View clients scheduled for follow-up on a specific day (Active clients only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Day:</label>
            <Select
              value={selectedDay || ''}
              onValueChange={(value) => setSelectedDay(value as FollowUpDay)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a day" />
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-sm text-muted-foreground">Loading clients...</p>
              </div>
            </div>
          ) : clients && clients.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b">
                <span>Scheduled for {followUpDays.find(d => d.value === selectedDay)?.label}</span>
                <span className="font-medium">{clients.length} {clients.length === 1 ? 'client' : 'clients'}</span>
              </div>
              <div className="grid gap-3">
                {clients.map((client) => {
                  const displayStatus = getDisplayStatus(client);
                  return (
                    <Card key={client.code.toString()} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`client/${client.code.toString()}`)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{client.name}</h3>
                              <ClientStatusBadge status={displayStatus} />
                            </div>
                            <div className="grid gap-1.5 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{client.mobileNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Code: {formatClientCode(client.code)}</span>
                              </div>
                              {client.endDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>End Date: {formatDate(client.endDate)}</span>
                                </div>
                              )}
                              {client.notes && (
                                <div className="flex items-start gap-2 pt-1">
                                  <StickyNote className="h-3.5 w-3.5 mt-0.5" />
                                  <span className="line-clamp-2">{client.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`client/${client.code.toString()}`);
                          }}>
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active clients scheduled for {followUpDays.find(d => d.value === selectedDay)?.label}</p>
              <p className="text-sm mt-1">Only activated, non-paused clients appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
