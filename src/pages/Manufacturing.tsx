import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Play, CheckCircle, XCircle } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

interface ProductionOrder {
  id: string;
  order_number: string;
  quantity_to_produce: number;
  status: string;
  created_at: string;
  products: { name: string } | null;
}

export default function Manufacturing() {
  const { currentStore } = useStore();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "1",
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('production_orders')
      .select('*, products(name)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true);
    setProducts(data || []);
  };

  const handleCreate = async () => {
    try {
      // Validation
      if (!formData.product_id || !formData.product_id.trim()) {
        toast.error('Selecione um produto válido');
        return;
      }

      const quantity = parseInt(formData.quantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Quantidade deve ser um número positivo');
        return;
      }

      if (quantity > 10000) {
        toast.error('Quantidade muito alta (máximo 10.000)');
        return;
      }

      // Verify product exists and has BOM
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', formData.product_id)
        .maybeSingle();

      if (productError || !product) {
        toast.error('Produto não encontrado');
        return;
      }

      // Check if product has BOM defined
      const { data: bomItems } = await supabase
        .from('product_bom')
        .select('id')
        .eq('finished_product_id', formData.product_id)
        .limit(1);

      if (!bomItems || bomItems.length === 0) {
        toast.error('Produto não possui lista de materiais (BOM) definida');
        return;
      }

      const orderNumber = `MFG-${Date.now()}`;
      const { error } = await supabase
        .from('production_orders')
        .insert({
          order_number: orderNumber,
          product_to_produce_id: formData.product_id,
          quantity_to_produce: quantity,
          status: 'pending',
        });

      if (error) throw error;

      toast.success("Ordem de produção criada!");
      setOpen(false);
      setFormData({ product_id: "", quantity: "1" });
      loadOrders();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleStart = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('start-production-order', {
        body: { p_order_id: orderId }
      });

      if (error) throw error;

      toast.success("Ordem iniciada!");
      loadOrders();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleComplete = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('complete-production-order', {
        body: { p_order_id: orderId }
      });

      if (error) throw error;

      toast.success("Ordem completada!");
      loadOrders();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Deseja realmente cancelar esta ordem?")) return;

    try {
      const { error } = await supabase.functions.invoke('cancel-production-order', {
        body: { p_order_id: orderId }
      });

      if (error) throw error;

      toast.success("Ordem cancelada!");
      loadOrders();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ordens de Produção</h2>
          <p className="text-muted-foreground">Gerencie a manufatura de produtos</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Ordens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.products?.name}</TableCell>
                  <TableCell>{order.quantity_to_produce}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => handleStart(order.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <Button size="sm" onClick={() => handleComplete(order.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'in_progress') && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(order.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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