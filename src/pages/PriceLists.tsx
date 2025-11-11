import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, DollarSign, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

export default function PriceLists() {
  const { currentStore } = useStore();
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [priceItemsDialogOpen, setPriceItemsDialogOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<any>(null);
  const [priceItems, setPriceItems] = useState<any[]>([]);
  const [newPriceItem, setNewPriceItem] = useState({
    product_id: "",
    price: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (currentStore) {
      loadPriceLists();
      loadProducts();
    }
  }, [currentStore]);

  const loadPriceLists = async () => {
    if (!currentStore) return;
    
    const { data } = await supabase
      .from('price_lists')
      .select('*')
      .order('created_at', { ascending: false });
    
    setPriceLists(data || []);
  };

  const loadProducts = async () => {
    if (!currentStore) return;

    const { data, error } = await supabase
      .from('products')
      .select('id, name, sale_price')
      .eq('store_id', currentStore.id)
      .eq('active', true)
      .order('name');
    
    if (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  };

  const loadPriceItems = async (priceListId: string) => {
    const { data, error } = await supabase
      .from('price_list_items' as any)
      .select('*, products(name)')
      .eq('price_list_id', priceListId);
    
    if (error) {
      console.error('Error loading price items:', error);
      setPriceItems([]);
    } else {
      setPriceItems((data || []) as any);
    }
  };

  const handleSubmit = async () => {
    if (!currentStore) return;
    
    try {
      const { error } = await supabase
        .from('price_lists')
        .insert({
          ...formData,
          store_id: currentStore.id,
        });

      if (error) throw error;

      toast.success("Lista de preços criada!");
      setOpen(false);
      setFormData({ name: "", description: "" });
      loadPriceLists();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleAddPriceItem = async () => {
    if (!selectedPriceList || !newPriceItem.product_id || !newPriceItem.price) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { error } = await supabase
        .from('price_list_items' as any)
        .insert({
          price_list_id: selectedPriceList.id,
          product_id: newPriceItem.product_id,
          price: parseFloat(newPriceItem.price),
        });

      if (error) throw error;

      toast.success("Preço adicionado!");
      setNewPriceItem({ product_id: "", price: "" });
      loadPriceItems(selectedPriceList.id);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleDeletePriceItem = async (itemId: string) => {
    if (!confirm("Deseja remover este item?")) return;

    try {
      const { error } = await supabase
        .from('price_list_items' as any)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success("Item removido!");
      loadPriceItems(selectedPriceList.id);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const openPriceItemsDialog = (priceList: any) => {
    setSelectedPriceList(priceList);
    loadPriceItems(priceList.id);
    setPriceItemsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Listas de Preços</h2>
          <p className="text-muted-foreground">Gerencie tabelas de preços personalizadas</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Lista
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Lista de Preços</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Atacado"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={priceItemsDialogOpen} onOpenChange={setPriceItemsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preços - {selectedPriceList?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Select value={newPriceItem.product_id} onValueChange={(value) => setNewPriceItem({ ...newPriceItem, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={newPriceItem.price}
                onChange={(e) => setNewPriceItem({ ...newPriceItem, price: e.target.value })}
              />
              <Button onClick={handleAddPriceItem}>Adicionar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.products?.name}</TableCell>
                    <TableCell>R$ {Number(item.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePriceItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Listas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map(list => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {list.name}
                    </div>
                  </TableCell>
                  <TableCell>{list.description}</TableCell>
                  <TableCell>{new Date(list.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{list.active ? "Ativa" : "Inativa"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openPriceItemsDialog(list)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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