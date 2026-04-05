/**
 * Utility to export an array of data objects to CSV
 */
export const exportToCSV = (data: any[], fileName: string, columns: { key: string; header: string }[]) => {
  if (!data || !data.length) return;

  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      const cellValue = item[col.key] ?? '';
      // Escape commas and wrap in quotes to handle special characters
      const escapedValue = String(cellValue).replace(/"/g, '""');
      return `"${escapedValue}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
