import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductSales {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface CategorySales {
  category_name: string;
  total_revenue: number;
}

interface CustomerStats {
  customer_name: string;
  total_purchases: number;
  total_spent: number;
}

export default function Reports() {
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategorySales[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerStats[]>([]);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    // Top produtos vendidos
    const { data: productsData } = await supabase
      .from('sale_items')
      .select('product_id, quantity, subtotal, products(name)')
      .limit(1000);

    if (productsData) {
      const productMap = new Map<string, ProductSales>();
      
      productsData.forEach(item => {
        const name = (item.products as any)?.name || 'Produto Desconhecido';
        const existing = productMap.get(name);
        
        if (existing) {
          existing.total_quantity += item.quantity;
          existing.total_revenue += Number(item.subtotal);
        } else {
          productMap.set(name, {
            product_name: name,
            total_quantity: item.quantity,
            total_revenue: Number(item.subtotal),
          });
        }
      });

      const sorted = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
      
      setTopProducts(sorted);
    }

    // Vendas por categoria
    const { data: categoriesData } = await supabase
      .from('sale_items')
      .select('subtotal, products(categories(name))')
      .limit(1000);

    if (categoriesData) {
      const categoryMap = new Map<string, number>();
      
      categoriesData.forEach(item => {
        const category = (item.products as any)?.categories?.name || 'Sem Categoria';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Number(item.subtotal));
      });

      const categorySorted = Array.from(categoryMap.entries())
        .map(([name, revenue]) => ({ category_name: name, total_revenue: revenue }))
        .sort((a, b) => b.total_revenue - a.total_revenue);
      
      setCategoryStats(categorySorted);
    }

    // Top clientes
    const { data: customersData } = await supabase
      .from('sales')
      .select('customer_id, final_amount, customers(name)')
      .limit(1000);

    if (customersData) {
      const customerMap = new Map<string, CustomerStats>();
      
      customersData.forEach(sale => {
        const name = (sale.customers as any)?.name || 'Cliente Avulso';
        const existing = customerMap.get(name);
        
        if (existing) {
          existing.total_purchases += 1;
          existing.total_spent += Number(sale.final_amount);
        } else {
          customerMap.set(name, {
            customer_name: name,
            total_purchases: 1,
            total_spent: Number(sale.final_amount),
          });
        }
      });

      const customerSorted = Array.from(customerMap.values())
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);
      
      setTopCustomers(customerSorted);
    }

    // DRE Simplificado
    const { data: salesData } = await supabase
      .from('sales')
      .select('final_amount');

    const { data: itemsData } = await supabase
      .from('sale_items')
      .select('quantity, products(cost_price)');

    const { data: expensesData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense');

    const totalRevenue = salesData?.reduce((sum, s) => sum + Number(s.final_amount), 0) || 0;
    
    const totalCost = itemsData?.reduce((sum, item) => {
      const cost = Number((item.products as any)?.cost_price || 0);
      return sum + (cost * item.quantity);
    }, 0) || 0;

    const grossProfit = totalRevenue - totalCost;
    
    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    
    const netProfit = grossProfit - totalExpenses;

    setFinancialStats({
      totalRevenue,
      totalCost,
      grossProfit,
      totalExpenses,
      netProfit,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h2>
        <p className="text-muted-foreground">Análises e insights do negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {financialStats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {financialStats.totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {financialStats.grossProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {financialStats.totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-accent' : 'text-red-600'}`}>
              R$ {financialStats.netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top 10 Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{product.total_quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-accent">
                      R$ {product.total_revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vendas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryStats.map((category, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{category.category_name}</TableCell>
                    <TableCell className="text-right font-semibold text-accent">
                      R$ {category.total_revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 10 Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((customer, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell className="text-right">{customer.total_purchases}</TableCell>
                  <TableCell className="text-right font-semibold text-accent">
                    R$ {customer.total_spent.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}