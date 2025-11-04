import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { accountsPayableSchema, transactionSchema } from "@/lib/validation";
import { z } from "zod";

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  category: string | null;
  suppliers: { name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
}

export default function AccountsPayable() {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: "",
    supplier_id: "",
    amount: "",
    due_date: "",
    category: "",
    notes: "",
  });

  useEffect(() => {
    loadAccounts();
    loadSuppliers();
  }, []);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts_payable')
      .select('*, suppliers(name)')
      .order('due_date');
    
    setAccounts(data || []);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    setSuppliers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = accountsPayableSchema.parse({
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        supplier_id: formData.supplier_id,
        notes: formData.notes,
        category: formData.category,
      });

      const { error } = await supabase.from('accounts_payable').insert([{
        description: validatedData.description,
        amount: validatedData.amount,
        due_date: validatedData.due_date,
        supplier_id: validatedData.supplier_id || null,
        category: validatedData.category,
        notes: validatedData.notes,
      }]);

      if (error) {
        toast({ title: "Erro ao criar conta a pagar", variant: "destructive" });
        return;
      }

      toast({ title: "Conta a pagar criada com sucesso!" });
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

  const markAsPaid = async (id: string, amount: number) => {
    if (!confirm("Confirma o pagamento desta conta?")) return;

    try {
      const validatedTransaction = transactionSchema.parse({
        type: 'expense' as const,
        category: 'Pagamento a Fornecedor',
        amount: amount,
        description: 'Pagamento de conta',
        payment_method: 'transferencia' as const,
      });

      const { error } = await supabase
        .from('accounts_payable')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) {
        toast({ title: "Erro ao marcar como pago", variant: "destructive" });
        return;
      }

      // Registrar transação de despesa
      await supabase.from('transactions').insert([{
        type: validatedTransaction.type,
        category: validatedTransaction.category,
        amount: validatedTransaction.amount,
        description: validatedTransaction.description,
        payment_method: validatedTransaction.payment_method,
      }]);

      toast({ title: "Conta marcada como paga!" });
      loadAccounts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
        return;
      }
      toast({ title: "Erro ao processar pagamento", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      supplier_id: "",
      amount: "",
      due_date: "",
      category: "",
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
    
    const paid = accounts
      .filter(a => a.status === 'paid')
      .reduce((sum, a) => sum + Number(a.amount), 0);

    return { pending, overdue, paid };
  };

  const totals = calculateTotals();

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
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
          <h2 className="text-3xl font-bold tracking-tight">Contas a Pagar</h2>
          <p className="text-muted-foreground">Gerencie suas contas a pagar</p>
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
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
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
                <Label>Fornecedor</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
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
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
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
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totals.paid.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Lista de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
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
                  <TableCell>{account.suppliers?.name || "-"}</TableCell>
                  <TableCell className="font-semibold">
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
                        onClick={() => markAsPaid(account.id, Number(account.amount))}
                      >
                        Marcar como Pago
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