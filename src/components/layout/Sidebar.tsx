import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Plus,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Factures', href: '/factures', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Paramètres', href: '/parametres', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold">
            <Receipt className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-xl font-bold">FacturePro</span>
        </div>

        {/* New Invoice Button */}
        <div className="p-4">
          <Button asChild variant="gold" className="w-full">
            <Link to="/factures/nouvelle">
              <Plus className="h-4 w-4" />
              Nouvelle Facture
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50">
            © 2024 FacturePro
          </p>
        </div>
      </div>
    </aside>
  );
}
