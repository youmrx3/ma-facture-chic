import { InvoiceColumn, DEFAULT_COLUMNS, DEFAULT_COLUMN_LABELS } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

interface Props {
  columns: InvoiceColumn[];
  onChange: (cols: InvoiceColumn[]) => void;
}

export function ColumnsBuilder({ columns, onChange }: Props) {
  const update = (idx: number, patch: Partial<InvoiceColumn>) => {
    onChange(columns.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= columns.length) return;
    const copy = [...columns];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };

  const reset = () => onChange(JSON.parse(JSON.stringify(DEFAULT_COLUMNS)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          Réordonnez, renommez ou désactivez les colonnes du tableau.
        </Label>
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          Réinitialiser
        </Button>
      </div>

      <div className="space-y-2">
        {columns.map((col, idx) => (
          <div
            key={col.key}
            className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
          >
            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => move(idx, 1)}
                disabled={idx === columns.length - 1}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            <Input
              value={col.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder={DEFAULT_COLUMN_LABELS[col.key]}
              className="h-8 text-sm flex-1"
            />

            <Switch
              checked={col.enabled}
              onCheckedChange={(v) => update(idx, { enabled: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
