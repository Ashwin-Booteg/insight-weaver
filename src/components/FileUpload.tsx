import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Layers, CheckCircle, X } from 'lucide-react';
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

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (excelFile) { setSelectedFile(excelFile); await onUpload(excelFile); setSelectedFile(null); }
  }, [onUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); await onUpload(file); setSelectedFile(null); }
    e.target.value = '';
  }, [onUpload]);

  return (
    <div className="w-full">
      <label
        className={cn(
          'upload-zone flex flex-col items-center justify-center gap-3',
          isDragging && 'dragging',
          isLoading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" disabled={isLoading} />
        <div className={cn(
          'w-12 h-12 rounded-xl border flex items-center justify-center transition-all',
          isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card'
        )}>
          {isLoading
            ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            : <Upload className={cn('w-5 h-5', isDragging ? 'text-primary' : 'text-muted-foreground')} />
          }
        </div>
        {selectedFile ? (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop to append' : 'Drop Excel file here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse · .xlsx, .xls</p>
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
    <div className="space-y-2">
      {/* Merge toggle */}
      {history.length > 1 && onMergeAllChange && (
        <div className={cn(
          'flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all',
          mergeAll ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
        )}>
          <div className="flex items-center gap-2">
            <Layers className={cn('w-4 h-4', mergeAll ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-xs font-semibold">Merge All</p>
              <p className="text-[11px] text-muted-foreground">
                {mergeAll && mergeSummary ? mergeSummary.label : 'Combine all compatible datasets'}
              </p>
            </div>
          </div>
          <Switch checked={mergeAll} onCheckedChange={onMergeAllChange} />
        </div>
      )}

      {/* File list */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin">
        {history.map((item, index) => {
          const isActive = !mergeAll && activeId === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 group',
                isActive
                  ? 'border-primary/40 bg-primary/8'
                  : mergeAll
                    ? 'border-primary/20 bg-primary/3'
                    : 'border-border bg-card hover:border-border/80 hover:bg-card/80'
              )}
              onClick={() => !mergeAll && onSelect(item.id)}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.fileName}</p>
                <p className="text-[11px] text-muted-foreground">{item.rowCount.toLocaleString()} rows</p>
              </div>
              {isActive && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary shrink-0">Active</Badge>}
              {mergeAll && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                aria-label="Delete dataset"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
