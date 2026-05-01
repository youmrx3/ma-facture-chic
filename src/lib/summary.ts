import { SummaryRow, DEFAULT_SUMMARY_ROWS } from '@/types/invoice';

export interface ComputedRow {
  row: SummaryRow;
  amount: number;       // displayed amount for the row
  baseAmount?: number;  // base for percent rows
  isComputed: boolean;  // a "running total" line
  signedAmount: number; // signed contribution to running total
}

export interface ComputeResult {
  rows: ComputedRow[];
  finalTotal: number; // value of the last enabled computed row, else last running total
  // Useful intermediates
  tht: number;
  totalTvaItems: number;
}

/**
 * Walk the summaryRows in order, computing each row using the previous running totals.
 * - tht        => sousTotal (sum of items HT)
 * - remise     => percent of latest "Total HT" (deduction)
 * - htAfterRemise => running total after remise rows (computed snapshot)
 * - tva        => percent of latest "HT après remise"; if percent undefined, use sum(item TVA)
 * - ttc        => running total snapshot
 * - retenue    => percent of latest "TTC" (deduction)
 * - ttcFinal   => running total snapshot
 * - custom     => percent of selected basis OR fixed amount, signed
 *
 * Manual overrides replace the computed amount but the row still contributes signedAmount.
 */
export function computeSummary(
  rows: SummaryRow[] | undefined,
  items: { quantite: number; prixUnitaire: number; tva: number }[],
): ComputeResult {
  const safeRows = rows && rows.length ? rows : DEFAULT_SUMMARY_ROWS;

  const tht = items.reduce((s, it) => s + it.quantite * it.prixUnitaire, 0);
  const totalTvaItems = items.reduce(
    (s, it) => s + it.quantite * it.prixUnitaire * (it.tva / 100),
    0,
  );

  // Snapshots updated as we walk
  let lastTht = tht;
  let lastHtAfterRemise = tht;
  let lastTtc = tht + totalTvaItems;
  let lastTtcFinal = lastTtc;

  let running = 0; // cumulative signed sum (used for computed snapshots)
  let phase: 'preRemise' | 'postRemise' | 'postTva' | 'postRetenue' = 'preRemise';

  // We initialize running with HT only when first 'tht' row is encountered.
  // Simpler approach: compute by phase using snapshots.

  const computed: ComputedRow[] = [];

  for (const row of safeRows) {
    if (!row.enabled) {
      computed.push({ row, amount: 0, signedAmount: 0, isComputed: false });
      continue;
    }

    let amount = 0;
    let baseAmount: number | undefined;
    let signedAmount = 0;
    let isComputed = false;

    switch (row.kind) {
      case 'tht':
        amount = tht;
        signedAmount = 0; // baseline, not added on top
        isComputed = true;
        running = tht;
        phase = 'preRemise';
        break;

      case 'remise': {
        baseAmount = lastTht;
        const pct = row.percent ?? 0;
        amount = baseAmount * (pct / 100);
        if (row.manualOverride) amount = row.manualValue ?? amount;
        signedAmount = -amount;
        running += signedAmount;
        lastHtAfterRemise = running;
        phase = 'postRemise';
        break;
      }

      case 'htAfterRemise':
        // If remise wasn't applied, this equals tht
        amount = phase === 'preRemise' ? lastTht : running;
        if (row.manualOverride) amount = row.manualValue ?? amount;
        running = amount;
        lastHtAfterRemise = amount;
        signedAmount = 0;
        isComputed = true;
        phase = 'postRemise';
        break;

      case 'tva': {
        baseAmount = phase === 'preRemise' ? lastTht : lastHtAfterRemise;
        // If user set a percent, use it; else fall back to per-item TVA sum
        const useItemSum = row.percent === undefined || row.percent === null;
        amount = useItemSum ? totalTvaItems : baseAmount * ((row.percent ?? 0) / 100);
        if (row.manualOverride) amount = row.manualValue ?? amount;
        signedAmount = amount;
        running += signedAmount;
        lastTtc = running;
        phase = 'postTva';
        break;
      }

      case 'ttc':
        amount = running;
        if (row.manualOverride) amount = row.manualValue ?? amount;
        running = amount;
        lastTtc = amount;
        signedAmount = 0;
        isComputed = true;
        break;

      case 'retenue': {
        baseAmount = lastTtc;
        const pct = row.percent ?? 0;
        amount = baseAmount * (pct / 100);
        if (row.manualOverride) amount = row.manualValue ?? amount;
        signedAmount = -amount;
        running += signedAmount;
        lastTtcFinal = running;
        phase = 'postRetenue';
        break;
      }

      case 'ttcFinal':
        amount = running;
        if (row.manualOverride) amount = row.manualValue ?? amount;
        running = amount;
        lastTtcFinal = amount;
        signedAmount = 0;
        isComputed = true;
        break;

      case 'custom': {
        const sign = row.customSign ?? 1;
        if (row.customType === 'fixed') {
          amount = row.fixedValue ?? 0;
        } else {
          // percent
          const basisVal =
            row.customBasis === 'tht' ? lastTht :
            row.customBasis === 'htAfterRemise' ? lastHtAfterRemise :
            row.customBasis === 'ttc' ? lastTtc :
            row.customBasis === 'ttcFinal' ? lastTtcFinal :
            0;
          baseAmount = basisVal;
          amount = basisVal * ((row.percent ?? 0) / 100);
        }
        if (row.manualOverride) amount = row.manualValue ?? amount;
        signedAmount = sign * amount;
        running += signedAmount;
        break;
      }
    }

    computed.push({ row, amount, baseAmount, signedAmount, isComputed });
  }

  // Final total: prefer last enabled computed snapshot (ttcFinal > ttc > htAfterRemise > tht); else running.
  const enabled = computed.filter(c => c.row.enabled);
  const lastComputedSnapshot = [...enabled].reverse().find(c => c.isComputed);
  const finalTotal = lastComputedSnapshot ? lastComputedSnapshot.amount : running;

  return { rows: computed, finalTotal, tht, totalTvaItems };
}

/**
 * Build SummaryRow[] from a legacy invoice (with remise%/timbre%) for backward compatibility.
 */
export function migrateLegacySummary(legacy: {
  remise?: number;
  timbre?: number;
}): SummaryRow[] {
  const rows: SummaryRow[] = JSON.parse(JSON.stringify(DEFAULT_SUMMARY_ROWS));
  if (legacy.remise && legacy.remise > 0) {
    const r = rows.find(r => r.kind === 'remise');
    if (r) { r.enabled = true; r.percent = legacy.remise; }
    const h = rows.find(r => r.kind === 'htAfterRemise');
    if (h) h.enabled = true;
  }
  // Map old timbre to a custom row (added on TTC)
  if (legacy.timbre && legacy.timbre > 0) {
    rows.push({
      id: crypto.randomUUID(),
      kind: 'custom',
      label: 'Timbre',
      enabled: true,
      customType: 'percent',
      customBasis: 'ttc',
      customSign: 1,
      percent: legacy.timbre,
    });
  }
  return rows;
}
