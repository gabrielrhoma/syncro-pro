import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function Promotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "discount",
    discount_type: "percentage",
    discount_value: "",
    product_id: "",
    start_date: "",
    end_date: "",
    active: true,
  });

  useEffect(() => {
    loadPromotions();
    loadProducts();
  }, []);

  const loadPromotions = async () => {
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });
    setPromotions(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name');
    setProducts(data || []);
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
        });

      if (error) throw error;

      toast.success("Promoção criada!");
      setOpen(false);
      loadPromotions();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promoções</h2>
          <p className="text-muted-foreground">Gerencie promoções e descontos</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Promoção
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Promoção</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Desconto</SelectItem>
                  <SelectItem value="bogo">Compre X Leve Y</SelectItem>
                  <SelectItem value="bundle">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem</SelectItem>
                  <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Desconto</Label>
              <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Promoções Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map(promo => (
                <TableRow key={promo.id}>
                  <TableCell>{promo.name}</TableCell>
                  <TableCell>{promo.type}</TableCell>
                  <TableCell>
                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `R$ ${promo.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{promo.active ? "Ativa" : "Inativa"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}