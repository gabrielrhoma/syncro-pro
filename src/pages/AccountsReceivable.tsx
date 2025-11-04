import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { accountsReceivableSchema, transactionSchema } from "@/lib/validation";
import { z } from "zod";

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  customers: { name: string } | null;
}

interface Customer {
  id: string;
  name: string;
}

export default function AccountsReceivable() {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: "",
    customer_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    loadAccounts();
    loadCustomers();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts_receivable')
      .select('*, customers(name)')
      .order('due_date');
    
    setAccounts(data || []);
  };

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .order('name');
    
    setCustomers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = accountsReceivableSchema.parse({
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        customer_id: formData.customer_id,
        notes: formData.notes,
      });

      const { error } = await supabase.from('accounts_receivable').insert([{
        description: validatedData.description,
        amount: validatedData.amount,
        due_date: validatedData.due_date,
        customer_id: validatedData.customer_id || null,
        notes: validatedData.notes,
      }]);

      if (error) {
        toast({ title: "Erro ao criar conta a receber", variant: "destructive" });
        return;
      }

      toast({ title: "Conta a receber criada com sucesso!" });
      resetForm();
      loadAccounts();
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
        return;
      }
      toast({ title: "Erro ao processar dados", variant: "destructive" });
    }
  };

  const markAsReceived = async (id: string, amount: number) => {
    if (!confirm("Confirma o recebimento desta conta?")) return;

    try {
      const validatedTransaction = transactionSchema.parse({
        type: 'income' as const,
        category: 'Recebimento',
        amount: amount,
        description: 'Recebimento de conta',
        payment_method: 'transferencia' as const,
      });

      const { error } = await supabase
        .from('accounts_receivable')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) {
        toast({ title: "Erro ao marcar como recebido", variant: "destructive" });
        return;
      }

      // Registrar transação de receita
      await supabase.from('transactions').insert([{
        type: validatedTransaction.type,
        category: validatedTransaction.category,
        amount: validatedTransaction.amount,
        description: validatedTransaction.description,
        payment_method: validatedTransaction.payment_method,
      }]);

      toast({ title: "Conta marcada como recebida!" });
      loadAccounts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
        return;
      }
      toast({ title: "Erro ao processar recebimento", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      customer_id: "",
      amount: "",
      due_date: "",
      notes: "",
    });
  };

  const calculateTotals = () => {
    const pending = accounts
      .filter(a => a.status === 'pending')
      .reduce((sum, a) => sum + Number(a.amount), 0);
    
    const overdue = accounts
      .filter(a => a.status === 'overdue')
      .reduce((sum, a) => sum + Number(a.amount), 0);
    
    const received = accounts
      .filter(a => a.status === 'paid')
      .reduce((sum, a) => sum + Number(a.amount), 0);

    return { pending, overdue, received };
  };

  const totals = calculateTotals();

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    paid: "Recebido",
    overdue: "Vencido",
    cancelled: "Cancelado",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    paid: "outline",
    overdue: "destructive",
    cancelled: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas a Receber</h2>
          <p className="text-muted-foreground">Gerencie suas contas a receber</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Conta a Receber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {totals.pending.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totals.overdue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totals.received.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lista de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.description}</TableCell>
                  <TableCell>{account.customers?.name || "Cliente Avulso"}</TableCell>
                  <TableCell className="font-semibold text-accent">
                    R$ {Number(account.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(account.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[account.status]}>
                      {statusLabels[account.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {account.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsReceived(account.id, Number(account.amount))}
                      >
                        Marcar como Recebido
                      </Button>
                    )}
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