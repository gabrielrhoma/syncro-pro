import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StoreCredit() {
  const [credits, setCredits] = useState([]);

  useEffect(() => {
    loadStoreCredits();
  }, []);

  const loadStoreCredits = async () => {
    const { data } = await supabase
      .from('customer_store_credit')
      .select('*, customer:customers(name)')
      .order('balance', { ascending: false });
    setCredits(data || []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Crédito em Loja</h2>
        <p className="text-muted-foreground">Saldo de crédito dos clientes</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Saldo dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map(credit => (
                <TableRow key={credit.id}>
                  <TableCell>{credit.customer.name}</TableCell>
                  <TableCell>R$ {credit.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
