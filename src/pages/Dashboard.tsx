import { useInvoice } from '@/contexts/InvoiceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { INVOICE_TYPE_LABELS, INVOICE_STATUS_LABELS } from '@/types/invoice';

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

export default function Dashboard() {
  const { invoices, clients, getClientById } = useInvoice();

  const totalFactures = invoices.filter((i) => i.type === 'facture').length;
  const totalPayees = invoices.filter((i) => i.status === 'payee').reduce((sum, i) => sum + i.total, 0);
  const totalEnAttente = invoices.filter((i) => i.status === 'envoyee').reduce((sum, i) => sum + i.total, 0);
  const recentInvoices = [...invoices].sort((a, b) => 
    new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
  ).slice(0, 5);

  const stats = [
    {
      title: 'Total Factures',
      value: totalFactures.toString(),
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Clients',
      value: clients.length.toString(),
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Revenus Encaissés',
      value: formatCurrency(totalPayees),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'En Attente',
      value: formatCurrency(totalEnAttente),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue dans votre espace de gestion de facturation
            </p>
          </div>
          <Button asChild>
            <Link to="/factures/nouvelle">
              <Plus className="h-4 w-4" />
              Nouvelle Facture
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Invoices */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dernières Factures</CardTitle>
            <Button variant="ghost" asChild>
              <Link to="/factures" className="flex items-center gap-2">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Aucune facture pour le moment</p>
                <Button asChild className="mt-4">
                  <Link to="/factures/nouvelle">
                    <Plus className="h-4 w-4" />
                    Créer votre première facture
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => {
                  const client = getClientById(invoice.clientId);
                  return (
                    <Link
                      key={invoice.id}
                      to={`/factures/${invoice.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.numero}</p>
                          <p className="text-sm text-muted-foreground">
                            {client?.nom || 'Client inconnu'} • {formatDate(invoice.dateCreation)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={getStatusVariant(invoice.status) as any}>
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </Badge>
                        <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                      </div>
                    </Link>
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
