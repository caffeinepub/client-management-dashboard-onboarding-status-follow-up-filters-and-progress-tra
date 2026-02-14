import type { ExtendedClient } from '../backend';
import type { ClientExportField } from './clientExportFields';

// Using SheetJS (xlsx) library via CDN
// The library is loaded from CDN in index.html
declare const XLSX: any;

export function exportClientsToExcel(
  clients: ExtendedClient[],
  fields: ClientExportField[],
  filename: string
): void {
  if (typeof XLSX === 'undefined') {
    throw new Error('XLSX library not loaded. Please ensure the SheetJS library is included.');
  }

  // Build header row
  const headers = fields.map(field => field.label);

  // Build data rows
  const rows = clients.map(client => {
    return fields.map(field => {
      const value = field.accessor(client);
      // Handle different value types
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (value === null || value === undefined) {
        return '';
      }
      return value;
    });
  });

  // Combine headers and rows
  const worksheetData = [headers, ...rows];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns based on content
  const columnWidths = headers.map((header, colIndex) => {
    const headerLength = header.length;
    const maxDataLength = Math.max(
      ...rows.map(row => {
        const cell = row[colIndex];
        return cell ? String(cell).length : 0;
      })
    );
    return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, 50) };
  });
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

  // Generate and download file
  XLSX.writeFile(workbook, filename, { compression: true });
}
