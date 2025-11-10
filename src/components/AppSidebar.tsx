import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  FileText,
  CreditCard,
  TrendingUp,
  CalendarDays,
  UserCog,
  Wallet,
  Factory,
  Tag,
  Gift,
  Bell
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = 'admin' | 'manager' | 'user' | 'cashier';

const menuItems: { title: string; url: string; icon: any; roles: AppRole[] }[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ['admin', 'manager', 'user', 'cashier'] },
  { title: "PDV", url: "/pos", icon: ShoppingCart, roles: ['admin', 'manager', 'user', 'cashier'] },
  { title: "Produtos", url: "/products", icon: Package, roles: ['admin', 'manager', 'user'] },
  { title: "Vendas", url: "/sales", icon: BarChart3, roles: ['admin', 'manager', 'user'] },
  { title: "Clientes", url: "/customers", icon: Users, roles: ['admin', 'manager', 'user'] },
  { title: "Fornecedores", url: "/suppliers", icon: Building2, roles: ['admin', 'manager'] },
  { title: "Compras", url: "/purchases", icon: FileText, roles: ['admin', 'manager'] },
  { title: "Manufatura", url: "/manufacturing", icon: Factory, roles: ['admin', 'manager'] },
  { title: "Contas a Pagar", url: "/accounts-payable", icon: CreditCard, roles: ['admin', 'manager'] },
  { title: "Contas a Receber", url: "/accounts-receivable", icon: TrendingUp, roles: ['admin', 'manager'] },
  { title: "Financeiro", url: "/financial", icon: DollarSign, roles: ['admin', 'manager'] },
  { title: "Controle de Caixa", url: "/cash-control", icon: Wallet, roles: ['admin', 'manager', 'cashier'] },
  { title: "Relatórios", url: "/reports", icon: BarChart3, roles: ['admin', 'manager'] },
  { title: "Promoções", url: "/promotions", icon: Tag, roles: ['admin', 'manager'] },
  { title: "Cupons", url: "/coupons", icon: Gift, roles: ['admin', 'manager'] },
  { title: "Alertas", url: "/alerts", icon: Bell, roles: ['admin', 'manager', 'user'] },
  { title: "Agenda", url: "/calendar", icon: CalendarDays, roles: ['admin', 'manager', 'user'] },
  { title: "Usuários", url: "/users", icon: UserCog, roles: ['admin'] },
  { title: "Configurações", url: "/settings", icon: Settings, roles: ['admin', 'manager'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      navigate("/auth");
      toast.success("Saiu com sucesso");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary-foreground font-semibold text-lg">
            {open ? "ERP System" : "ERP"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => !role || item.roles.includes(role))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {open && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
