import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  Send,
  Trash2,
  Building2,
  Calendar,
  CreditCard,
  Pencil,
} from 'lucide-react';
import { INVOICE_TYPE_LABELS, INVOICE_STATUS_LABELS, InvoiceStatus, DEFAULT_SUMMARY_LABELS, DEFAULT_SUMMARY_ORDER } from '@/types/invoice';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatCurrency = (amount: number, showDA = true) => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return showDA ? formatted + ' DA' : formatted;
};

const formatCurrencyForPDF = (amount: number, showDA = true) => {
  const formatted = amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return showDA ? formatted + ' DA' : formatted;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'payee':
      return 'success';
    case 'envoyee':
      return 'info';
    case 'brouillon':
      return 'muted';
    case 'en_retard':
      return 'destructive';
    case 'annulee':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, getClientById, companySettings, updateInvoice, deleteInvoice } = useInvoice();

  const invoice = invoices.find((i) => i.id === id);
  const client = invoice ? getClientById(invoice.clientId) : null;

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Facture non trouvée</p>
            <Button className="mt-4" onClick={() => navigate('/factures')}>
              Retour aux factures
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    updateInvoice({ ...invoice, status: newStatus });
    toast.success('Statut mis à jour');
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    toast.success('Facture supprimée');
    navigate('/factures');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const showDA = invoice.showDA !== false;
    
    // Logo in top-left corner, above everything
    const showLogo = invoice.showLogo !== false;
    let headerStartY = 15;
    if (showLogo && companySettings.logo) {
      try {
        doc.addImage(companySettings.logo, 'PNG', 14, 10, 35, 18);
        headerStartY = 35; // push content below logo
      } catch (e) {
        // fallback: skip logo if format unsupported
      }
    }

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text(INVOICE_TYPE_LABELS[invoice.type].toUpperCase(), 14, headerStartY);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`N° ${invoice.numero}`, 14, headerStartY + 7);
    doc.text(`Date: ${formatDate(invoice.dateCreation)}`, 14, headerStartY + 13);
    if (invoice.showEcheance !== false) {
      doc.text(`Échéance: ${formatDate(invoice.dateEcheance)}`, 14, headerStartY + 19);
    }

    // Company Info - Owner name first, then company name
    let companyY = headerStartY;
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    // Owner name appears first
    if (companySettings.proprietaire) {
      doc.text(companySettings.proprietaire, 140, companyY);
      companyY += 7;
    }
    
    // Then company name
    if (companySettings.nom) {
      doc.setFontSize(10);
      doc.text(companySettings.nom, 140, companyY);
      companyY += 6;
    }
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    if (companySettings.adresse) {
      doc.text(companySettings.adresse, 140, companyY);
      companyY += 5;
    }
    if (companySettings.ville) {
      doc.text(`${companySettings.codePostal} ${companySettings.ville}`, 140, companyY);
      companyY += 5;
    }
    if (companySettings.telephone) {
      doc.text(`Tél: ${companySettings.telephone}`, 140, companyY);
      companyY += 5;
    }
    if (companySettings.email) {
      doc.text(companySettings.email, 140, companyY);
      companyY += 7;
    }
    
    // Custom fields that are marked to show in PDF
    const visibleFields = companySettings.customFields
      ?.filter((field) => field.showInPdf && field.value)
      .sort((a, b) => a.order - b.order) || [];
    
    visibleFields.forEach((field) => {
      doc.text(`${field.label}: ${field.value}`, 140, companyY);
      companyY += 5;
    });

    // Client Info
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('FACTURÉ À:', 14, 60);
    doc.setFontSize(10);
    let clientY = 68;
    if (client) {
      if (client.nom) {
        doc.text(client.nom, 14, clientY);
        clientY += 6;
      }
      doc.setTextColor(100);
      if (client.adresse) {
        doc.text(client.adresse, 14, clientY);
        clientY += 6;
      }
      if (client.ville || client.codePostal) {
        doc.text(`${client.codePostal || ''} ${client.ville || ''}`.trim(), 14, clientY);
        clientY += 6;
      }
      if (client.telephone) {
        doc.text(`Tél: ${client.telephone}`, 14, clientY);
        clientY += 6;
      }
      
      // Client custom fields that are marked to show in PDF
      const visibleClientFields = client.customFields
        ?.filter((field) => field.showInPdf && field.value)
        .sort((a, b) => a.order - b.order) || [];
      
      visibleClientFields.forEach((field) => {
        doc.text(`${field.label}: ${field.value}`, 14, clientY);
        clientY += 6;
      });
    }

    // Table
    const tableData = invoice.items.map((item) => [
      item.description,
      `${item.quantite} ${item.unite || 'Unité'}`,
      formatCurrencyForPDF(item.prixUnitaire, showDA),
      `${item.tva}%`,
      formatCurrencyForPDF(item.total, showDA),
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Description', 'Qté', 'P.U', 'TVA', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 35 },
      },
      showHead: 'everyPage',
      margin: { top: 20, bottom: 40 },
    });

    // Totals - using custom labels and order
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.height;
    let totalsY = finalY;
    if (finalY + 40 > pageHeight - 20) {
      doc.addPage();
      totalsY = 30;
    }
    
    const rightX = 195;
    const labelX = 140;
    const labels = invoice.summaryLabels || DEFAULT_SUMMARY_LABELS;
    const order = invoice.summaryOrder || DEFAULT_SUMMARY_ORDER;
    
    let currentTotalY = totalsY;

    // Render rows in custom order, TTC last with separator
    const nonTtcItems = order.filter(k => k !== 'ttc');
    const ttcKey = order.includes('ttc') ? 'ttc' : null;

    for (const key of nonTtcItems) {
      if (key === 'tht') {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${labels.tht || 'T.H.T'}:`, labelX, currentTotalY);
        doc.text(formatCurrencyForPDF(invoice.sousTotal, showDA), rightX, currentTotalY, { align: 'right' });
        currentTotalY += 7;
      } else if (key === 'ttva') {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${labels.ttva || 'T.TVA'}:`, labelX, currentTotalY);
        doc.text(formatCurrencyForPDF(invoice.totalTva, showDA), rightX, currentTotalY, { align: 'right' });
        currentTotalY += 7;
      } else if (key === 'remise' && invoice.remise && invoice.montantRemise) {
        doc.setFontSize(10);
        doc.setTextColor(200, 50, 50);
        doc.text(`${labels.remise || 'Remise'} (${invoice.remise}%):`, labelX, currentTotalY);
        doc.text(formatCurrencyForPDF(invoice.montantRemise, showDA), rightX, currentTotalY, { align: 'right' });
        currentTotalY += 7;
      } else if (key === 'timbre' && invoice.timbre && invoice.montantTimbre) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${labels.timbre || 'Timbre'} (${invoice.timbre}%):`, labelX, currentTotalY);
        doc.text(formatCurrencyForPDF(invoice.montantTimbre, showDA), rightX, currentTotalY, { align: 'right' });
        currentTotalY += 7;
      }
    }
    
    doc.setDrawColor(200);
    doc.line(labelX, currentTotalY, rightX, currentTotalY);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`${labels.ttc || 'TTC'}:`, labelX, currentTotalY + 8);
    doc.text(formatCurrencyForPDF(invoice.total, showDA), rightX, currentTotalY + 8, { align: 'right' });

    // Notes & Conditions
    if (invoice.notes || invoice.conditions) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      let noteY = currentTotalY + 20;
      
      if (noteY > pageHeight - 30) {
        doc.addPage();
        noteY = 30;
      }
      
      if (invoice.conditions) {
        doc.text(`Conditions: ${invoice.conditions}`, 14, noteY);
        noteY += 7;
      }
      if (invoice.notes) {
        doc.text(`Notes: ${invoice.notes}`, 14, noteY);
      }
    }

    // Bank Info
    if (companySettings.banque || companySettings.rib) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      let bankY = currentTotalY + 35;
      
      if (bankY > pageHeight - 20) {
        doc.addPage();
        bankY = 30;
      }
      
      if (companySettings.banque) doc.text(`Banque: ${companySettings.banque}`, 14, bankY);
      if (companySettings.rib) doc.text(`RIB: ${companySettings.rib}`, 14, bankY + 6);
    }

    doc.save(`${invoice.numero}.pdf`);
    toast.success('PDF exporté avec succès');
  };

  const handleSendEmail = () => {
    if (!client?.email) {
      toast.error("Le client n'a pas d'adresse email");
      return;
    }
    // In a real app, this would send via an API
    toast.info("Fonctionnalité d'envoi par email - nécessite une configuration backend");
  };

  // Get visible custom fields for preview
  const visibleFields = companySettings.customFields
    ?.filter((field) => field.showInPdf && field.value)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{invoice.numero}</h1>
                <Badge variant={getStatusVariant(invoice.status) as any}>
                  {INVOICE_STATUS_LABELS[invoice.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {INVOICE_TYPE_LABELS[invoice.type]} • Créée le {formatDate(invoice.dateCreation)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={invoice.status} onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate(`/factures/${invoice.id}/modifier`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
            <Button onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Invoice Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      {INVOICE_TYPE_LABELS[invoice.type]}
                    </h2>
                    <p className="text-muted-foreground">N° {invoice.numero}</p>
                  </div>
                  {companySettings.logo ? (
                    <img src={companySettings.logo} alt="Logo" className="h-16 object-contain" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>

                {/* Addresses */}
                <div className="grid sm:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">DE</h3>
                    {companySettings.proprietaire && (
                      <p className="font-bold text-lg">{companySettings.proprietaire}</p>
                    )}
                    <p className="font-semibold">{companySettings.nom || 'Votre Entreprise'}</p>
                    {companySettings.adresse && <p className="text-sm text-muted-foreground">{companySettings.adresse}</p>}
                    {companySettings.ville && (
                      <p className="text-sm text-muted-foreground">
                        {companySettings.codePostal} {companySettings.ville}
                      </p>
                    )}
                    {visibleFields.map((field) => (
                      <p key={field.id} className="text-sm text-muted-foreground">
                        {field.label}: {field.value}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">FACTURÉ À</h3>
                    {client ? (
                      <>
                        {client.nom && <p className="font-semibold">{client.nom}</p>}
                        {client.adresse && <p className="text-sm text-muted-foreground">{client.adresse}</p>}
                        {(client.ville || client.codePostal) && (
                          <p className="text-sm text-muted-foreground">
                            {client.codePostal} {client.ville}
                          </p>
                        )}
                        {client.customFields
                          ?.filter((field) => field.showInPdf && field.value)
                          .sort((a, b) => a.order - b.order)
                          .map((field) => (
                            <p key={field.id} className="text-sm text-muted-foreground">
                              {field.label}: {field.value}
                            </p>
                          ))}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Client inconnu</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex gap-8 mb-8">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(invoice.dateCreation)}</span>
                  </div>
                  {invoice.showEcheance !== false && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Échéance:</span>
                      <span className="font-medium">{formatDate(invoice.dateEcheance)}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Description</th>
                        <th className="text-center p-3 text-sm font-semibold">Qté</th>
                        <th className="text-right p-3 text-sm font-semibold">P.U</th>
                        <th className="text-center p-3 text-sm font-semibold">TVA</th>
                        <th className="text-right p-3 text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 text-sm">{item.description}</td>
                          <td className="p-3 text-sm text-center">{item.quantite} {item.unite || 'Unité'}</td>
                          <td className="p-3 text-sm text-right">{formatCurrency(item.prixUnitaire, invoice.showDA !== false)}</td>
                          <td className="p-3 text-sm text-center">{item.tva}%</td>
                          <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.total, invoice.showDA !== false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals - custom labels & order */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    {(() => {
                      const labels = invoice.summaryLabels || DEFAULT_SUMMARY_LABELS;
                      const order = invoice.summaryOrder || DEFAULT_SUMMARY_ORDER;
                      const showDAVal = invoice.showDA !== false;
                      
                      const renderRow = (key: string) => {
                        if (key === 'tht') return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{labels.tht || 'T.H.T'}</span>
                            <span>{formatCurrency(invoice.sousTotal, showDAVal)}</span>
                          </div>
                        );
                        if (key === 'ttva') return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{labels.ttva || 'T.TVA'}</span>
                            <span>{formatCurrency(invoice.totalTva, showDAVal)}</span>
                          </div>
                        );
                        if (key === 'remise' && invoice.remise && invoice.montantRemise) return (
                          <div key={key} className="flex justify-between text-sm text-destructive">
                            <span>{labels.remise || 'Remise'} ({invoice.remise}%)</span>
                            <span>{formatCurrency(invoice.montantRemise, showDAVal)}</span>
                          </div>
                        );
                        if (key === 'timbre' && invoice.timbre && invoice.montantTimbre) return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{labels.timbre || 'Timbre'} ({invoice.timbre}%)</span>
                            <span>{formatCurrency(invoice.montantTimbre, showDAVal)}</span>
                          </div>
                        );
                        if (key === 'ttc') return (
                          <div key={key}>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between font-bold text-lg">
                              <span>{labels.ttc || 'TTC'}</span>
                              <span className="text-primary">{formatCurrency(invoice.total, showDAVal)}</span>
                            </div>
                          </div>
                        );
                        return null;
                      };

                      return order.map(renderRow);
                    })()}
                  </div>
                </div>

                {/* Notes */}
                {(invoice.notes || invoice.conditions) && (
                  <div className="mt-8 pt-6 border-t space-y-2">
                    {invoice.conditions && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Conditions:</strong> {invoice.conditions}
                      </p>
                    )}
                    {invoice.notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {invoice.notes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
                <Button variant="outline" className="w-full" onClick={handleSendEmail}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer par Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>

            {client && (
              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {client.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{client.nom}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                  {client.telephone && (
                    <p className="text-sm text-muted-foreground">Tél: {client.telephone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
