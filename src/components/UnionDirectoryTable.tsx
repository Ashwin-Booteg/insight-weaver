import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface Props {
  data: Record<string, unknown>[];
  columns: { name: string }[];
  className?: string;
}

const PAGE_SIZE = 25;

const DISPLAY_COLUMNS = [
  { key: 'state', label: 'State', type: 'text' },
  { key: 'movie', label: 'Movie Unions', type: 'number' },
  { key: 'music', label: 'Music Unions', type: 'number' },
  { key: 'fashion', label: 'Fashion Unions', type: 'number' },
  { key: 'total', label: 'Total', type: 'number' },
  { key: 'keyUnions', label: 'Key Unions', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'text' },
] as const;

function detectRawColumns(data: Record<string, unknown>[]) {
  if (data.length === 0) return { state: '', movie: '__EMPTY', music: '__EMPTY_1', fashion: '__EMPTY_2', total: '__EMPTY_3', keyUnions: '__EMPTY_4', notes: '__EMPTY_5' };
  const keys = Object.keys(data[0]);
  const stateCol = keys.find(k =>
    !k.startsWith('__EMPTY') && !k.startsWith('_') && !k.includes('normalized') && !k.includes('category')
  ) || '';
  return {
    state: stateCol,
    movie: '__EMPTY',
    music: '__EMPTY_1',
    fashion: '__EMPTY_2',
    total: '__EMPTY_3',
    keyUnions: '__EMPTY_4',
    notes: '__EMPTY_5',
  };
}

interface CleanRow {
  state: string;
  movie: number;
  music: number;
  fashion: number;
  total: number;
  keyUnions: string;
  notes: string;
}

export function UnionDirectoryTable({ data, className }: Props) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  const cleanData = useMemo<CleanRow[]>(() => {
    const cols = detectRawColumns(data);
    return data
      .filter(row => {
        const totalVal = Number(row[cols.total]);
        if (isNaN(totalVal) || totalVal <= 0) return false;
        const stateVal = String(row[cols.state] || '').toLowerCase();
        if (stateVal.includes('total') || stateVal.includes('state') || !stateVal) return false;
        return true;
      })
      .map(row => ({
        state: String(row[cols.state] || '-'),
        movie: Number(row[cols.movie]) || 0,
        music: Number(row[cols.music]) || 0,
        fashion: Number(row[cols.fashion]) || 0,
        total: Number(row[cols.total]) || 0,
        keyUnions: String(row[cols.keyUnions] || '-'),
        notes: String(row[cols.notes] || '-'),
      }));
  }, [data]);

  const filteredData = useMemo(() => {
    let result = cleanData;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.state.toLowerCase().includes(s) ||
        r.keyUnions.toLowerCase().includes(s) ||
        r.notes.toLowerCase().includes(s)
      );
    }
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.column as keyof CleanRow];
        const bVal = b[sortConfig.column as keyof CleanRow];
        let cmp = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        else cmp = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [cleanData, searchTerm, sortConfig]);

  const pageCount = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    setSortConfig(prev => {
      if (prev?.column === col) {
        if (prev.direction === 'asc') return { column: col, direction: 'desc' };
        return null;
      }
      return { column: col, direction: 'asc' };
    });
  };

  const exportToCSV = () => {
    const headers = DISPLAY_COLUMNS.map(c => c.label);
    const rows = filteredData.map(r => DISPLAY_COLUMNS.map(c => {
      const v = r[c.key as keyof CleanRow];
      return String(v).includes(',') ? `"${v}"` : String(v);
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'union_directory.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(r => {
      const obj: Record<string, unknown> = {};
      DISPLAY_COLUMNS.forEach(c => { obj[c.label] = r[c.key as keyof CleanRow]; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unions');
    XLSX.writeFile(wb, 'union_directory.xlsx');
  };

  return (
    <div className={cn('data-table-container', className)}>
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search states, unions..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filteredData.length} states</span>
          <Button variant="outline" size="sm" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}><Download className="w-4 h-4 mr-2" />Excel</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {DISPLAY_COLUMNS.map(col => (
                <TableHead key={col.key} className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {sortConfig?.column === col.key
                      ? sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                      : <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow><TableCell colSpan={DISPLAY_COLUMNS.length} className="text-center text-muted-foreground py-8">No data found</TableCell></TableRow>
            ) : paginatedData.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/30">
                {DISPLAY_COLUMNS.map(col => (
                  <TableCell key={col.key} className="max-w-[200px]">
                    <span className="truncate block" title={String(row[col.key as keyof CleanRow])}>
                      {col.type === 'number' ? (row[col.key as keyof CleanRow] as number).toLocaleString() : String(row[col.key as keyof CleanRow])}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {pageCount}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}><ChevronsLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(pageCount - 1)} disabled={page === pageCount - 1}><ChevronsRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
