import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Package, ShoppingCart, TrendingUp, Users, Sparkles } from "lucide-react";
import AIAssistant from "@/components/AIAssistant";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { AIService } from "@/services/aiService";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/contexts/StoreContext";

export default function Dashboard() {
  const { currentStore } = useStore();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    lowStockProducts: 0,
  });
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    if (!currentStore) return;
    
    const today = new Date().toISOString().split('T')[0];

    const [salesRes, productsRes, customersRes, todaySalesRes, lowStockRes] = await Promise.all([
      supabase.from('sales').select('final_amount', { count: 'exact' }).eq('store_id', currentStore.id),
      supabase.from('products').select('*', { count: 'exact' }).eq('store_id', currentStore.id),
      supabase.from('customers').select('*', { count: 'exact' }),
      supabase.from('sales').select('final_amount').eq('store_id', currentStore.id).gte('created_at', today),
      supabase.from('products').select('*').eq('store_id', currentStore.id).lt('stock_quantity', supabase.from('products').select('min_stock')),
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

  const loadChartData = async () => {
    if (!currentStore) return;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const salesData = await Promise.all(
      last7Days.map(async (date) => {
        const { data } = await supabase
          .from('sales')
          .select('final_amount')
          .eq('store_id', currentStore.id)
          .gte('created_at', date)
          .lt('created_at', new Date(new Date(date).getTime() + 86400000).toISOString());
        
        const total = data?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
        const dayName = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
        return { day: dayName, vendas: total };
      })
    );

    setSalesChart(salesData);

    const { data: productsData } = await supabase
      .from('sale_items')
      .select('product_id, quantity, products(name)')
      .limit(100);

    const productMap = new Map();
    productsData?.forEach((item: any) => {
      const name = item.products?.name || 'Produto sem nome';
      const current = productMap.get(name) || 0;
      productMap.set(name, current + item.quantity);
    });

    const topProds = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ produto: name, vendas: qty }));

    setTopProducts(topProds);

    // Gerar insights de IA
    await generateAIInsights(salesData, topProds);
  };

  const generateAIInsights = async (salesData: any[], topProds: any[]) => {
    setLoadingInsight(true);
    try {
      const { data: allProducts } = await supabase
        .from('products')
        .select('name, stock_quantity, min_stock');
      
      const lowStockProds = allProducts?.filter(p => p.stock_quantity < p.min_stock).slice(0, 5);

      const lowStockNames = lowStockProds?.map(p => p.name) || [];

      const insight = await AIService.generateDashboardInsights({
        salesData,
        topProducts: topProds,
        lowStockProducts: lowStockNames,
      });

      setAiInsight(insight);
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    } finally {
      setLoadingInsight(false);
    }
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                />
                <Line type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="produto" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInsight ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed">
                {aiInsight || "Carregando insights..."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AIAssistant />
    </div>
  );
}
