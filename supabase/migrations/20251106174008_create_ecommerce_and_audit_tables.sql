-- Tabela de Conexões de E-commerce
CREATE TABLE public.ecommerce_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  api_url TEXT NOT NULL,
  last_sync TIMESTAMPTZ,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ecommerce_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers and admins can manage e-commerce connections" ON public.ecommerce_connections FOR ALL
  USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

-- Modificar tabelas existentes para sincronização
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS external_ecommerce_id TEXT;
ALTER TABLE public.product_variations ADD COLUMN IF NOT EXISTS external_ecommerce_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS external_ecommerce_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS ecommerce_order_id TEXT UNIQUE;

-- Tabela de Log de Auditoria
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  store_id UUID REFERENCES public.stores(id),
  action_type TEXT NOT NULL,
  entity_id UUID,
  details TEXT,
  changes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
-- Nenhuma política de INSERT, UPDATE ou DELETE para garantir imutabilidade (operações via SECURITY_DEFINER triggers/functions).
