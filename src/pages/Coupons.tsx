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
import { Plus, Ticket } from "lucide-react";

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    max_uses: "",
    start_date: "",
    end_date: "",
    active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    setCoupons(data || []);
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        });

      if (error) throw error;

      toast.success("Cupom criado!");
      setOpen(false);
      loadCoupons();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cupons de Desconto</h2>
          <p className="text-muted-foreground">Gerencie cupons promocionais</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cupom</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input 
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                placeholder="EX: DESCONTO10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
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
                <Label>Valor</Label>
                <Input 
                  type="number" 
                  value={formData.discount_value} 
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Compra Mínima (R$)</Label>
              <Input 
                type="number" 
                value={formData.min_purchase_amount} 
                onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. Usos (opcional)</Label>
              <Input 
                type="number" 
                value={formData.max_uses} 
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.end_date} 
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
              <Label>Ativo</Label>
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
          <CardTitle>Cupons Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(coupon => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {coupon.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {coupon.uses_count} / {coupon.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    {new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{coupon.active ? "Ativo" : "Inativo"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}