import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceType, INVOICE_TYPE_LABELS } from '@/types/invoice';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA';
};

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, clients, updateInvoice, units, addUnit } = useInvoice();
  
  const existingInvoice = invoices.find((i) => i.id === id);
  
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('facture');
  const [clientId, setClientId] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newUnit, setNewUnit] = useState('');

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceType(existingInvoice.type);
      setClientId(existingInvoice.clientId);
      setDateEcheance(existingInvoice.dateEcheance.split('T')[0]);
      setNotes(existingInvoice.notes || '');
      setConditions(existingInvoice.conditions || '');
      setItems(existingInvoice.items);
    }
  }, [existingInvoice]);

  if (!existingInvoice) {
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

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const sousTotal = items.reduce((sum, item) => sum + item.quantite * item.prixUnitaire, 0);
  const totalTva = items.reduce(
    (sum, item) => sum + item.quantite * item.prixUnitaire * (item.tva / 100),
    0
  );
  const total = sousTotal + totalTva;

  const handleSubmit = () => {
    if (!clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (items.some((item) => !item.description || item.prixUnitaire <= 0)) {
      toast.error('Veuillez remplir tous les articles');
      return;
    }

    const updatedInvoice: Invoice = {
      ...existingInvoice,
      type: invoiceType,
      clientId,
      dateEcheance: dateEcheance || existingInvoice.dateEcheance,
      items,
      sousTotal,
      totalTva,
      total,
      notes,
      conditions,
    };

    updateInvoice(updatedInvoice);
    toast.success('Facture modifiée avec succès');
    navigate(`/factures/${existingInvoice.id}`);
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
            <h1 className="text-3xl font-bold text-foreground">Modifier la Facture</h1>
            <p className="text-muted-foreground mt-1">
              {existingInvoice.numero}
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
                  <Label>Date d'échéance</Label>
                  <Input
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                  />
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
                            value={item.unite || 'Unité'}
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
                          <Label>P.U (DA)</Label>
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
                            {formatCurrency(item.total)}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">T.H.T</span>
                    <span>{formatCurrency(sousTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">T.TVA</span>
                    <span>{formatCurrency(totalTva)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>TTC</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button className="w-full" onClick={handleSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les modifications
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
