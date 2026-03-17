import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { DEFAULT_SUMMARY_LABELS, DEFAULT_SUMMARY_ORDER } from '@/types/invoice';
import { useState } from 'react';

interface SummaryEditorProps {
  summaryLabels: Record<string, string>;
  summaryOrder: string[];
  onLabelsChange: (labels: Record<string, string>) => void;
  onOrderChange: (order: string[]) => void;
  sousTotal: number;
  totalTva: number;
  remise: number;
  montantRemise: number;
  timbre: number;
  montantTimbre: number;
  total: number;
  showDA: boolean;
  formatCurrency: (amount: number, showDA: boolean) => string;
}

export function SummaryEditor({
  summaryLabels,
  summaryOrder,
  onLabelsChange,
  onOrderChange,
  sousTotal,
  totalTva,
  remise,
  montantRemise,
  timbre,
  montantTimbre,
  total,
  showDA,
  formatCurrency,
}: SummaryEditorProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const getLabel = (key: string) => summaryLabels[key] || DEFAULT_SUMMARY_LABELS[key] || key;

  const getValue = (key: string) => {
    switch (key) {
      case 'tht': return formatCurrency(sousTotal, showDA);
      case 'ttva': return formatCurrency(totalTva, showDA);
      case 'remise': return remise > 0 ? formatCurrency(montantRemise, showDA) : null;
      case 'timbre': return timbre > 0 ? formatCurrency(montantTimbre, showDA) : null;
      case 'ttc': return formatCurrency(total, showDA);
      default: return null;
    }
  };

  const getExtraText = (key: string) => {
    switch (key) {
      case 'remise': return remise > 0 ? ` (${remise}%)` : '';
      case 'timbre': return timbre > 0 ? ` (${timbre}%)` : '';
      default: return '';
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newOrder = [...summaryOrder];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onOrderChange(newOrder);
  };

  const updateLabel = (key: string, newLabel: string) => {
    onLabelsChange({ ...summaryLabels, [key]: newLabel });
  };

  return (
    <div className="space-y-2">
      {summaryOrder.map((key, index) => {
        const value = getValue(key);
        // Skip remise/timbre if not active (but still allow reordering in edit mode)
        if ((key === 'remise' && remise <= 0) || (key === 'timbre' && timbre <= 0)) {
          return null;
        }

        const isTTC = key === 'ttc';
        const isEditing = editingKey === key;

        return (
          <div key={key} className="group">
            {isTTC && <div className="h-px bg-border my-2" />}
            <div className={`flex items-center gap-1 ${isTTC ? 'font-bold text-lg' : 'text-sm'}`}>
              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === summaryOrder.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-between flex-1 items-center">
                {isEditing ? (
                  <Input
                    value={getLabel(key)}
                    onChange={(e) => updateLabel(key, e.target.value)}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingKey(null)}
                    className="h-6 w-28 text-xs"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`cursor-pointer hover:underline ${isTTC ? '' : 'text-muted-foreground'}`}
                    onClick={() => setEditingKey(key)}
                    title="Cliquer pour renommer"
                  >
                    {getLabel(key)}{getExtraText(key)}
                    <Pencil className="h-3 w-3 inline ml-1 opacity-0 group-hover:opacity-100" />
                  </span>
                )}
                <span className={isTTC ? 'text-primary' : ''}>
                  {value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
