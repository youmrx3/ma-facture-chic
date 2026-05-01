export type InvoiceType = 'facture' | 'proforma' | 'devis' | 'avoir';

export type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee' | 'annulee' | 'en_retard';

export interface InvoiceItem {
  id: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  tva: number;
  total: number;
}

export const DEFAULT_SUMMARY_LABELS: Record<string, string> = {
  tht: 'Total HT',
  remise: 'Remise HT',
  htAfterRemise: 'Total HT après remise',
  tva: 'TVA',
  ttc: 'Total TTC',
  retenue: 'Retenue de garantie',
  ttcFinal: 'Total TTC final',
};

// Row kinds (built-in computed slots vs custom rows)
export type SummaryRowKind =
  | 'tht'              // sum of items HT
  | 'remise'           // % off Total HT (deduction)
  | 'htAfterRemise'    // computed
  | 'tva'              // % on Total HT après remise (addition) - or sum of items' TVA if percent undefined
  | 'ttc'              // computed (htAfterRemise + tva)
  | 'retenue'          // % off Total TTC (deduction)
  | 'ttcFinal'         // computed (ttc - retenue)
  | 'custom';          // user-defined

export type CustomBasis = 'none' | 'tht' | 'htAfterRemise' | 'ttc' | 'ttcFinal';

export interface SummaryRow {
  id: string;
  kind: SummaryRowKind;
  label: string;
  enabled: boolean;
  // For percent-based rows (remise / tva / retenue / custom%)
  percent?: number;
  // For custom rows: 'percent' or 'fixed' or 'computed'
  customType?: 'percent' | 'fixed';
  customBasis?: CustomBasis;
  customSign?: 1 | -1; // for custom: +adds / -deducts. Display label only.
  fixedValue?: number;
  // Manual override for the displayed value
  manualOverride?: boolean;
  manualValue?: number;
}

// Default order replicates: HT, Remise, HT après remise, TVA, TTC, Retenue, TTC final
export const DEFAULT_SUMMARY_ROWS: SummaryRow[] = [
  { id: 'tht', kind: 'tht', label: DEFAULT_SUMMARY_LABELS.tht, enabled: true },
  { id: 'remise', kind: 'remise', label: DEFAULT_SUMMARY_LABELS.remise, enabled: false, percent: 0 },
  { id: 'htAfterRemise', kind: 'htAfterRemise', label: DEFAULT_SUMMARY_LABELS.htAfterRemise, enabled: false },
  { id: 'tva', kind: 'tva', label: DEFAULT_SUMMARY_LABELS.tva, enabled: true },
  { id: 'ttc', kind: 'ttc', label: DEFAULT_SUMMARY_LABELS.ttc, enabled: true },
  { id: 'retenue', kind: 'retenue', label: DEFAULT_SUMMARY_LABELS.retenue, enabled: false, percent: 0 },
  { id: 'ttcFinal', kind: 'ttcFinal', label: DEFAULT_SUMMARY_LABELS.ttcFinal, enabled: false },
];

// Legacy (kept for backward-compat with older saved invoices)
export const DEFAULT_SUMMARY_ORDER = ['tht', 'ttva', 'remise', 'timbre', 'ttc'];

export interface Invoice {
  id: string;
  numero: string;
  type: InvoiceType;
  status: InvoiceStatus;
  clientId: string;
  dateCreation: string;
  dateEcheance: string;
  items: InvoiceItem[];
  sousTotal: number;
  totalTva: number;
  // Legacy financial fields (kept for older invoices)
  remise?: number;
  montantRemise?: number;
  timbre?: number;
  montantTimbre?: number;
  total: number;
  notes?: string;
  conditions?: string;
  showEcheance?: boolean;
  showDA?: boolean;
  showLogo?: boolean;
  // Legacy summary configs
  summaryLabels?: Record<string, string>;
  summaryOrder?: string[];
  // NEW: full configurable summary
  summaryRows?: SummaryRow[];
}

export interface ClientField {
  id: string;
  label: string;
  value: string;
  showInPdf: boolean;
  order: number;
}

export interface Client {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  nif?: string;
  nis?: string;
  rc?: string;
  customFields?: ClientField[];
}

export interface CompanyField {
  id: string;
  label: string;
  value: string;
  showInPdf: boolean;
  order: number;
}

export interface CompanySettings {
  nom: string;
  proprietaire: string;
  logo?: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone: string;
  email: string;
  siteWeb?: string;
  nif: string;
  nis: string;
  rc: string;
  capitalSocial?: string;
  rib?: string;
  banque?: string;
  customFields: CompanyField[];
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  facture: 'Facture',
  proforma: 'Facture Proforma',
  devis: 'Devis',
  avoir: 'Avoir',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  annulee: 'Annulée',
  en_retard: 'En retard',
};
