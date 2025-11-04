import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashRegister {
  id: string;
  name: string;
  opening_balance: number;
  current_cash_amount: number;
  closing_balance: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  notes: string | null;
}

export default function CashControl() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "Caixa Principal",
    opening_balance: "",
  });
  const [closeData, setCloseData] = useState({
    closing_balance: "",
    notes: "",
  });

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    const { data } = await supabase
      .from('cash_registers')
      .select('*')
      .order('opened_at', { ascending: false });

    setRegisters(data || []);
    const active = data?.find((r) => r.status === 'open');
    setActiveRegister(active || null);
  };

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('cash_registers').insert({
      name: formData.name,
      opening_balance: parseFloat(formData.opening_balance),
      current_cash_amount: parseFloat(formData.opening_balance),
      opened_by: user?.id,
      status: 'open',
    });

    if (error) {
      toast.error("Erro ao abrir caixa");
    } else {
      toast.success("Caixa aberto!");
      setOpenDialog(false);
      loadRegisters();
      setFormData({ name: "Caixa Principal", opening_balance: "" });
    }
  };

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeRegister) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('cash_registers')
      .update({
        status: 'closed',
        closing_balance: parseFloat(closeData.closing_balance),
        closed_at: new Date().toISOString(),
        closed_by: user?.id,
        notes: closeData.notes,
      })
      .eq('id', activeRegister.id);

    if (error) {
      toast.error("Erro ao fechar caixa");
    } else {
      toast.success("Caixa fechado!");
      setCloseDialog(false);
      loadRegisters();
      setCloseData({ closing_balance: "", notes: "" });
    }
  };

  const difference = activeRegister && closeData.closing_balance
    ? parseFloat(closeData.closing_balance) - activeRegister.current_cash_amount
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Controle de Caixa</h2>
          <p className="text-muted-foreground">Gerencie a abertura e fechamento do caixa</p>
        </div>
        <div className="flex gap-2">
          {!activeRegister && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Unlock className="mr-2 h-4 w-4" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleOpenRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Caixa</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opening_balance">Saldo Inicial *</Label>
                    <Input
                      id="opening_balance"
                      type="number"
                      step="0.01"
                      value={formData.opening_balance}
                      onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Abrir Caixa</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {activeRegister && (
            <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Lock className="mr-2 h-4 w-4" />
                  Fechar Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Fechar Caixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCloseRegister} className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Saldo Inicial:</span>
                      <span className="font-semibold">R$ {activeRegister.opening_balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Saldo Esperado:</span>
                      <span className="font-semibold">R$ {activeRegister.current_cash_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closing_balance">Saldo Final (Contado) *</Label>
                    <Input
                      id="closing_balance"
                      type="number"
                      step="0.01"
                      value={closeData.closing_balance}
                      onChange={(e) => setCloseData({ ...closeData, closing_balance: e.target.value })}
                      required
                    />
                  </div>

                  {closeData.closing_balance && (
                    <div className={`p-3 rounded-lg ${difference === 0 ? 'bg-accent/10' : difference > 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Diferença:</span>
                        <span className={`text-lg font-bold ${difference === 0 ? 'text-accent' : difference > 0 ? 'text-accent' : 'text-destructive'}`}>
                          {difference >= 0 ? '+' : ''} R$ {difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={closeData.notes}
                      onChange={(e) => setCloseData({ ...closeData, notes: e.target.value })}
                      placeholder="Registre aqui quebras, diferenças ou observações..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setCloseDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="destructive">Fechar Caixa</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeRegister && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Caixa Aberto - {activeRegister.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Aberto em</p>
                <p className="text-lg font-semibold">
                  {format(new Date(activeRegister.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                <p className="text-lg font-semibold">R$ {activeRegister.opening_balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-lg font-semibold text-accent">R$ {activeRegister.current_cash_amount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Caixas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {registers.map((register) => (
              <div key={register.id} className={`p-4 rounded-lg border ${register.status === 'open' ? 'border-accent bg-accent/5' : 'border-border'}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{register.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Aberto: {format(new Date(register.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    {register.closed_at && (
                      <p className="text-sm text-muted-foreground">
                        Fechado: {format(new Date(register.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {register.notes && (
                      <p className="text-sm italic mt-2">{register.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">Inicial: R$ {register.opening_balance.toFixed(2)}</div>
                    {register.closing_balance !== null && (
                      <>
                        <div className="text-sm text-muted-foreground">Final: R$ {register.closing_balance.toFixed(2)}</div>
                        <div className={`text-sm font-semibold ${
                          register.closing_balance - register.current_cash_amount === 0 
                            ? 'text-accent' 
                            : register.closing_balance - register.current_cash_amount > 0 
                            ? 'text-accent' 
                            : 'text-destructive'
                        }`}>
                          Diferença: {register.closing_balance - register.current_cash_amount >= 0 ? '+' : ''}
                          R$ {(register.closing_balance - register.current_cash_amount).toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}