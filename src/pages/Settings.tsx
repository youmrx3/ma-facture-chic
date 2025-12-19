import { useState, useRef } from 'react';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Building2, Save, Upload, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { CompanySettings, CompanyField } from '@/types/invoice';
import { toast } from 'sonner';

export default function Settings() {
  const { companySettings, updateCompanySettings } = useInvoice();
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: undefined });
  };

  const handleAddCustomField = () => {
    const newField: CompanyField = {
      id: `custom_${Date.now()}`,
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

  const handleUpdateCustomField = (id: string, updates: Partial<CompanyField>) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const handleDeleteCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter((field) => field.id !== id),
    });
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.email) {
      toast.error("Le nom et l'email sont obligatoires");
      return;
    }
    updateCompanySettings(formData);
    toast.success('Paramètres sauvegardés');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les informations de votre entreprise
          </p>
        </div>

        <Tabs defaultValue="entreprise" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entreprise">Entreprise</TabsTrigger>
            <TabsTrigger value="legal">Informations Légales</TabsTrigger>
            <TabsTrigger value="bancaire">Informations Bancaires</TabsTrigger>
          </TabsList>

          <TabsContent value="entreprise" className="space-y-6">
            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Logo de l'Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {formData.logo ? (
                    <div className="relative">
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="h-24 w-24 rounded-lg object-contain border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.logo ? 'Changer le logo' : 'Télécharger un logo'}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Format recommandé: PNG ou JPG, max 2MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'Entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom du Propriétaire / Gérant *</Label>
                    <Input
                      value={formData.proprietaire}
                      onChange={(e) =>
                        setFormData({ ...formData, proprietaire: e.target.value })
                      }
                      placeholder="Mohamed Ahmed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce nom apparaîtra en premier sur les factures PDF
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nom / Raison Sociale *</Label>
                    <Input
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      placeholder="Votre Entreprise SARL"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="contact@votre-entreprise.dz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      placeholder="+213 555 123 456"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Web</Label>
                    <Input
                      value={formData.siteWeb || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, siteWeb: e.target.value })
                      }
                      placeholder="www.votre-entreprise.dz"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Textarea
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    placeholder="123 Rue des Oliviers, Centre ville"
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      value={formData.ville}
                      onChange={(e) =>
                        setFormData({ ...formData, ville: e.target.value })
                      }
                      placeholder="Alger"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code Postal</Label>
                    <Input
                      value={formData.codePostal}
                      onChange={(e) =>
                        setFormData({ ...formData, codePostal: e.target.value })
                      }
                      placeholder="16000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            {/* Custom Legal Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Informations Légales Personnalisées</span>
                  <Button variant="outline" size="sm" onClick={handleAddCustomField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un champ
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ajoutez vos informations légales (NIF, NIS, RC, AI, etc.) et
                  choisissez lesquelles afficher sur les factures PDF
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.customFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun champ personnalisé</p>
                    <p className="text-sm">
                      Cliquez sur "Ajouter un champ" pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.customFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex-1 grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Libellé</Label>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateCustomField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Ex: NIF, RC, AI..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valeur</Label>
                              <Input
                                value={field.value}
                                onChange={(e) =>
                                  handleUpdateCustomField(field.id, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder="Numéro / Valeur"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.showInPdf}
                                onCheckedChange={(checked) =>
                                  handleUpdateCustomField(field.id, {
                                    showInPdf: checked,
                                  })
                                }
                              />
                              <Label className="text-xs whitespace-nowrap">
                                Afficher PDF
                              </Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCustomField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capital Social */}
            <Card>
              <CardHeader>
                <CardTitle>Autres Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Capital Social</Label>
                  <Input
                    value={formData.capitalSocial || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, capitalSocial: e.target.value })
                    }
                    placeholder="1 000 000 DA"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bancaire" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées Bancaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Banque</Label>
                  <Input
                    value={formData.banque || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, banque: e.target.value })
                    }
                    placeholder="Nom de la banque"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RIB</Label>
                  <Input
                    value={formData.rib || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, rib: e.target.value })
                    }
                    placeholder="Relevé d'Identité Bancaire"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
