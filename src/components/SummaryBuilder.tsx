import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Pencil, Plus, Trash2, GripVertical } from 'lucide-react';
import { SummaryRow, CustomBasis } from '@/types/invoice';
import { computeSummary } from '@/lib/summary';

interface SummaryBuilderProps {
  rows: SummaryRow[];
  onChange: (rows: SummaryRow[]) => void;
  items: { quantite: number; prixUnitaire: number; tva: number }[];
  showDA: boolean;
  formatCurrency: (amount: number, showDA: boolean) => string;
}

const BASIS_LABELS: Record<CustomBasis, string> = {
  none: 'Aucune (montant fixe)',
  tht: 'Total HT',
  htAfterRemise: 'HT après remise',
  ttc: 'Total TTC',
  ttcFinal: 'TTC final',
};

const KIND_BADGE: Record<string, string> = {
  tht: 'HT',
  remise: '%',
  htAfterRemise: '=',
  tva: '%',
  ttc: '=',
  retenue: '%',
  ttcFinal: '=',
  custom: '★',
};

export function SummaryBuilder({ rows, onChange, items, showDA, formatCurrency }: SummaryBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const computed = computeSummary(rows, items);

  const updateRow = (id: string, patch: Partial<SummaryRow>) => {
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const moveRow = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter(r => r.id !== id));
  };

  const addCustomRow = () => {
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        kind: 'custom',
        label: 'Nouveau champ',
        enabled: true,
        customType: 'percent',
        customBasis: 'ttc',
        customSign: 1,
        percent: 0,
      },
    ]);
    // expand the new one
    setTimeout(() => setExpandedId(rows[rows.length]?.id ?? null), 0);
  };

  const hasPercent = (r: SummaryRow) =>
    r.kind === 'remise' || r.kind === 'tva' || r.kind === 'retenue' || (r.kind === 'custom' && r.customType === 'percent');

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const c = computed.rows[index];
        const isFinalSnapshot =
          row.kind === 'ttcFinal' || (row.kind === 'ttc' && !rows.some(r => r.enabled && (r.kind === 'retenue' || r.kind === 'ttcFinal')));
        const isEditingLabel = editingId === row.id;
        const isExpanded = expandedId === row.id;
        const isCustom = row.kind === 'custom';

        return (
          <div
            key={row.id}
            className={`rounded-lg border ${row.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'} ${
              isFinalSnapshot && row.enabled ? 'border-primary/50' : ''
            }`}
          >
            <div className="flex items-center gap-1 p-2">
              {/* reorder */}
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              {/* badge */}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground w-6 text-center">
                {KIND_BADGE[row.kind]}
              </span>

              {/* label */}
              <div className="flex-1 min-w-0">
                {isEditingLabel ? (
                  <Input
                    value={row.label}
                    onChange={e => updateRow(row.id, { label: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    className={`text-sm text-left truncate w-full hover:underline ${
                      isFinalSnapshot ? 'font-bold' : ''
                    }`}
                    onClick={() => setEditingId(row.id)}
                    title="Renommer"
                  >
                    {row.label}
                    {hasPercent(row) && row.percent ? ` (${row.percent}%)` : ''}
                    <Pencil className="h-3 w-3 inline ml-1 opacity-40" />
                  </button>
                )}
              </div>

              {/* value */}
              <div className={`text-sm tabular-nums ${isFinalSnapshot ? 'font-bold text-primary' : ''}`}>
                {row.enabled ? formatCurrency(c.amount, showDA) : '—'}
              </div>

              {/* enable */}
              <Switch
                checked={row.enabled}
                onCheckedChange={v => updateRow(row.id, { enabled: v })}
                className="ml-1"
              />

              {/* expand for config */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                title="Configurer"
              >
                <GripVertical className="h-3 w-3" />
              </Button>

              {/* delete (custom only) */}
              {isCustom && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isExpanded && row.enabled && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t">
                {isCustom && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={row.customType ?? 'percent'}
                          onValueChange={v => updateRow(row.id, { customType: v as 'percent' | 'fixed' })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Pourcentage</SelectItem>
                            <SelectItem value="fixed">Montant fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Effet</Label>
                        <Select
                          value={String(row.customSign ?? 1)}
                          onValueChange={v => updateRow(row.id, { customSign: Number(v) as 1 | -1 })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Ajouter (+)</SelectItem>
                            <SelectItem value="-1">Déduire (−)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {row.customType === 'percent' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Calculé sur</Label>
                        <Select
                          value={row.customBasis ?? 'ttc'}
                          onValueChange={v => updateRow(row.id, { customBasis: v as CustomBasis })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tht">{BASIS_LABELS.tht}</SelectItem>
                            <SelectItem value="htAfterRemise">{BASIS_LABELS.htAfterRemise}</SelectItem>
                            <SelectItem value="ttc">{BASIS_LABELS.ttc}</SelectItem>
                            <SelectItem value="ttcFinal">{BASIS_LABELS.ttcFinal}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {hasPercent(row) && (!isCustom || row.customType === 'percent') && (
                  <div className="space-y-1">
                    <Label className="text-xs">Pourcentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.percent ?? 0}
                      onChange={e => updateRow(row.id, { percent: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {isCustom && row.customType === 'fixed' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Montant fixe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.fixedValue ?? 0}
                      onChange={e => updateRow(row.id, { fixedValue: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Label className="text-xs">Saisie manuelle</Label>
                  <Switch
                    checked={!!row.manualOverride}
                    onCheckedChange={v => updateRow(row.id, { manualOverride: v })}
                  />
                </div>
                {row.manualOverride && (
                  <div className="space-y-1">
                    <Label className="text-xs">Valeur manuelle</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.manualValue ?? c.amount}
                      onChange={e => updateRow(row.id, { manualValue: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addCustomRow}
      >
        <Plus className="h-3 w-3 mr-2" />
        Ajouter un champ personnalisé
      </Button>
    </div>
  );
}
