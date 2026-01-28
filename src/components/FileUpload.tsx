import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const excelFile = files.find(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    
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
          <>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                {isDragging ? 'Drop your Excel file here' : 'Upload Excel File'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse (.xlsx, .xls)
              </p>
            </div>
          </>
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
}

export function UploadHistoryList({ history, activeId, onSelect, onDelete }: UploadHistoryListProps) {
  if (history.length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Upload History
      </h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
              activeId === item.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            )}
            onClick={() => onSelect(item.id)}
          >
            <FileSpreadsheet className={cn(
              'w-5 h-5 shrink-0',
              activeId === item.id ? 'text-primary' : 'text-muted-foreground'
            )} />
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{item.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {item.rowCount.toLocaleString()} rows • {formatDate(item.uploadedAt)}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete dataset"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
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
