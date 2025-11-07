-- ====================================
-- MIGRAÇÃO COMPLETA: MULTI-LOJA, KITS, MANUFATURA, MARKETING, FINANCEIRO AVANÇADO, ADMIN
-- ====================================

-- 1. MULTI-LOJA E RBAC
-- Tabela de lojas (já existe stores, apenas garantir)
-- Tabela de vínculos usuário-loja
CREATE TABLE IF NOT EXISTS public.user_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, store_id)
);

ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store assignments"
  ON public.user_stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage store assignments"
  ON public.user_stores FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 2. INVENTÁRIO AVANÇADO: KITS
CREATE TABLE IF NOT EXISTS public.kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  component_variation_id UUID,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view kit items"
  ON public.kit_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage kit items"
  ON public.kit_items FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 3. INVENTÁRIO AVANÇADO: MANUFATURA
CREATE TABLE IF NOT EXISTS public.product_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  raw_material_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_variation_id UUID,
  quantity_needed NUMERIC NOT NULL CHECK (quantity_needed > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_bom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view BOM"
  ON public.product_bom FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage BOM"
  ON public.product_bom FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE TABLE IF NOT EXISTS public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  product_to_produce_id UUID NOT NULL REFERENCES products(id),
  quantity_to_produce INTEGER NOT NULL CHECK (quantity_to_produce > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view production orders"
  ON public.production_orders FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage production orders"
  ON public.production_orders FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 4. MARKETING: CUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins and managers can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 5. MARKETING: FIDELIDADE
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view loyalty"
  ON public.customer_loyalty FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage loyalty"
  ON public.customer_loyalty FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  sale_id UUID REFERENCES sales(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can create loyalty transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_per_real NUMERIC DEFAULT 1,
  reais_per_point NUMERIC DEFAULT 0.01,
  min_points_to_redeem INTEGER DEFAULT 100,
  points_expiry_days INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active loyalty rules"
  ON public.loyalty_rules FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage loyalty rules"
  ON public.loyalty_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 6. MARKETING: LISTAS DE PREÇOS
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price lists"
  ON public.price_lists FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage price lists"
  ON public.price_lists FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(price_list_id, product_id)
);

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product prices"
  ON public.product_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage product prices"
  ON public.product_prices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE TABLE IF NOT EXISTS public.customer_price_list_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_price_list_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer price lists"
  ON public.customer_price_list_link FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage customer price lists"
  ON public.customer_price_list_link FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 7. MARKETING: PROMOÇÕES
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount', 'bogo', 'bundle')),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  product_id UUID REFERENCES products(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active promotions"
  ON public.promotions FOR SELECT
  USING (active = true);

CREATE POLICY "Admins and managers can manage promotions"
  ON public.promotions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 8. FINANCEIRO AVANÇADO: TRANSAÇÕES DE CAIXA
CREATE TABLE IF NOT EXISTS public.cash_register_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'withdrawal', 'addition', 'opening', 'closing')),
  amount NUMERIC NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cash_register_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cash transactions"
  ON public.cash_register_transactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create cash transactions"
  ON public.cash_register_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. FINANCEIRO AVANÇADO: CONCILIAÇÃO BANCÁRIA
CREATE TABLE IF NOT EXISTS public.bank_statement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance NUMERIC,
  matched BOOLEAN DEFAULT false,
  matched_with_type TEXT CHECK (matched_with_type IN ('payable', 'receivable')),
  matched_with_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bank statements"
  ON public.bank_statement_lines FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 10. E-COMMERCE
CREATE TABLE IF NOT EXISTS public.ecommerce_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ecommerce_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ecommerce connections"
  ON public.ecommerce_connections FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 11. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 12. CUSTOM FIELDS
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date')),
  required BOOLEAN DEFAULT false,
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_name, field_name, store_id)
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view custom fields"
  ON public.custom_field_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage custom fields"
  ON public.custom_field_definitions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_definition_id, record_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view custom field values"
  ON public.custom_field_values FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage custom field values"
  ON public.custom_field_values FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 13. SYSTEM ALERTS
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expiring_product', 'fiscal_error', 'ai_insight', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.system_alerts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own alerts"
  ON public.system_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts"
  ON public.system_alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 14. CUSTOMER STORE CREDIT
CREATE TABLE IF NOT EXISTS public.customer_store_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_store_credit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view store credit"
  ON public.customer_store_credit FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage store credit"
  ON public.customer_store_credit FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 15. INVENTORY ADJUSTMENTS
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_variation_id UUID,
  quantity_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory adjustments"
  ON public.inventory_adjustments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can create inventory adjustments"
  ON public.inventory_adjustments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON customer_loyalty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_store_credit_updated_at BEFORE UPDATE ON customer_store_credit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();