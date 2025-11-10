import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Search, ShoppingCart, QrCode, Gift, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saleSchema } from "@/lib/validation";
import { z } from "zod";
import { useStore } from "@/contexts/StoreContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const { currentStore } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [discount, setDiscount] = useState(0);
  const [cpf, setCpf] = useState("");
  const [customer_id, setCustomerId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!currentStore) return;
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('store_id', currentStore.id)
      .gt('stock_quantity', 0);
    setProducts(data || []);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !coupon) {
      toast.error("Cupom inválido ou expirado");
      return;
    }

    const now = new Date();
    if (new Date(coupon.start_date) > now || new Date(coupon.end_date) < now) {
      toast.error("Cupom fora do período de validade");
      return;
    }

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      toast.error("Cupom esgotado");
      return;
    }

    if (calculateTotal() < coupon.min_purchase_amount) {
      toast.error(`Compra mínima de R$ ${coupon.min_purchase_amount.toFixed(2)} necessária`);
      return;
    }

    setAppliedCoupon(coupon);
    setRedeemedPoints(0);
    
    let discountValue = 0;
    if (coupon.discount_type === 'percentage') {
      discountValue = calculateTotal() * (coupon.discount_value / 100);
    } else {
      discountValue = coupon.discount_value;
    }
    
    setDiscount(discountValue);
    toast.success("Cupom aplicado!");
  };

  const loadLoyaltyPoints = async (customerId: string) => {
    const { data } = await supabase
      .from('customer_loyalty')
      .select('points_balance')
      .eq('customer_id', customerId)
      .single();

    setLoyaltyPoints(data?.points_balance || 0);
  };

  const redeemLoyalty = async () => {
    if (!customer_id) {
      toast.error("Selecione um cliente");
      return;
    }

    if (redeemedPoints <= 0) {
      toast.error("Informe quantos pontos resgatar");
      return;
    }

    if (redeemedPoints > loyaltyPoints) {
      toast.error("Pontos insuficientes");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('redeem-loyalty-points', {
        body: {
          p_customer_id: customer_id,
          p_points_to_redeem: redeemedPoints
        }
      });

      if (error) throw error;

      setDiscount(data.discount_amount);
      setAppliedCoupon(null);
      setCouponCode("");
      setShowLoyaltyDialog(false);
      toast.success(`${redeemedPoints} pontos resgatados! Desconto: R$ ${data.discount_amount.toFixed(2)}`);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  useEffect(() => {
    if (customer_id) {
      loadLoyaltyPoints(customer_id);
    }
  }, [customer_id]);

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
    if (cart.length === 0) {
      toast.error("O carrinho está vazio.");
      return;
    }

    if (paymentMethod === 'a_prazo' && !customer_id) {
      toast.error("Selecione um cliente para vendas a prazo.");
      return;
    }

    setIsFinalizing(true);

    try {
      const salePayload = {
        p_store_id: currentStore?.id,
        customer_id: customer_id,
        payment_method: paymentMethod,
        cart_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          subtotal: item.subtotal,
        })),
        cpf: cpf || null,
        p_coupon_code: appliedCoupon?.code || null,
      };

      const { data, error } = await supabase.functions.invoke('create-sale', {
        body: salePayload,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSaleResult(data);

      if (data.fiscal_status === 'authorized') {
        toast.success("Venda finalizada e cupom fiscal emitido!");
      } else {
        toast.warning("Venda salva, mas falha ao emitir cupom fiscal.");
      }

      // Reset state
      setCart([]);
      setDiscount(0);
      setCpf("");
      setCustomerId(null);
      setCouponCode("");
      setAppliedCoupon(null);
      setRedeemedPoints(0);
      loadProducts();

    } catch (error: any) {
      toast.error(`Erro ao finalizar venda: ${error.message}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={showLoyaltyDialog} onOpenChange={setShowLoyaltyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Pontos de Fidelidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Saldo disponível: <strong>{loyaltyPoints} pontos</strong>
            </p>
            <div className="space-y-2">
              <Label>Quantos pontos resgatar?</Label>
              <Input
                type="number"
                min="0"
                max={loyaltyPoints}
                value={redeemedPoints}
                onChange={(e) => setRedeemedPoints(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLoyaltyDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={redeemLoyalty}>Resgatar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Cupom de Desconto
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon || redeemedPoints > 0}
                      />
                      <Button
                        size="sm"
                        onClick={applyCoupon}
                        disabled={!!appliedCoupon || redeemedPoints > 0}
                      >
                        Aplicar
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-600">
                        Cupom {appliedCoupon.code} aplicado!
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowLoyaltyDialog(true)}
                      disabled={!customer_id || !!appliedCoupon}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Resgatar Pontos de Fidelidade
                    </Button>
                    {redeemedPoints > 0 && (
                      <p className="text-xs text-green-600">
                        {redeemedPoints} pontos resgatados!
                      </p>
                    )}
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
                        <SelectItem value="a_prazo">A Prazo (Fiado)</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF na Nota</label>
                    <Input
                      placeholder="CPF do cliente (opcional)"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={finalizeSale} disabled={isFinalizing}>
                    {isFinalizing ? "Finalizando..." : "Finalizar Venda"}
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
