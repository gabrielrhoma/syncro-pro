import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { productSchema } from "@/lib/validation";
import { z } from "zod";
import { useStore } from "@/contexts/StoreContext";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_quantity: number;
  active: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductTaxInfo {
  id?: string;
  product_id: string;
  ncm: string;
  cfop: string;
  cest: string;
  icms_origin: string;
  icms_tax_situation: string;
  pis_tax_situation: string;
  cofins_tax_situation: string;
}

interface Attribute {
  id: string;
  name: string;
}

interface AttributeValue {
  id: string;
  value: string;
  attribute_id: string;
}

interface Variation {
  id?: string;
  sku: string;
  stock_quantity: number;
  sale_price: number;
  cost_price: number;
  values: { attribute: string, value: string }[];
}


export default function Products() {
  const { currentStore } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, string[]>>({});
  const [variations, setVariations] = useState<Variation[]>([]);
  const [kitComponents, setKitComponents] = useState<{ product_id: string; quantity: number }[]>([]);
  const [bomComponents, setBomComponents] = useState<{ product_id: string; quantity: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    sale_price: "",
    cost_price: "",
    stock_quantity: "",
    min_stock: "",
    category_id: "",
  });
  const [taxInfoFormData, setTaxInfoFormData] = useState({
    ncm: "",
    cfop: "5102",
    cest: "",
    icms_origin: "",
    icms_tax_situation: "",
    pis_tax_situation: "",
    cofins_tax_situation: "",
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    if (!currentStore) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
    } else {
      setProducts(data || []);
    }
  };

  const handleAttributeSelect = (attributeName: string) => {
    if (!productAttributes[attributeName]) {
      setProductAttributes(prev => ({ ...prev, [attributeName]: [] }));
    }
  };

  const handleAttributeValueChange = (attributeName: string, value: string) => {
    const values = value.split(',').map(v => v.trim());
    setProductAttributes(prev => ({ ...prev, [attributeName]: values }));
  };

  const generateVariations = () => {
    const attributes = Object.keys(productAttributes);
    if (attributes.length === 0) {
      setVariations([]);
      return;
    }

    const valueArrays = attributes.map(attr => productAttributes[attr]);

    // Simple cartesian product function
    const cartesian = (...a: string[][]) => a.reduce((acc, b) => acc.flatMap((d: string | string[]) => b.map(e => [...(Array.isArray(d) ? d : [d]), e])), [[]] as string[][]);

    const combinations = cartesian(...valueArrays);

    const newVariations = combinations.map(combo => {
      const values = (Array.isArray(combo) ? combo : [combo]).map((value, i) => ({
        attribute: attributes[i],
        value,
      }));

      return {
        sku: `${formData.sku || 'SKU'}-${values.map(v => v.value.substring(0, 3)).join('-')}`,
        stock_quantity: 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        values,
      };
    });

    setVariations(newVariations);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = productSchema.parse({
        name: formData.name,
        sku: formData.sku || "",
        sale_price: parseFloat(formData.sale_price) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : undefined,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : undefined,
        description: "",
        barcode: "",
        ncm: "",
        cfop: "",
        cst_icms: "",
        icms_rate: undefined,
        pis_rate: undefined,
        cofins_rate: undefined,
        ipi_rate: undefined,
      });

      const productData = {
        name: validatedData.name,
        sku: validatedData.sku || null,
        sale_price: validatedData.sale_price,
        cost_price: validatedData.cost_price || 0,
        stock_quantity: validatedData.stock_quantity || 0,
        min_stock: validatedData.min_stock || 0,
        category_id: formData.category_id || null,
        store_id: currentStore?.id,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw new Error("Erro ao atualizar produto");
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (error || !data) throw new Error("Erro ao criar produto");
        productId = data.id;
      }

      if (productId) {
        const { error: taxError } = await supabase
          .from('product_tax_info')
          .upsert({ product_id: productId, ...taxInfoFormData });

        if (taxError) throw new Error("Erro ao salvar informações fiscais");

        // Salvar Kit components
        if (kitComponents.length > 0) {
          await supabase.from('kit_items').delete().eq('kit_product_id', productId);
          await supabase.from('kit_items').insert(
            kitComponents.map(c => ({ kit_product_id: productId, component_product_id: c.product_id, quantity: c.quantity }))
          );
        }

        // Salvar BOM components
        if (bomComponents.length > 0) {
          await supabase.from('product_bom').delete().eq('finished_product_id', productId);
          await supabase.from('product_bom').insert(
            bomComponents.map(c => ({ finished_product_id: productId, raw_material_product_id: c.product_id, quantity_needed: c.quantity }))
          );
        }
      }
      
      toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
      setOpen(false);
      loadProducts();
      resetForm();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
      toast.error("Erro ao processar produto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído!");
      loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      sale_price: "",
      cost_price: "",
      stock_quantity: "",
      min_stock: "",
      category_id: "",
    });
    setTaxInfoFormData({
      ncm: "",
      cfop: "5102",
      cest: "",
      icms_origin: "",
      icms_tax_situation: "",
      pis_tax_situation: "",
      cofins_tax_situation: "",
    });
    setKitComponents([]);
    setBomComponents([]);
    setEditingProduct(null);
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      sale_price: product.sale_price.toString(),
      cost_price: "", // These are not loaded for simplicity
      stock_quantity: product.stock_quantity.toString(),
      min_stock: "", // These are not loaded for simplicity
      category_id: product.category_id || "",
    });

    const { data: taxInfo } = await supabase
      .from('product_tax_info')
      .select('*')
      .eq('product_id', product.id)
      .single();

    if (taxInfo) {
      setTaxInfoFormData({
        ncm: taxInfo.ncm || "",
        cfop: taxInfo.cfop || "5102",
        cest: taxInfo.cest || "",
        icms_origin: taxInfo.icms_origin || "",
        icms_tax_situation: taxInfo.icms_tax_situation || "",
        pis_tax_situation: taxInfo.pis_tax_situation || "",
        cofins_tax_situation: taxInfo.cofins_tax_situation || "",
      });
    } else {
      resetForm();
    }

    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">Gerencie seu estoque de produtos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">Dados Gerais</TabsTrigger>
                <TabsTrigger value="fiscal">Informações Fiscais</TabsTrigger>
                <TabsTrigger value="kit">Kit</TabsTrigger>
                <TabsTrigger value="bom">BOM</TabsTrigger>
                <TabsTrigger value="variations">Variações</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sale_price">Preço Venda *</Label>
                      <Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Preço Custo</Label>
                      <Input id="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Quantidade</Label>
                      <Input id="stock_quantity" type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_stock">Estoque Mínimo</Label>
                      <Input id="min_stock" type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit">{editingProduct ? "Atualizar" : "Criar"}</Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="fiscal">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ncm">NCM</Label>
                      <Input id="ncm" value={taxInfoFormData.ncm} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, ncm: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfop">CFOP</Label>
                      <Input id="cfop" value={taxInfoFormData.cfop} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, cfop: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cest">CEST</Label>
                      <Input id="cest" value={taxInfoFormData.cest} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, cest: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icms_origin">Origem ICMS</Label>
                      <Input id="icms_origin" value={taxInfoFormData.icms_origin} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, icms_origin: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icms_tax_situation">Situação Tributária ICMS</Label>
                      <Input id="icms_tax_situation" value={taxInfoFormData.icms_tax_situation} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, icms_tax_situation: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pis_tax_situation">Situação Tributária PIS</Label>
                      <Input id="pis_tax_situation" value={taxInfoFormData.pis_tax_situation} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, pis_tax_situation: e.target.value })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="cofins_tax_situation">Situação Tributária COFINS</Label>
                      <Input id="cofins_tax_situation" value={taxInfoFormData.cofins_tax_situation} onChange={(e) => setTaxInfoFormData({ ...taxInfoFormData, cofins_tax_situation: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit}>{editingProduct ? "Atualizar" : "Criar"}</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kit">
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Select onValueChange={(productId) => {
                      if (!kitComponents.find(k => k.product_id === productId)) {
                        setKitComponents([...kitComponents, { product_id: productId, quantity: 1 }]);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Adicionar componente" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {kitComponents.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kitComponents.map((comp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{products.find(p => p.id === comp.product_id)?.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={comp.quantity}
                                onChange={(e) => {
                                  const newComps = [...kitComponents];
                                  newComps[idx].quantity = parseInt(e.target.value) || 1;
                                  setKitComponents(newComps);
                                }}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => {
                                setKitComponents(kitComponents.filter((_, i) => i !== idx));
                              }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit}>{editingProduct ? "Atualizar" : "Criar"}</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bom">
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Select onValueChange={(productId) => {
                      if (!bomComponents.find(b => b.product_id === productId)) {
                        setBomComponents([...bomComponents, { product_id: productId, quantity: 1 }]);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Adicionar matéria-prima" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {bomComponents.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matéria-Prima</TableHead>
                          <TableHead>Quantidade Necessária</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bomComponents.map((comp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{products.find(p => p.id === comp.product_id)?.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={comp.quantity}
                                onChange={(e) => {
                                  const newComps = [...bomComponents];
                                  newComps[idx].quantity = parseFloat(e.target.value) || 0;
                                  setBomComponents(newComps);
                                }}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => {
                                setBomComponents(bomComponents.filter((_, i) => i !== idx));
                              }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit}>{editingProduct ? "Atualizar" : "Criar"}</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variations">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Atributos</Label>
                    <div className="flex gap-2">
                      <Select onValueChange={handleAttributeSelect}>
                        <SelectTrigger><SelectValue placeholder="Adicionar atributo" /></SelectTrigger>
                        <SelectContent>
                          {attributes.map(attr => <SelectItem key={attr.id} value={attr.name}>{attr.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {Object.keys(productAttributes).map(attrName => (
                    <div key={attrName} className="space-y-2">
                      <Label>{attrName}</Label>
                      <Input
                        placeholder="Valores separados por vírgula (ex: P, M, G)"
                        value={productAttributes[attrName].join(', ')}
                        onChange={(e) => handleAttributeValueChange(attrName, e.target.value)}
                      />
                    </div>
                  ))}

                  <Button type="button" onClick={generateVariations} disabled={Object.keys(productAttributes).length === 0}>
                    Gerar Variações
                  </Button>

                  {variations.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {variations[0].values.map(v => <TableHead key={v.attribute}>{v.attribute}</TableHead>)}
                            <TableHead>SKU</TableHead>
                            <TableHead>Preço Venda</TableHead>
                            <TableHead>Preço Custo</TableHead>
                            <TableHead>Estoque</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variations.map((variation, index) => (
                            <TableRow key={index}>
                              {variation.values.map(v => <TableCell key={v.value}>{v.value}</TableCell>)}
                              <TableCell><Input value={variation.sku} /></TableCell>
                              <TableCell><Input type="number" step="0.01" value={variation.sale_price} /></TableCell>
                              <TableCell><Input type="number" step="0.01" value={variation.cost_price} /></TableCell>
                              <TableCell><Input type="number" value={variation.stock_quantity} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>R$ {product.sale_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={product.stock_quantity <= 0 ? "text-destructive font-semibold" : ""}>
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
