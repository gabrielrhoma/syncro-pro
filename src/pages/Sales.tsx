import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  sale_number: string;
  final_amount: number;
  payment_method: string;
  created_at: string;
  customers: { name: string } | null;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const { data } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .order('created_at', { ascending: false });

    setSales(data || []);
  };

  const paymentMethodLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
    pix: "PIX",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vendas</h2>
        <p className="text-muted-foreground">Histórico de vendas realizadas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.sale_number}</TableCell>
                  <TableCell>{sale.customers?.name || "Cliente Avulso"}</TableCell>
                  <TableCell className="font-semibold text-accent">
                    R$ {Number(sale.final_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{paymentMethodLabels[sale.payment_method] || sale.payment_method}</TableCell>
                  <TableCell>
                    {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
