import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Financial from "./pages/Financial";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import NewPurchaseOrder from "./pages/NewPurchaseOrder";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import RecoverPassword from "./pages/RecoverPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import Calendar from "./pages/Calendar";
import CashControl from "./pages/CashControl";
import FiscalSettings from "./pages/FiscalSettings";
import Manufacturing from "./pages/Manufacturing";
import Promotions from "./pages/Promotions";
import Coupons from "./pages/Coupons";
import PriceLists from "./pages/PriceLists";
import BankReconciliation from "./pages/BankReconciliation";
import AuditLog from "./pages/AuditLog";
import Alerts from "./pages/Alerts";
import InventoryAdjustments from "./pages/InventoryAdjustments";
import StoreCredit from "./pages/StoreCredit";
import SalesCommissions from "./pages/SalesCommissions";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Layout>{children}</Layout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/recuperar-senha" element={<RecoverPassword />} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
              <Route path="/purchases/new" element={<ProtectedRoute><NewPurchaseOrder /></ProtectedRoute>} />
              <Route path="/accounts-payable" element={<ProtectedRoute><AccountsPayable /></ProtectedRoute>} />
              <Route path="/accounts-receivable" element={<ProtectedRoute><AccountsReceivable /></ProtectedRoute>} />
              <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/fiscal" element={<ProtectedRoute><FiscalSettings /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/cash-control" element={<ProtectedRoute><CashControl /></ProtectedRoute>} />
              <Route path="/inventory/adjustments" element={<ProtectedRoute><InventoryAdjustments /></ProtectedRoute>} />
              <Route path="/inventory/manufacturing" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin', 'manager']}><Manufacturing /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/settings/promotions" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin', 'manager']}><Promotions /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/settings/coupons" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin', 'manager']}><Coupons /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/settings/price-lists" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin', 'manager']}><PriceLists /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/financial/reconciliation" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><BankReconciliation /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/settings/audit-log" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AuditLog /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/sales/commissions" element={<ProtectedRoute><SalesCommissions /></ProtectedRoute>} />
              <Route path="/customers/store-credit" element={<ProtectedRoute><StoreCredit /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><UserManagement /></RoleProtectedRoute></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StoreProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;
