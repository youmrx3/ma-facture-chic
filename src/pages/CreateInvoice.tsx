import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceType, INVOICE_TYPE_LABELS, SummaryRow, DEFAULT_SUMMARY_ROWS } from '@/types/invoice';
import { SummaryBuilder } from '@/components/SummaryBuilder';
import { computeSummary } from '@/lib/summary';
import { toast } from 'sonner';

const formatCurrency = (amount: number, showDA: boolean) => {
  const formatted = new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return showDA ? formatted + ' DA' : formatted;
};

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { clients, addInvoice, getNextInvoiceNumber, units, addUnit } = useInvoice();
  
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('facture');
  const [clientId, setClientId] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('Paiement à 30 jours');
  const [showEcheance, setShowEcheance] = useState(true);
  const [showDA, setShowDA] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>(
    () => JSON.parse(JSON.stringify(DEFAULT_SUMMARY_ROWS)),
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantite: 1,
      unite: 'Unité',
      prixUnitaire: 0,
      tva: 19,
      total: 0,
    },
  ]);
  const [newUnit, setNewUnit] = useState('');

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantite * item.prixUnitaire;
    const tvaAmount = subtotal * (item.tva / 100);
    return subtotal + tvaAmount;
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.total = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: '',
        quantite: 1,
        unite: 'Unité',
        prixUnitaire: 0,
        tva: 19,
        total: 0,
      },
    ]);
  };

  const handleAddUnit = () => {
    if (newUnit.trim()) {
      addUnit(newUnit.trim());
      setNewUnit('');
    }
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const computed = computeSummary(summaryRows, items);
  const sousTotal = computed.tht;
  const totalTva = computed.totalTvaItems;
  const total = computed.finalTotal;

  const handleSubmit = () => {
    if (!clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (items.some((item) => !item.description || item.prixUnitaire <= 0)) {
      toast.error('Veuillez remplir tous les articles');
      return;
    }

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      numero: getNextInvoiceNumber(invoiceType),
      type: invoiceType,
      status: 'brouillon',
      clientId,
      dateCreation: new Date().toISOString(),
      dateEcheance: dateEcheance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items,
      sousTotal,
      totalTva,
      total,
      notes,
      conditions,
      showEcheance,
      showDA,
      showLogo,
      summaryRows,
    };

    addInvoice(invoice);
    toast.success('Facture créée avec succès');
    navigate(`/factures/${invoice.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nouvelle Facture</h1>
            <p className="text-muted-foreground mt-1">
              Créez une nouvelle facture ou document
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type & Client */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type de Document</Label>
                    <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INVOICE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Aucun client. Créez-en un d'abord.
                          </div>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.nom}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Date d'échéance</Label>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Afficher</Label>
                      <Switch checked={showEcheance} onCheckedChange={setShowEcheance} />
                    </div>
                  </div>
                  <Input
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <Label>Afficher "DA" dans les prix</Label>
                  <Switch checked={showDA} onCheckedChange={setShowDA} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <Label>Afficher le logo</Label>
                  <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-4 p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Article {index + 1}
                        </span>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Description de l'article ou service"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-5">
                        <div className="space-y-2">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantite}
                            onChange={(e) => updateItem(item.id, 'quantite', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unité</Label>
                          <Select
                            value={item.unite}
                            onValueChange={(v) => updateItem(item.id, 'unite', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                              <div className="p-2 border-t">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Nouvelle unité"
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    className="h-8 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      e.stopPropagation();
                                      if (e.key === 'Enter') {
                                        handleAddUnit();
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddUnit();
                                    }}
                                    className="h-8"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>P.U {showDA ? '(DA)' : ''}</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.prixUnitaire}
                            onChange={(e) => updateItem(item.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TVA (%)</Label>
                          <Select
                            value={item.tva.toString()}
                            onValueChange={(v) => updateItem(item.id, 'tva', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="9">9%</SelectItem>
                              <SelectItem value="19">19%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <div className="h-10 flex items-center px-3 rounded-md border bg-muted font-medium">
                            {formatCurrency(item.total, showDA)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes et Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes additionnelles pour le client..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conditions de paiement</Label>
                  <Input
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="Ex: Paiement à 30 jours"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Remise */}
                  <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Remise (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={remise}
                        onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Timbre */}
                  <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Timbre (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={timbre}
                        onChange={(e) => setTimbre(parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-border" />
                  <Label className="text-xs text-muted-foreground">Survolez pour réordonner ou renommer</Label>

                  <SummaryEditor
                    summaryLabels={summaryLabels}
                    summaryOrder={summaryOrder}
                    onLabelsChange={setSummaryLabels}
                    onOrderChange={setSummaryOrder}
                    sousTotal={sousTotal}
                    totalTva={totalTva}
                    remise={remise}
                    montantRemise={montantRemise}
                    timbre={timbre}
                    montantTimbre={montantTimbre}
                    total={total}
                    showDA={showDA}
                    formatCurrency={formatCurrency}
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <Button className="w-full" onClick={handleSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
