import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Sale {
  id: string;
  sale_number: string;
  final_amount: number;
  payment_method: string;
  created_at: string;
  fiscal_status: 'none' | 'pending' | 'authorized' | 'error' | 'cancelled';
  customers: { name: string } | null;
  fiscal_documents: { danfe_url: string | null } | null;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null);
  const [itemsToReturn, setItemsToReturn] = useState<any[]>([]);
  const [refundMethod, setRefundMethod] = useState('store_credit');
  const [isReturning, setIsReturning] = useState(false);
  const [saleItemsForReturn, setSaleItemsForReturn] = useState<any[]>([]);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    if (saleToReturn) {
      loadSaleItems(saleToReturn.id);
    }
  }, [saleToReturn]);

  const loadSaleItems = async (saleId: string) => {
    const { data } = await supabase
      .from('sale_items')
      .select('*, product:products(name)')
      .eq('sale_id', saleId);
    setSaleItemsForReturn(data || []);
  };

  const handleItemReturnQuantityChange = (productId: string, quantity: number) => {
    setItemsToReturn(prev => {
      const existing = prev.find(i => i.product_id === productId);
      if (quantity > 0) {
        if (existing) {
          return prev.map(i => i.product_id === productId ? { ...i, quantity } : i);
        } else {
          return [...prev, { product_id: productId, quantity }];
        }
      } else {
        return prev.filter(i => i.product_id !== productId);
      }
    });
  };

  const loadSales = async () => {
    const { data } = await supabase
      .from('sales')
      .select('*, customers(name), fiscal_documents(danfe_url)')
      .order('created_at', { ascending: false });

    if (data) {
      setSales(data as Sale[]);
    }
  };

  const handleCancelNFCe = async () => {
    if (!saleToCancel || !cancelReason.trim()) {
      toast.error("A justificativa é obrigatória.");
      return;
    }

    setIsCancelling(true);
    try {
      const { error } = await supabase.functions.invoke('cancel-nfce', {
        body: { sale_id: saleToCancel.id, reason: cancelReason },
      });

      if (error) throw new Error(error.message);

      toast.success("NFC-e cancelada com sucesso!");
      loadSales();
      setSaleToCancel(null);
      setCancelReason("");
    } catch (error: any) {
      toast.error(`Erro ao cancelar NFC-e: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleProcessReturn = async () => {
    if (itemsToReturn.length === 0) {
      toast.error("Selecione pelo menos um item para devolver.");
      return;
    }

    setIsReturning(true);
    try {
      const { error } = await supabase.functions.invoke('process-return', {
        body: {
          sale_id: saleToReturn.id,
          items_to_return: itemsToReturn,
          refund_method: refundMethod,
        },
      });

      if (error) throw new Error(error.message);

      toast.success("Devolução processada com sucesso!");
      setSaleToReturn(null);
      setItemsToReturn([]);
    } catch (error: any) {
      toast.error(`Erro ao processar devolução: ${error.message}`);
    } finally {
      setIsReturning(false);
    }
  };

  const paymentMethodLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
    pix: "PIX",
  };

  const fiscalStatusLabels: Record<string, string> = {
    none: "N/A",
    pending: "Pendente",
    authorized: "Autorizada",
    error: "Erro",
    cancelled: "Cancelada",
  };

  const fiscalStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    none: "secondary",
    pending: "default",
    authorized: "outline",
    error: "destructive",
    cancelled: "secondary",
  };

  return (
    <div className="space-y-6">
      {/* Modal de Devolução */}
      <Dialog open={!!saleToReturn} onOpenChange={() => setSaleToReturn(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Processar Devolução da Venda {saleToReturn?.sale_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Itens para devolver:</Label>
              {saleItemsForReturn.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{item.product.name} (Qtd: {item.quantity})</span>
                  <Input
                    type="number"
                    className="w-24"
                    max={item.quantity}
                    min={0}
                    onChange={(e) => handleItemReturnQuantityChange(item.product_id, parseInt(e.target.value))}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Método de Reembolso</Label>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store_credit">Crédito em Loja</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleToReturn(null)}>Cancelar</Button>
            <Button onClick={handleProcessReturn} disabled={isReturning}>
              {isReturning ? "Processando..." : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!saleToCancel} onOpenChange={() => setSaleToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFC-e</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Digite o motivo do cancelamento para a venda
              <strong> {saleToCancel?.sale_number}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Justificativa (mínimo 15 caracteres)</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleToCancel(null)}>Voltar</Button>
            <Button onClick={handleCancelNFCe} disabled={isCancelling}>
              {isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vendas</h2>
        <p className="text-muted-foreground">Histórico de vendas realizadas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status Fiscal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.sale_number}</TableCell>
                  <TableCell>{sale.customers?.name || "Cliente Avulso"}</TableCell>
                  <TableCell className="font-semibold text-accent">
                    R$ {Number(sale.final_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fiscalStatusVariants[sale.fiscal_status]}>
                      {fiscalStatusLabels[sale.fiscal_status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sale.fiscal_documents?.danfe_url && (
                          <DropdownMenuItem asChild>
                            <a href={sale.fiscal_documents.danfe_url} target="_blank" rel="noopener noreferrer">
                              Ver DANFE
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setSaleToCancel(sale)}
                          disabled={sale.fiscal_status !== 'authorized'}
                        >
                          Cancelar NFC-e
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSaleToReturn(sale)}>
                          Processar Devolução
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
