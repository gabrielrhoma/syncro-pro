import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    const [salesRes, productsRes, customersRes, todaySalesRes, lowStockRes] = await Promise.all([
      supabase.from('sales').select('final_amount', { count: 'exact' }),
      supabase.from('products').select('*', { count: 'exact' }),
      supabase.from('customers').select('*', { count: 'exact' }),
      supabase.from('sales').select('final_amount').gte('created_at', today),
      supabase.from('products').select('*').lt('stock_quantity', supabase.from('products').select('min_stock')),
    ]);

    const totalSales = salesRes.data?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
    const todayTotal = todaySalesRes.data?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;

    setStats({
      totalSales,
      totalProducts: productsRes.count || 0,
      totalCustomers: customersRes.count || 0,
      todaySales: todayTotal,
      lowStockProducts: lowStockRes.data?.length || 0,
    });
  };

  const statCards = [
    {
      title: "Vendas Total",
      value: `R$ ${stats.totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Vendas Hoje",
      value: `R$ ${stats.todaySales.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Produtos",
      value: stats.totalProducts,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Clientes",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStockProducts,
      icon: ShoppingCart,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade recente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total em Vendas:</span>
                <span className="font-semibold text-accent">R$ {stats.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hoje:</span>
                <span className="font-semibold text-accent">R$ {stats.todaySales.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
