import { useState } from 'react';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Client, ClientField } from '@/types/invoice';
import { toast } from 'sonner';

interface ClientFormData {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  customFields: ClientField[];
}

const defaultCustomFields: ClientField[] = [
  { id: 'nif', label: 'NIF', value: '', showInPdf: true, order: 1 },
  { id: 'nis', label: 'NIS', value: '', showInPdf: true, order: 2 },
  { id: 'rc', label: 'RC', value: '', showInPdf: true, order: 3 },
];

const emptyFormData: ClientFormData = {
  nom: '',
  email: '',
  telephone: '',
  adresse: '',
  ville: '',
  codePostal: '',
  customFields: [...defaultCustomFields],
};

export default function ClientList() {
  const { clients, addClient, updateClient, deleteClient } = useInvoice();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData);

  const filteredClients = clients.filter((client) =>
    (client.nom?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (client.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nom: client.nom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        codePostal: client.codePostal || '',
        customFields: client.customFields || [
          { id: 'nif', label: 'NIF', value: client.nif || '', showInPdf: true, order: 1 },
          { id: 'nis', label: 'NIS', value: client.nis || '', showInPdf: true, order: 2 },
          { id: 'rc', label: 'RC', value: client.rc || '', showInPdf: true, order: 3 },
        ],
      });
    } else {
      setEditingClient(null);
      setFormData({
        ...emptyFormData,
        customFields: [...defaultCustomFields],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const clientData: Client = {
      id: editingClient?.id || crypto.randomUUID(),
      nom: formData.nom || undefined,
      email: formData.email || undefined,
      telephone: formData.telephone || undefined,
      adresse: formData.adresse || undefined,
      ville: formData.ville || undefined,
      codePostal: formData.codePostal || undefined,
      customFields: formData.customFields,
    };

    if (editingClient) {
      updateClient(clientData);
      toast.success('Client mis à jour');
    } else {
      addClient(clientData);
      toast.success('Client ajouté');
    }
    setIsDialogOpen(false);
    setFormData(emptyFormData);
    setEditingClient(null);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    toast.success('Client supprimé');
  };

  const handleAddCustomField = () => {
    const newField: ClientField = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
      showInPdf: true,
      order: formData.customFields.length + 1,
    };
    setFormData({
      ...formData,
      customFields: [...formData.customFields, newField],
    });
  };

  const handleUpdateCustomField = (id: string, updates: Partial<ClientField>) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  const handleDeleteCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((f) => f.id !== id),
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre liste de clients
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom / Raison Sociale</Label>
                    <Input
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Entreprise SARL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@entreprise.dz"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="+213 555 123 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code Postal</Label>
                    <Input
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      placeholder="16000"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Input
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      placeholder="123 Rue des Oliviers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      placeholder="Alger"
                    />
                  </div>
                </div>

                {/* Custom Fields Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Informations Légales</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un champ
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez des informations comme NIF, NIS, RC, AI, etc. et choisissez lesquelles apparaîtront sur le PDF.
                  </p>
                  
                  <div className="space-y-3">
                    {formData.customFields.map((field) => (
                      <div key={field.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Libellé (ex: NIF)"
                            value={field.label}
                            onChange={(e) => handleUpdateCustomField(field.id, { label: e.target.value })}
                          />
                          <Input
                            placeholder="Valeur"
                            value={field.value}
                            onChange={(e) => handleUpdateCustomField(field.id, { value: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={field.showInPdf}
                              onCheckedChange={(checked) => handleUpdateCustomField(field.id, { showInPdf: checked })}
                            />
                            {field.showInPdf ? (
                              <Eye className="h-4 w-4 text-primary" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCustomField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit}>
                  {editingClient ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Client List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="py-16 text-center">
                <Users className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Aucun client trouvé
                </p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez votre premier client pour commencer
                </p>
                <Button className="mt-6" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4" />
                  Ajouter un client
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {(client.nom || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{client.nom || 'Sans nom'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{client.ville || ''}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.telephone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{client.telephone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
