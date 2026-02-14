import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import { exportClientsToExcel } from '../../utils/excelExport';
import { CLIENT_EXPORT_FIELDS, type ClientExportField } from '../../utils/clientExportFields';
import type { ExtendedClient } from '../../backend';
import { toast } from 'sonner';

interface ExportClientsExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ExtendedClient[];
}

type ExportMode = 'all' | 'select';

export function ExportClientsExcelDialog({
  open,
  onOpenChange,
  clients,
}: ExportClientsExcelDialogProps) {
  const [mode, setMode] = useState<ExportMode>('all');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  const handleExport = () => {
    if (clients.length === 0) {
      toast.error('No clients to export');
      return;
    }

    if (mode === 'select' && selectedFields.size === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      const fieldsToExport = mode === 'all' 
        ? CLIENT_EXPORT_FIELDS 
        : CLIENT_EXPORT_FIELDS.filter(field => selectedFields.has(field.key));

      const filename = clients.length === 1
        ? `client_${clients[0].code}_export.xlsx`
        : `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      exportClientsToExcel(clients, fieldsToExport, filename);
      toast.success('Excel file downloaded successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFields.size === CLIENT_EXPORT_FIELDS.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(CLIENT_EXPORT_FIELDS.map(f => f.key)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
          <DialogDescription>
            Choose which fields to include in the export
            {clients.length === 1 
              ? ` for ${clients[0].name}`
              : ` (${clients.length} clients)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as ExportMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="mode-all" />
              <Label htmlFor="mode-all" className="cursor-pointer">
                Export all fields
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="select" id="mode-select" />
              <Label htmlFor="mode-select" className="cursor-pointer">
                Select specific fields
              </Label>
            </div>
          </RadioGroup>

          {mode === 'select' && (
            <div className="flex-1 overflow-hidden flex flex-col border rounded-md">
              <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                <Label className="text-sm font-medium">Select Fields</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs"
                >
                  {selectedFields.size === CLIENT_EXPORT_FIELDS.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {CLIENT_EXPORT_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-start space-x-2">
                      <Checkbox
                        id={`field-${field.key}`}
                        checked={selectedFields.has(field.key)}
                        onCheckedChange={() => handleFieldToggle(field.key)}
                      />
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor={`field-${field.key}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {field.label}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
