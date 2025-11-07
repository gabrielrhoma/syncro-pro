import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SalesCommissions() {
  const [commissions, setCommissions] = useState([]);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    const { data } = await supabase
      .from('sales_commissions')
      .select('*, sale:sales(sale_number), salesperson:profiles(full_name)')
      .order('created_at', { ascending: false });
    setCommissions(data || []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Minhas Comissões</h2>
        <p className="text-muted-foreground">Comissões de vendas pendentes e pagas</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map(commission => (
                <TableRow key={commission.id}>
                  <TableCell>{commission.sale.sale_number}</TableCell>
                  <TableCell>{commission.salesperson.full_name}</TableCell>
                  <TableCell>R$ {commission.commission_amount.toFixed(2)}</TableCell>
                  <TableCell><Badge>{commission.status}</Badge></TableCell>
                  <TableCell>{new Date(commission.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
