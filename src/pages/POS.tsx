import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Search, ShoppingCart, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saleSchema } from "@/lib/validation";
import { z } from "zod";
import { FiscalApiService } from "@/lib/fiscalApiService";

interface Product {
  id: string;
  name: string;
  sale_price: number;
  stock_quantity: number;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

interface SaleResult {
  sale_id: string;
  fiscal_status: 'authorized' | 'error' | 'pending';
  danfe_url?: string;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [discount, setDiscount] = useState(0);
  const [customerCpf, setCustomerCpf] = useState("");
  const [emittingFiscal, setEmittingFiscal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .gt('stock_quantity', 0);
    setProducts(data || []);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error("Estoque insuficiente");
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.sale_price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          subtotal: product.sale_price,
        },
      ]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock_quantity) {
      toast.error("Estoque insuficiente");
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.sale_price,
            }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateFinal = () => {
    return calculateTotal() - discount;
  };

  const finalizeSale = async () => {
    try {
      setEmittingFiscal(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        setEmittingFiscal(false);
        return;
      }

    setIsFinalizing(true);

    try {
      const salePayload = {
        customer_id: customer_id,
        payment_method: paymentMethod,
        cart_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          subtotal: item.subtotal,
        })),
        cpf: cpf || null,
      };

      const validated = saleSchema.parse(saleData);

      const saleNumber = `VENDA-${Date.now()}`;

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: saleNumber,
          total_amount: validated.total_amount,
          discount: validated.discount,
          final_amount: validated.final_amount,
          payment_method: validated.payment_method,
          cashier_id: user.id,
          fiscal_status: 'none',
        })
        .select()
        .single();

      if (saleError) {
        toast.error("Erro ao criar venda");
        setEmittingFiscal(false);
        return;
      }

      const saleItems = validated.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) {
        toast.error("Erro ao registrar itens");
        setEmittingFiscal(false);
        return;
      }

      setSaleResult(data);

      if (data.fiscal_status === 'authorized') {
        toast.success("Venda finalizada e cupom fiscal emitido!");
      } else {
        toast.warning("Venda salva, mas falha ao emitir cupom fiscal.");
      }

      // Tentar emitir NFC-e
      try {
        toast.info("Emitindo cupom fiscal...");
        const fiscalResult = await FiscalApiService.emitNFCe(
          {
            sale_id: sale.id,
            items: cart.map(item => ({
              product_id: item.id,
              product_name: item.name,
              quantity: item.quantity,
              unit_price: item.sale_price,
              subtotal: item.subtotal,
            })),
            total_amount: validated.total_amount,
            discount: validated.discount,
            final_amount: validated.final_amount,
            payment_method: validated.payment_method,
          },
          customerCpf
        );

        if (fiscalResult.success) {
          await supabase
            .from('sales')
            .update({ 
              fiscal_status: 'authorized',
              fiscal_document_id: fiscalResult.fiscal_document_id 
            })
            .eq('id', sale.id);
          toast.success("Venda finalizada e cupom emitido!");
        } else {
          await supabase
            .from('sales')
            .update({ fiscal_status: 'error' })
            .eq('id', sale.id);
          toast.warning("Venda salva, mas erro ao emitir cupom fiscal");
        }
      } catch (fiscalError) {
        await supabase
          .from('sales')
          .update({ fiscal_status: 'pending' })
          .eq('id', sale.id);
        toast.warning("Venda salva, cupom fiscal em contingência");
      }

      setCart([]);
      setDiscount(0);
      setCustomerCpf("");
      setEmittingFiscal(false);
      loadProducts();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        setEmittingFiscal(false);
        return;
      }
      toast.error("Erro ao processar venda");
      setEmittingFiscal(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={!!saleResult} onOpenChange={() => setSaleResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da Venda</DialogTitle>
          </DialogHeader>
          {saleResult?.fiscal_status === 'authorized' ? (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-green-600">Cupom Fiscal Emitido com Sucesso!</h3>
              <div className="flex justify-center">
                <QrCode className="h-32 w-32" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aponte a câmera para o QR Code para consultar a NFC-e.
              </p>
              <Button asChild>
                <a href={saleResult.danfe_url} target="_blank" rel="noopener noreferrer">
                  Visualizar DANFE
                </a>
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Falha na Emissão do Cupom Fiscal</h3>
              <p className="text-sm text-muted-foreground">
                A venda foi salva no sistema, mas ocorreu um erro ao se comunicar com a SEFAZ.
                Você poderá tentar emitir o cupom novamente no histórico de vendas.
              </p>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setSaleResult(null)}>Nova Venda</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-auto flex-col items-start p-4"
                  onClick={() => addToCart(product)}
                >
                  <div className="font-semibold text-sm">{product.name}</div>
                  <div className="text-primary font-bold">R$ {product.sale_price.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Estoque: {product.stock_quantity}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {item.sale_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 h-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Desconto (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pagamento</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF na Nota (opcional)</label>
                    <Input
                      placeholder="000.000.000-00"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Desconto:</span>
                      <span className="text-destructive">- R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary">R$ {calculateFinal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={finalizeSale} disabled={emittingFiscal}>
                    {emittingFiscal ? "Processando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
