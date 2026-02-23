import React, { useMemo, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Download, ArrowUpDown, ArrowUp, ArrowDown, Building2, MapPin, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ProductionCompanyTableProps {
  data: Record<string, unknown>[];
  columns: { name: string }[];
}

const PAGE_SIZE = 20;

// Key columns we want to display in the directory (in order)
const DIRECTORY_COLUMNS = [
  { key: 'Company', label: 'Company', icon: Building2 },
  { key: 'Industry', label: 'Industry', icon: Briefcase },
  { key: 'Ownership', label: 'Ownership', icon: null },
  { key: 'Company Type', label: 'Type', icon: null },
  { key: 'Specialty', label: 'Specialty', icon: null },
  { key: 'Focus', label: 'Focus', icon: null },
  { key: 'HQ State', label: 'State', icon: MapPin },
  { key: 'State', label: 'State', icon: MapPin },
  { key: 'HQ City', label: 'City', icon: null },
  { key: 'City', label: 'City', icon: null },
  { key: 'Size bracket', label: 'Size', icon: null },
  { key: 'Notable Titles/Artists', label: 'Notable Work', icon: null },
];

function resolveColumns(availableKeys: string[]) {
  const seen = new Set<string>();
  const result: { key: string; label: string }[] = [];
  for (const col of DIRECTORY_COLUMNS) {
    if (availableKeys.includes(col.key) && !seen.has(col.label)) {
      seen.add(col.label);
      result.push({ key: col.key, label: col.label });
    }
  }
  // Add remaining columns not in directory list
  for (const k of availableKeys) {
    if (!result.some(r => r.key === k) && !k.endsWith('_normalized')) {
      result.push({ key: k, label: k });
    }
  }
  return result;
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Movie': 'bg-chart-rose/10 text-chart-rose border-chart-rose/20',
  'Music': 'bg-chart-purple/10 text-chart-purple border-chart-purple/20',
  'Fashion': 'bg-chart-amber/10 text-chart-amber border-chart-amber/20',
};

export function ProductionCompanyTable({ data, columns }: ProductionCompanyTableProps) {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  const availableKeys = useMemo(() => columns.map(c => c.name), [columns]);
  const displayCols = useMemo(() => resolveColumns(availableKeys), [availableKeys]);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q))
      );
    }
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aV = a[sortConfig.column], bV = b[sortConfig.column];
        if (aV == null) return 1;
        if (bV == null) return -1;
        const cmp = typeof aV === 'number' && typeof bV === 'number'
          ? aV - bV
          : String(aV).localeCompare(String(bV));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, searchTerm, sortConfig]);

  const pageCount = Math.ceil(filteredData.length / PAGE_SIZE);
  const paged = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    setSortConfig(prev => {
      if (prev?.column === col) {
        return prev.direction === 'asc' ? { column: col, direction: 'desc' } : null;
      }
      return { column: col, direction: 'asc' };
    });
  };

  const exportCSV = () => {
    const headers = displayCols.map(c => c.label);
    const rows = filteredData.map(row =>
      displayCols.map(c => {
        const v = row[c.key];
        if (v == null) return '';
        const s = String(v);
        return s.includes(',') ? `"${s}"` : s;
      }).join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'production_companies.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const exportData = filteredData.map(row => {
      const clean: Record<string, unknown> = {};
      for (const c of displayCols) clean[c.label] = row[c.key] ?? '';
      return clean;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    XLSX.writeFile(wb, 'production_companies.xlsx');
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Company Directory</h3>
            <p className="text-[11px] text-muted-foreground">{filteredData.length.toLocaleString()} companies</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              className="pl-9 h-8 text-xs rounded-lg"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} className="h-8 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {displayCols.map(col => (
                <TableHead key={col.key} className="cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                  onClick={() => handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {sortConfig?.column === col.key
                      ? sortConfig.direction === 'asc'
                        ? <ArrowUp className="w-3 h-3 text-primary shrink-0" />
                        : <ArrowDown className="w-3 h-3 text-primary shrink-0" />
                      : <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayCols.length} className="text-center text-muted-foreground py-8 text-xs">
                  No companies found
                </TableCell>
              </TableRow>
            ) : paged.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/30">
                {displayCols.map(col => (
                  <TableCell key={col.key} className="max-w-[220px] py-2.5">
                    {col.key === 'Industry' ? (
                      <Badge variant="outline" className={cn('text-[10px] font-semibold border',
                        INDUSTRY_COLORS[String(row[col.key])] || 'bg-muted text-muted-foreground'
                      )}>
                        {String(row[col.key] || '—')}
                      </Badge>
                    ) : col.key === 'Company' ? (
                      <span className="text-xs font-semibold text-foreground truncate block">{String(row[col.key] || '—')}</span>
                    ) : (
                      <span className="text-xs text-foreground/80 truncate block" title={String(row[col.key] || '')}>
                        {row[col.key] != null ? String(row[col.key]) : '—'}
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">Page {page + 1} of {pageCount}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(0)} disabled={page === 0}>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPage(pageCount - 1)} disabled={page === pageCount - 1}>
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
