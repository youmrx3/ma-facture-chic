import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invoice, Client, CompanySettings } from '@/types/invoice';

interface InvoiceContextType {
  invoices: Invoice[];
  clients: Client[];
  companySettings: CompanySettings;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  getClientById: (id: string) => Client | undefined;
  getNextInvoiceNumber: (type: Invoice['type']) => string;
}

const defaultCompanySettings: CompanySettings = {
  nom: '',
  proprietaire: '',
  adresse: '',
  ville: '',
  codePostal: '',
  telephone: '',
  email: '',
  nif: '',
  nis: '',
  rc: '',
  customFields: [
    { id: 'nif', label: 'NIF', value: '', showInPdf: true, order: 1 },
    { id: 'nis', label: 'NIS', value: '', showInPdf: true, order: 2 },
    { id: 'rc', label: 'RC', value: '', showInPdf: true, order: 3 },
    { id: 'ai', label: 'AI', value: '', showInPdf: true, order: 4 },
  ],
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('companySettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old data to new format
      if (!parsed.customFields) {
        parsed.customFields = [
          { id: 'nif', label: 'NIF', value: parsed.nif || '', showInPdf: true, order: 1 },
          { id: 'nis', label: 'NIS', value: parsed.nis || '', showInPdf: true, order: 2 },
          { id: 'rc', label: 'RC', value: parsed.rc || '', showInPdf: true, order: 3 },
          { id: 'ai', label: 'AI', value: '', showInPdf: true, order: 4 },
        ];
      }
      if (!parsed.proprietaire) {
        parsed.proprietaire = '';
      }
      return parsed;
    }
    return defaultCompanySettings;
  });

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('companySettings', JSON.stringify(companySettings));
  }, [companySettings]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [...prev, invoice]);
  };

  const updateInvoice = (invoice: Invoice) => {
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const addClient = (client: Client) => {
    setClients((prev) => [...prev, client]);
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
  };

  const getClientById = (id: string) => {
    return clients.find((c) => c.id === id);
  };

  const getNextInvoiceNumber = (type: Invoice['type']) => {
    const year = new Date().getFullYear();
    const prefix = {
      facture: 'FAC',
      proforma: 'PRO',
      devis: 'DEV',
      avoir: 'AVO',
    }[type];

    const typeInvoices = invoices.filter((i) => i.type === type);
    const nextNum = (typeInvoices.length + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${nextNum}`;
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        clients,
        companySettings,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addClient,
        updateClient,
        deleteClient,
        updateCompanySettings,
        getClientById,
        getNextInvoiceNumber,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}
