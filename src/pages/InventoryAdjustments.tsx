import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function InventoryAdjustments() {
  // Estados para o formulário e a tabela
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity_change: "",
    reason: "",
  });

  useEffect(() => {
    loadAdjustments();
    loadProducts();
  }, []);

  const loadAdjustments = async () => {
    const { data } = await supabase
      .from('inventory_adjustments')
      .select('*, product:products(name), variation:product_variations(sku), user:profiles(full_name)')
      .order('created_at', { ascending: false });
    setAdjustments(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, product_variations(id, sku)');
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const [type, id] = formData.product_id.split(':');
    const payload = {
      product_id: type === 'product' ? id : null,
      product_variation_id: type === 'variation' ? id : null,
      quantity_change: parseInt(formData.quantity_change),
      reason: formData.reason,
    };

    if (!payload.reason || !payload.quantity_change || (!payload.product_id && !payload.product_variation_id)) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('create-inventory-adjustment', {
        body: payload,
      });

      if (error) throw error;

      toast.success("Ajuste de estoque salvo com sucesso!");
      setOpen(false);
      setFormData({ product_id: "", quantity_change: "", reason: "" });
      loadAdjustments();
    } catch (error) {
      toast.error(`Erro ao salvar ajuste: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ajustes de Estoque</h2>
          <p className="text-muted-foreground">Crie e visualize ajustes manuais no estoque</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ajuste
        </Button>
      </div>

      {/* Formulário de Novo Ajuste (em um Dialog) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ajuste de Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto / Variação</Label>
              <Select onValueChange={(v) => setFormData({...formData, product_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <>
                      <SelectItem key={p.id} value={`product:${p.id}`}>{p.name}</SelectItem>
                      {p.product_variations.map(pv => <SelectItem key={pv.id} value={`variation:${pv.id}`}>&nbsp;&nbsp;&nbsp;{pv.sku}</SelectItem>)}
                    </>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alteração na Quantidade</Label>
              <Input type="number" placeholder="Ex: -10 ou 20" value={formData.quantity_change} onChange={e => setFormData({...formData, quantity_change: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select onValueChange={v => setFormData({...formData, reason: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contagem_inicial">Contagem Inicial</SelectItem>
                  <SelectItem value="entrada_manual">Entrada Manual</SelectItem>
                  <SelectItem value="saida_manual">Saída Manual</SelectItem>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="furto">Furto</SelectItem>
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Ajuste</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ajustes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map(adj => (
                <TableRow key={adj.id}>
                  <TableCell>{adj.product?.name || adj.variation?.sku}</TableCell>
                  <TableCell>{adj.quantity_change}</TableCell>
                  <TableCell>{adj.reason}</TableCell>
                  <TableCell>{adj.user?.full_name}</TableCell>
                  <TableCell>{new Date(adj.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
