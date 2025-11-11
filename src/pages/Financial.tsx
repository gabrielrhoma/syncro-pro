import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { transactionSchema } from "@/lib/validation";
import { z } from "zod";

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  transaction_date: string;
}

export default function Financial() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [open, setOpen] = useState(false);
  const [cashFlow, setCashFlow] = useState({
    cashBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    projectedFlow: 0,
  });
  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    description: "",
    amount: "",
    payment_method: "dinheiro",
  });

  useEffect(() => {
    loadTransactions();
    loadCashFlow();
  }, []);

  const loadCashFlow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userStores } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id);

    const storeIds = userStores?.map(us => us.store_id) || [];

    // Saldo em caixa (caixas abertos)
    const { data: registers } = await supabase
      .from('cash_registers')
      .select('current_cash_amount')
      .eq('status', 'open')
      .in('store_id', storeIds);
    
    const cashBalance = registers?.reduce((sum, r) => sum + Number(r.current_cash_amount), 0) || 0;

    // Contas a receber (pendentes)
    const { data: receivables } = await supabase
      .from('accounts_receivable')
      .select('amount')
      .eq('status', 'pending');
    
    const accountsReceivable = receivables?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    // Contas a pagar (pendentes)
    const { data: payables } = await supabase
      .from('accounts_payable')
      .select('amount')
      .eq('status', 'pending');
    
    const accountsPayable = payables?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Fluxo de caixa projetado
    const projectedFlow = cashBalance + accountsReceivable - accountsPayable;

    setCashFlow({
      cashBalance,
      accountsReceivable,
      accountsPayable,
      projectedFlow,
    });
  };

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userStores } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id);

    const storeIds = userStores?.map(us => us.store_id) || [];

    const { data, error } = await supabase
      .from('transactions' as any)
      .select('*')
      .in('store_id', storeIds)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } else {
      setTransactions((data || []) as any);
    }
  };

  const calculateTotals = () => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return { income, expense, balance: income - expense };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = transactionSchema.parse({
        type: formData.type,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: userStores } = await supabase
        .from('user_stores')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!userStores) {
        toast.error('Usuário não vinculado a loja');
        return;
      }

      const { error } = await supabase.from('transactions' as any).insert([{
        type: validatedData.type,
        category: validatedData.category,
        description: validatedData.description,
        amount: validatedData.amount,
        payment_method: validatedData.payment_method,
        created_by: user.id,
        store_id: userStores.store_id,
      }]);

      if (error) {
        toast.error("Erro ao criar transação");
      } else {
        toast.success("Transação criada!");
        setOpen(false);
        loadTransactions();
        resetForm();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
      toast.error("Erro ao processar transação");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      description: "",
      amount: "",
      payment_method: "dinheiro",
    });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">Controle de receitas e despesas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {cashFlow.cashBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Caixas abertos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">R$ {cashFlow.accountsReceivable.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {cashFlow.accountsPayable.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">R$ {totals.income.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>

        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fluxo Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${cashFlow.projectedFlow >= 0 ? 'text-accent' : 'text-destructive'}`}>
              R$ {cashFlow.projectedFlow.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo + Receber - Pagar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.transaction_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-accent' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'} R$ {Number(transaction.amount).toFixed(2)}
                    </span>
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
