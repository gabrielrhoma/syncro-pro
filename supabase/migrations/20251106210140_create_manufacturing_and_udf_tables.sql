-- Tabelas de Manufatura
CREATE TABLE public.product_bom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finished_good_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  CONSTRAINT chk_raw_material_type CHECK ((raw_material_id IS NOT NULL AND raw_material_variation_id IS NULL) OR (raw_material_id IS NULL AND raw_material_variation_id IS NOT NULL))
);
ALTER TABLE public.product_bom ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_to_produce_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_to_produce NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

-- Tabelas de Campos Customizáveis
CREATE TABLE public.custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  applies_to_table TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  UNIQUE(store_id, applies_to_table, field_name)
);
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- Modificações para Campos Customizáveis e Índices GIN
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_fields JSONB;
CREATE INDEX IF NOT EXISTS products_custom_fields_gin_idx ON public.products USING GIN (custom_fields);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS custom_fields JSONB;
CREATE INDEX IF NOT EXISTS customers_custom_fields_gin_idx ON public.customers USING GIN (custom_fields);

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS custom_fields JSONB;
CREATE INDEX IF NOT EXISTS suppliers_custom_fields_gin_idx ON public.suppliers USING GIN (custom_fields);

-- Políticas RLS
CREATE POLICY "Managers and admins can manage BOMs" ON public.product_bom FOR ALL USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
CREATE POLICY "Managers and admins can manage production orders" ON public.production_orders FOR ALL USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
CREATE POLICY "Managers and admins can manage custom field definitions" ON public.custom_field_definitions FOR ALL USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
