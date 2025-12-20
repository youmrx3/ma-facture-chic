import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InvoiceProvider } from "@/contexts/InvoiceContext";
import Dashboard from "./pages/Dashboard";
import InvoiceList from "./pages/InvoiceList";
import CreateInvoice from "./pages/CreateInvoice";
import EditInvoice from "./pages/EditInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import ClientList from "./pages/ClientList";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <InvoiceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/factures" element={<InvoiceList />} />
            <Route path="/factures/nouvelle" element={<CreateInvoice />} />
            <Route path="/factures/:id" element={<InvoiceDetail />} />
            <Route path="/factures/:id/modifier" element={<EditInvoice />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/parametres" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </InvoiceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
