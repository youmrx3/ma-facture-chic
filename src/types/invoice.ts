export type InvoiceType = 'facture' | 'proforma' | 'devis' | 'avoir';

export type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee' | 'annulee' | 'en_retard';

export interface InvoiceItem {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  tva: number;
  total: number;
}

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
  total: number;
  notes?: string;
  conditions?: string;
}

export interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  nif?: string;
  nis?: string;
  rc?: string;
}

export interface CompanySettings {
  nom: string;
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
