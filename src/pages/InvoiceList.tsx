import { useState } from 'react';
import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Eye,
  Trash2,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INVOICE_TYPE_LABELS, INVOICE_STATUS_LABELS, InvoiceType, InvoiceStatus } from '@/types/invoice';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
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

const getTypeColor = (type: InvoiceType) => {
  switch (type) {
    case 'facture':
      return 'bg-primary/10 text-primary';
    case 'proforma':
      return 'bg-accent/10 text-accent-foreground';
    case 'devis':
      return 'bg-success/10 text-success';
    case 'avoir':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function InvoiceList() {
  const { invoices, clients, getClientById, deleteInvoice } = useInvoice();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const client = getClientById(invoice.clientId);
    const matchesSearch =
      invoice.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Factures</h1>
            <p className="text-muted-foreground mt-1">
              Gérez toutes vos factures et documents
            </p>
          </div>
          <Button asChild>
            <Link to="/factures/nouvelle">
              <Plus className="h-4 w-4" />
              Nouvelle Facture
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(INVOICE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card>
          <CardContent className="p-0">
            {sortedInvoices.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Aucune facture trouvée
                </p>
                <p className="text-sm text-muted-foreground">
                  Créez votre première facture pour commencer
                </p>
                <Button asChild className="mt-6">
                  <Link to="/factures/nouvelle">
                    <Plus className="h-4 w-4" />
                    Créer une facture
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {sortedInvoices.map((invoice) => {
                  const client = getClientById(invoice.clientId);
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getTypeColor(invoice.type)}`}>
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{invoice.numero}</p>
                            <Badge variant="outline" className="text-xs">
                              {INVOICE_TYPE_LABELS[invoice.type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {client?.nom || 'Client inconnu'} • {formatDate(invoice.dateCreation)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Badge variant={getStatusVariant(invoice.status) as any}>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </Badge>
                        <span className="font-bold text-lg min-w-[120px] text-right">
                          {formatCurrency(invoice.total)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/factures/${invoice.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/factures/${invoice.id}`}>
                                <Send className="h-4 w-4 mr-2" />
                                Envoyer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
