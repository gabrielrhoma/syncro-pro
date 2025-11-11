import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  order_date: string;
  expected_delivery: string | null;
  suppliers: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  cost_price: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function Purchases() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [isReceiving, setIsReceiving] = useState(false);
  const [confirmReceiveOrder, setConfirmReceiveOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadSuppliers();
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('order_date', { ascending: false });
    
    if (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, cost_price')
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    setSuppliers(data || []);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: productId,
        product_name: product.name,
        quantity: 1,
        unit_price: Number(product.cost_price),
        subtotal: Number(product.cost_price),
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
      return;
    }
    
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const finalizePurchase = async () => {
    if (cart.length === 0 || !selectedSupplier) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const orderNumber = `PC-${Date.now()}`;
    const total = calculateTotal();

    const { data: orderData, error: orderError } = await supabase
      .from('purchase_orders')
      .insert([{
        order_number: orderNumber,
        supplier_id: selectedSupplier,
        total_amount: total,
        expected_delivery: expectedDelivery || null,
        status: 'pending',
      }])
      .select()
      .maybeSingle();

    if (orderError || !orderData) {
      toast({ title: "Erro ao criar ordem de compra", variant: "destructive" });
      return;
    }

    const items = cart.map(item => ({
      purchase_order_id: orderData.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items);

    if (itemsError) {
      toast({ title: "Erro ao criar itens da ordem", variant: "destructive" });
      return;
    }

    // Criar conta a pagar
    await supabase.from('accounts_payable').insert([{
      description: `Ordem de Compra ${orderNumber}`,
      supplier_id: selectedSupplier,
      purchase_order_id: orderData.id,
      amount: total,
      due_date: expectedDelivery || new Date().toISOString().split('T')[0],
      status: 'pending',
      category: 'Compras',
    }]);

    toast({ title: "Ordem de compra criada com sucesso!" });
    setCart([]);
    setSelectedSupplier("");
    setExpectedDelivery("");
    setDialogOpen(false);
    loadOrders();
  };

  const handleReceiveOrder = async () => {
    if (!confirmReceiveOrder) return;
    setIsReceiving(true);

    try {
      const { error } = await supabase.functions.invoke(
        `receive-purchase-order/${confirmReceiveOrder.id}`,
        { method: 'POST' }
      );

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Sucesso!",
        description: "Estoque atualizado e conta a pagar gerada!",
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Erro ao receber mercadoria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsReceiving(false);
      setConfirmReceiveOrder(null);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    received: "Recebida",
    cancelled: "Cancelada",
  };

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "secondary",
    approved: "default",
    received: "outline",
    cancelled: "destructive",
  };

  return (
    <div className="space-y-6">
      <Dialog open={!!confirmReceiveOrder} onOpenChange={() => setConfirmReceiveOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div>
            <p>
              Você confirma o recebimento da ordem de compra
              <strong className="mx-1">{confirmReceiveOrder?.order_number}</strong>?
              Esta ação atualizará o estoque e gerará a conta a pagar correspondente.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmReceiveOrder(null)}
              disabled={isReceiving}
            >
              Cancelar
            </Button>
            <Button onClick={handleReceiveOrder} disabled={isReceiving}>
              {isReceiving ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compras</h2>
          <p className="text-muted-foreground">Gerencie ordens de compra</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem de Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Ordem de Compra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
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
                <div className="space-y-2">
                  <Label>Data Prevista de Entrega</Label>
                  <Input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adicionar Produto</Label>
                <Select onValueChange={addToCart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {Number(product.cost_price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Itens da Ordem</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Un.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">R$ {item.subtotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-right">
                    <p className="text-2xl font-bold">
                      Total: R$ {calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={finalizePurchase}>
                  Finalizar Ordem
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Ordens de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Previsão Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.suppliers?.name || "-"}</TableCell>
                  <TableCell className="font-semibold text-accent">
                    R$ {Number(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.order_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {order.expected_delivery 
                      ? format(new Date(order.expected_delivery), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmReceiveOrder(order)}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Receber Mercadoria
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