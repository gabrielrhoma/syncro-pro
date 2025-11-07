-- Tabela de Cupons de Desconto
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  max_uses INT,
  current_uses INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Tabela de Saldo de Pontos de Fidelidade
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  points_balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Tabela de Regras do Programa de Fidelidade
CREATE TABLE public.loyalty_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('earn_per_real')),
  reals_for_one_point NUMERIC NOT NULL,
  point_to_real_rate NUMERIC NOT NULL DEFAULT 0.10, -- 1 ponto = R$ 0,10
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

-- Tabela de Transações de Pontos de Fidelidade
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_id UUID NOT NULL REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id),
  points_change INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'correction')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Cupons
CREATE POLICY "Admins and managers can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Authenticated users can view valid coupons for their stores" ON public.coupons FOR SELECT USING (
  store_id IS NULL OR store_id IN (SELECT store_id FROM public.user_stores WHERE user_id = auth.uid())
);

-- Políticas RLS para Saldo de Fidelidade
CREATE POLICY "Customers can view their own loyalty balance" ON public.customer_loyalty FOR SELECT USING (
  EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND auth.uid() = (SELECT user_id FROM profiles WHERE id = customers.created_by))
);
CREATE POLICY "Admins and managers can view all loyalty balances" ON public.customer_loyalty FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Regras de Fidelidade
CREATE POLICY "Authenticated users can view loyalty rules" ON public.loyalty_rules FOR SELECT USING (true);
CREATE POLICY "Admins and managers can manage loyalty rules" ON public.loyalty_rules FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Transações de Fidelidade
CREATE POLICY "Customers can view their own loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM customer_loyalty WHERE id = loyalty_id AND EXISTS (SELECT 1 FROM customers WHERE id = customer_loyalty.customer_id AND auth.uid() = (SELECT user_id FROM profiles WHERE id = customers.created_by)))
);
CREATE POLICY "Admins and managers can view all loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
