-- Tabela de Atributos do Produto (ex: Cor, Tamanho)
CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- Tabela de Valores de Atributos (ex: Vermelho, M)
CREATE TABLE public.attribute_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attribute_id UUID NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  UNIQUE(attribute_id, value),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;

-- Tabela de Variações de Produto (SKUs)
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  cost_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Tabela de Junção entre Variações e Valores de Atributos
CREATE TABLE public.product_variation_values (
  variation_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  value_id UUID NOT NULL REFERENCES public.attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variation_id, value_id)
);
ALTER TABLE public.product_variation_values ENABLE ROW LEVEL SECURITY;

-- Tabela de Ajustes de Estoque
CREATE TABLE public.inventory_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('perda', 'furto', 'vencimento', 'contagem_inicial', 'entrada_manual', 'saida_manual')),
  cost NUMERIC NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_product_or_variation CHECK (product_id IS NOT NULL OR product_variation_id IS NOT NULL)
);
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Atributos
CREATE POLICY "Authenticated users can view attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage attributes" ON public.product_attributes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Valores de Atributos
CREATE POLICY "Authenticated users can view attribute values" ON public.attribute_values FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage attribute values" ON public.attribute_values FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Variações de Produto
CREATE POLICY "Authenticated users can view variations" ON public.product_variations FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage variations" ON public.product_variations FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para a Tabela de Junção
CREATE POLICY "Authenticated users can view variation values" ON public.product_variation_values FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage variation values" ON public.product_variation_values FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Ajustes de Estoque
CREATE POLICY "Managers and admins can view adjustments" ON public.inventory_adjustments FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers and admins can create adjustments" ON public.inventory_adjustments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
