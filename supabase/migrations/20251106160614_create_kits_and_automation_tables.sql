-- Tabela de Kits (Produtos Compostos)
CREATE TABLE public.product_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;

-- Tabela de Itens de um Kit
CREATE TABLE public.kit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id UUID NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  CONSTRAINT chk_item_type CHECK ((product_id IS NOT NULL AND product_variation_id IS NULL) OR (product_id IS NULL AND product_variation_id IS NOT NULL))
);
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

-- Tabela de Alertas do Sistema
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'invoice_overdue')),
  message TEXT NOT NULL,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Tabela de Resumos Financeiros Diários
CREATE TABLE public.daily_financial_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, summary_date)
);
ALTER TABLE public.daily_financial_summary ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Kits
CREATE POLICY "Users can access kits from their stores" ON public.product_kits FOR ALL
  USING (is_member_of_store(auth.uid(), (SELECT store_id FROM products WHERE id = product_id)));
CREATE POLICY "Users can access kit items from their stores" ON public.kit_items FOR ALL
  USING (is_member_of_store(auth.uid(), (SELECT store_id FROM products WHERE id = (SELECT product_id FROM product_kits WHERE id = kit_id))));

-- Políticas RLS para Alertas do Sistema
CREATE POLICY "Managers and admins can access alerts from their stores" ON public.system_alerts FOR ALL
  USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

-- Políticas RLS para Resumos Financeiros Diários
CREATE POLICY "Managers and admins can access summaries from their stores" ON public.daily_financial_summary FOR ALL
  USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
