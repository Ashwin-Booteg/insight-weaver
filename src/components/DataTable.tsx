import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataColumn } from '@/types/analytics';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: DataColumn[];
  className?: string;
}

const PAGE_SIZE = 25;

export function DataTable({ data, columns, className }: DataTableProps) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Show ALL columns from the file (excluding only the normalized helper columns)
  const displayColumns = useMemo(() => {
    return columns.filter(col => !col.name.endsWith('_normalized'));
  }, [columns]);
  
  const filteredData = useMemo(() => {
    let result = data;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(value =>
          value !== null && value !== undefined && String(value).toLowerCase().includes(searchLower)
        )
      );
    }
    
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [data, searchTerm, sortConfig]);
  
  const pageCount = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  
  const handleSort = (columnName: string) => {
    setSortConfig(prev => {
      if (prev?.column === columnName) {
        if (prev.direction === 'asc') return { column: columnName, direction: 'desc' };
        return null;
      }
      return { column: columnName, direction: 'asc' };
    });
  };
  
  const exportToExcel = () => {
    const exportData = filteredData.map(row => {
      const cleanRow: Record<string, unknown> = {};
      for (const col of columns) {
        if (!col.name.endsWith('_normalized')) {
          let value = row[col.name];
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          }
          cleanRow[col.name] = value;
        }
      }
      return cleanRow;
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, 'filtered_data.xlsx');
  };
  
  const exportToCSV = () => {
    const headers = columns.filter(c => !c.name.endsWith('_normalized')).map(c => c.name);
    const rows = filteredData.map(row =>
      headers.map(h => {
        const value = row[h];
        if (value instanceof Date) return value.toISOString().split('T')[0];
        if (value === null || value === undefined) return '';
        return String(value).includes(',') ? `"${value}"` : String(value);
      }).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className={cn('data-table-container', className)}>
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredData.length.toLocaleString()} records
          </span>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {displayColumns.map((col) => (
                <TableHead
                  key={col.name}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort(col.name)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{formatColumnName(col.name)}</span>
                    <SortIcon column={col.name} sortConfig={sortConfig} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="text-center text-muted-foreground py-8">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-muted/30">
                  {displayColumns.map((col) => (
                    <TableCell key={col.name} className="max-w-[200px]">
                      <span className="truncate block" title={String(row[col.name] || '')}>
                        {formatCellValue(row[col.name], col.type)}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {pageCount > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {pageCount}
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pageCount - 1)}
              disabled={page === pageCount - 1}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortIcon({ column, sortConfig }: { column: string; sortConfig: { column: string; direction: 'asc' | 'desc' } | null }) {
  if (sortConfig?.column !== column) {
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
  }
  
  return sortConfig.direction === 'asc' 
    ? <ArrowUp className="w-3 h-3 text-primary" />
    : <ArrowDown className="w-3 h-3 text-primary" />;
}

function formatCellValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return '-';
  
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}
