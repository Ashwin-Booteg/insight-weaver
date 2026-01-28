import React, { useState } from 'react';
import { ICPConfig, DataColumn } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2 } from 'lucide-react';

interface ICPConfigDialogProps {
  config: ICPConfig;
  onConfigChange: (config: ICPConfig) => void;
  columns: DataColumn[];
}

export function ICPConfigDialog({ config, onConfigChange, columns }: ICPConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ICPConfig>(config);
  
  const booleanColumns = columns.filter(c => 
    c.isICP || c.type === 'boolean' || 
    (c.type === 'text' && c.sampleValues?.some(v => 
      ['true', 'false', 'yes', 'no', '1', '0'].includes(String(v).toLowerCase())
    ))
  );
  
  const numericColumns = columns.filter(c => c.type === 'number');
  const textColumns = columns.filter(c => c.type === 'text');
  
  const handleSave = () => {
    onConfigChange(localConfig);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="w-4 h-4 mr-2" />
          ICP Config
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Configure ICP Definition</DialogTitle>
        </DialogHeader>
        
        <Tabs value={localConfig.mode} onValueChange={(v) => setLocalConfig({ ...localConfig, mode: v as ICPConfig['mode'] })}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="column">Column</TabsTrigger>
            <TabsTrigger value="threshold">Threshold</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="column" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Use an existing column that indicates ICP status (e.g., "Is ICP", "ICP", "Qualified")
            </p>
            
            <div className="space-y-2">
              <Label>ICP Column</Label>
              <Select
                value={localConfig.columnName || ''}
                onValueChange={(v) => setLocalConfig({ ...localConfig, columnName: v })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {booleanColumns.length > 0 ? (
                    booleanColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))
                  ) : (
                    textColumns.slice(0, 10).map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="threshold" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Define ICP based on a numeric score threshold (e.g., Fit Score &gt;= 70)
            </p>
            
            <div className="space-y-2">
              <Label>Score Column</Label>
              <Select
                value={localConfig.thresholdColumn || ''}
                onValueChange={(v) => setLocalConfig({ ...localConfig, thresholdColumn: v })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {numericColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Minimum Threshold</Label>
              <Input
                type="number"
                value={localConfig.threshold || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, threshold: Number(e.target.value) })}
                placeholder="e.g., 70"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="rules" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Define ICP using custom rules (coming soon)
            </p>
            
            <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
              Rules builder will be available in a future update
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
