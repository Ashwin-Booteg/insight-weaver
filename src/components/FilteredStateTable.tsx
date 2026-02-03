import React, { useState, useMemo } from 'react';
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StateSummary, RoleMetadata, IndustryCategory } from '@/types/filters';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface FilteredStateTableProps {
  stateSummaries: StateSummary[];
  roleMetadata: RoleMetadata[];
  totalPeople: number;
  onStateClick?: (stateCode: string) => void;
}

type SortField = 'stateName' | 'region' | 'selectedRolesTotal' | 'percentOfTotal';
type SortDirection = 'asc' | 'desc';

export function FilteredStateTable({ 
  stateSummaries, 
  roleMetadata,
  totalPeople,
  onStateClick 
}: FilteredStateTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('selectedRolesTotal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredData = useMemo(() => {
    let data = [...stateSummaries];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(s => 
        s.stateName.toLowerCase().includes(searchLower) ||
        s.stateCode.toLowerCase().includes(searchLower) ||
        s.region.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    data.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return data;
  }, [stateSummaries, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['State', 'State Code', 'Region', 'Total People', '% of Total', 'Top Roles'];
    const rows = filteredData.map(s => [
      s.stateName,
      s.stateCode,
      s.region,
      s.selectedRolesTotal,
      s.percentOfTotal.toFixed(2),
      s.topRoles.map(r => `${r.name}: ${r.count}`).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `state_summary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    const data = filteredData.map(s => ({
      'State': s.stateName,
      'State Code': s.stateCode,
      'Region': s.region,
      'Total People': s.selectedRolesTotal,
      '% of Total': s.percentOfTotal,
      'Top Role 1': s.topRoles[0]?.name || '',
      'Top Role 1 Count': s.topRoles[0]?.count || 0,
      'Top Role 2': s.topRoles[1]?.name || '',
      'Top Role 2 Count': s.topRoles[1]?.count || 0,
      'Top Role 3': s.topRoles[2]?.name || '',
      'Top Role 3 Count': s.topRoles[2]?.count || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'State Summary');
    XLSX.writeFile(wb, `state_summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">State Summary Table</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('stateName')}
              >
                <div className="flex items-center">
                  State <SortIcon field="stateName" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('region')}
              >
                <div className="flex items-center">
                  Region <SortIcon field="region" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted text-right"
                onClick={() => handleSort('selectedRolesTotal')}
              >
                <div className="flex items-center justify-end">
                  Total People <SortIcon field="selectedRolesTotal" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted text-right"
                onClick={() => handleSort('percentOfTotal')}
              >
                <div className="flex items-center justify-end">
                  % of Total <SortIcon field="percentOfTotal" />
                </div>
              </TableHead>
              <TableHead>Top Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((state, idx) => (
              <TableRow 
                key={state.stateCode}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  idx % 2 === 0 && "bg-muted/20"
                )}
                onClick={() => onStateClick?.(state.stateCode)}
              >
                <TableCell className="font-medium">
                  {state.stateName}
                  <span className="text-muted-foreground ml-1 text-xs">({state.stateCode})</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {state.region}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {state.selectedRolesTotal.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {state.percentOfTotal.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {state.topRoles.slice(0, 3).map((role, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {role.name.length > 15 ? role.name.slice(0, 15) + '...' : role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
        <span>Showing {filteredData.length} of {stateSummaries.length} states</span>
        <span>Total: {totalPeople.toLocaleString()} people</span>
      </div>
    </div>
  );
}

// Role Summary Table
interface RoleSummaryTableProps {
  roleMetadata: RoleMetadata[];
  roleBreakdown: Record<string, number>;
}

export function RoleSummaryTable({ roleMetadata, roleBreakdown }: RoleSummaryTableProps) {
  const [search, setSearch] = useState('');

  const filteredRoles = useMemo(() => {
    const searchLower = search.toLowerCase();
    return roleMetadata.filter(r => 
      r.columnName.toLowerCase().includes(searchLower) ||
      r.industry.toLowerCase().includes(searchLower)
    );
  }, [roleMetadata, search]);

  const exportRolesToExcel = () => {
    const data = filteredRoles.map(r => ({
      'Role': r.columnName,
      'Industry': r.industry,
      'Total People': roleBreakdown[r.columnName] || r.totalPeople,
      '% of Total': r.percentOfTotal
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Role Summary');
    XLSX.writeFile(wb, `role_summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const industryColors: Record<IndustryCategory, string> = {
    'Movie & Entertainment': 'bg-chart-rose/20 text-chart-rose border-chart-rose/30',
    'Music & Audio': 'bg-chart-purple/20 text-chart-purple border-chart-purple/30',
    'Fashion & Apparel': 'bg-chart-amber/20 text-chart-amber border-chart-amber/30'
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Role Summary Table</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportRolesToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 sticky top-0">
              <TableHead>Role</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="text-right">Total People</TableHead>
              <TableHead className="text-right">% Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role, idx) => (
              <TableRow 
                key={role.columnName}
                className={cn(idx % 2 === 0 && "bg-muted/20")}
              >
                <TableCell className="font-medium">
                  {role.columnName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", industryColors[role.industry])}>
                    {role.industry}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {(roleBreakdown[role.columnName] || role.totalPeople).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {role.percentOfTotal.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        Showing {filteredRoles.length} of {roleMetadata.length} roles
      </div>
    </div>
  );
}
