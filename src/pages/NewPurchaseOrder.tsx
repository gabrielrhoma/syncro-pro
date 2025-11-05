import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Minus, Plus, Search, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  cost_price: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function NewPurchaseOrder() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    expected_delivery: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('active', true)
      .order('name');
    setSuppliers(data || []);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, cost_price')
      .eq('active', true)
      .order('name');
    setProducts(data || []);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        unit_price: product.cost_price,
        subtotal: product.cost_price,
      };
      setCart([...cart, newItem]);
    }
    setSearchTerm("");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity, subtotal: item.unit_price * quantity }
        : item
    ));
  };

  const updateUnitPrice = (productId: string, price: number) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, unit_price: price, subtotal: price * item.quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const savePurchaseOrder = async (status: 'draft' | 'sent') => {
    if (!formData.supplier_id) {
      toast.error("Selecione um fornecedor");
      return;
    }

    if (cart.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const orderNumber = `PC-${Date.now()}`;
    const totalAmount = calculateTotal();

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderNumber,
        supplier_id: formData.supplier_id,
        expected_delivery: formData.expected_delivery || null,
        notes: formData.notes,
        total_amount: totalAmount,
        status,
        created_by: user?.id,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Erro ao criar ordem de compra");
      return;
    }

    const items = cart.map(item => ({
      purchase_order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items);

    if (itemsError) {
      toast.error("Erro ao adicionar itens");
      return;
    }

    toast.success(status === 'draft' ? "Rascunho salvo!" : "Pedido enviado!");
    navigate('/purchases');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nova Ordem de Compra</h2>
          <p className="text-muted-foreground">Crie um novo pedido para fornecedor</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/purchases')}>
          Cancelar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fornecedor *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
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
              <Label htmlFor="expected_delivery">Entrega Prevista</Label>
              <Input
                id="expected_delivery"
                type="date"
                value={formData.expected_delivery}
                onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione observações sobre o pedido..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {searchTerm && (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku && `SKU: ${product.sku} • `}
                        Custo: R$ {product.cost_price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido ({cart.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto adicionado. Use a busca acima para adicionar produtos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {item.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 flex justify-between items-center">
            <div className="text-2xl font-bold">
              Total: <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => savePurchaseOrder('draft')}>
                Salvar Rascunho
              </Button>
              <Button onClick={() => savePurchaseOrder('sent')}>
                Enviar Pedido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}