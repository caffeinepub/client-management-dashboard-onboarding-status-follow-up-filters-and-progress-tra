import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Phone, Download, Eye } from 'lucide-react';
import { formatClientCode } from '../../utils/clientCode';
import { useRouter } from '../../hooks/useRouter';
import { useConvertToFullOnboarding, usePrepareClientsForExport } from '../../hooks/useQueries';
import type { ClientSummary, ExtendedClient } from '../../backend';
import { ExportClientsExcelDialog } from '../clients/ExportClientsExcelDialog';
import { ConvertToFullOnboardingButton } from '../clients/ConvertToFullOnboardingButton';
import { toast } from 'sonner';
import { normalizeError } from '../../utils/errors';

interface OnboardingClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  isLoading: boolean;
}

export function OnboardingClientsDialog({
  open,
  onOpenChange,
  clients,
  isLoading,
}: OnboardingClientsDialogProps) {
  const { navigate } = useRouter();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [preparedClients, setPreparedClients] = useState<ExtendedClient[]>([]);
  const prepareForExport = usePrepareClientsForExport();
  const convertToFull = useConvertToFullOnboarding();

  const handleViewClient = (clientCode: bigint) => {
    navigate(`client/${clientCode.toString()}`);
    onOpenChange(false);
  };

  const handleExport = async () => {
    if (clients.length === 0) {
      toast.error('No clients to export');
      return;
    }

    try {
      const clientCodes = clients.map((c) => c.code);
      const fullClients = await prepareForExport.mutateAsync(clientCodes);
      setPreparedClients(fullClients);
      setExportDialogOpen(true);
    } catch (error) {
      console.error('Failed to prepare clients for export:', error);
      toast.error('Failed to prepare export data');
    }
  };

  const handleConvert = async (clientCode: bigint) => {
    try {
      await convertToFull.mutateAsync(clientCode);
      toast.success('Client converted to full onboarding successfully!');
    } catch (error) {
      toast.error(normalizeError(error));
      console.error('Convert to full onboarding error:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Onboarding Clients</DialogTitle>
            <DialogDescription>Clients pending activation</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No clients in onboarding</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {clients.length} {clients.length === 1 ? 'client' : 'clients'} found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={prepareForExport.isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {prepareForExport.isPending ? 'Preparing...' : 'Export'}
                  </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Mobile Number</TableHead>
                        <TableHead>Onboarding State</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.code.toString()}>
                          <TableCell className="font-medium">
                            {formatClientCode(client.code.toString())}
                          </TableCell>
                          <TableCell>{client.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{client.mobileNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              client.onboardingState === 'half'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {client.onboardingState === 'half' ? 'Half' : 'Full'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {client.onboardingState === 'half' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConvert(client.code);
                                  }}
                                  disabled={convertToFull.isPending}
                                >
                                  Convert to Full
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewClient(client.code)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ExportClientsExcelDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        clients={preparedClients}
      />
    </>
  );
}
