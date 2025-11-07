import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, DollarSign } from "lucide-react";

export default function PriceLists() {
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadPriceLists();
  }, []);

  const loadPriceLists = async () => {
    const { data } = await supabase
      .from('price_lists')
      .select('*')
      .order('created_at', { ascending: false });
    setPriceLists(data || []);
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('price_lists')
        .insert(formData);

      if (error) throw error;

      toast.success("Lista de preços criada!");
      setOpen(false);
      loadPriceLists();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}