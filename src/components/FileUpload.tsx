import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Layers, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onUpload: (file: File) => Promise<unknown>;
  isLoading?: boolean;
}

export function FileUpload({ onUpload, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (excelFile) {
      setSelectedFile(excelFile);
      await onUpload(excelFile);
      setSelectedFile(null);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await onUpload(file);
      setSelectedFile(null);
    }
    e.target.value = '';
  }, [onUpload]);

  return (
    <div className="w-full">
      <label
        className={cn(
          'upload-zone flex flex-col items-center justify-center gap-4',
          isDragging && 'dragging',
          isLoading && 'pointer-events-none opacity-70'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
          isDragging ? 'bg-primary/20' : 'bg-primary/10'
        )}>
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        {selectedFile ? (
          <div className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span className="font-medium">{selectedFile.name}</span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              {isDragging ? 'Drop your Excel file here' : 'Upload Excel File'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to browse (.xlsx, .xls)
            </p>
          </div>
        )}
      </label>
    </div>
  );
}

interface UploadHistoryItem {
  id: string;
  fileName: string;
  uploadedAt: Date;
  rowCount: number;
}

interface UploadHistoryListProps {
  history: UploadHistoryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  mergeAll?: boolean;
  onMergeAllChange?: (val: boolean) => void;
  mergeSummary?: { fileCount: number; totalRows: number; label: string } | null;
}

export function UploadHistoryList({
  history, activeId, onSelect, onDelete,
  mergeAll = false, onMergeAllChange, mergeSummary
}: UploadHistoryListProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gradient-to-br from-primary to-chart-purple rounded-md flex items-center justify-center">
          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
          Data Bank Records
        </h3>
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {history.length} file{history.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Merge All toggle — only show when more than 1 file */}
      {history.length > 1 && onMergeAllChange && (
        <div className={cn(
          'flex items-center justify-between p-3 rounded-xl border-2 mb-3 transition-all',
          mergeAll
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30'
        )}>
          <div className="flex items-center gap-2">
            <Layers className={cn('w-4 h-4', mergeAll ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-semibold">Merge All Files</p>
              {mergeAll && mergeSummary ? (
                <p className="text-xs text-primary font-medium">{mergeSummary.label}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Combine all compatible datasets into one view</p>
              )}
            </div>
          </div>
          <Switch
            checked={mergeAll}
            onCheckedChange={onMergeAllChange}
          />
        </div>
      )}

      {/* File list */}
      <div className="space-y-2">
        {history.map((item, index) => {
          const isActive = !mergeAll && activeId === item.id;
          const isIncludedInMerge = mergeAll;
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 group',
                isActive
                  ? 'border-primary bg-gradient-to-r from-primary/10 to-chart-purple/10 shadow-lg shadow-primary/10'
                  : isIncludedInMerge
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
              )}
              onClick={() => !mergeAll && onSelect(item.id)}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0',
                isActive
                  ? 'bg-gradient-to-br from-primary to-chart-purple text-white'
                  : isIncludedInMerge
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
              )}>
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate text-sm">{item.fileName}</p>
                  {isActive && !mergeAll && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Active</Badge>
                  )}
                  {isIncludedInMerge && (
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-primary">{item.rowCount.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{formatDate(item.uploadedAt)}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                aria-label="Delete dataset"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
