-- Tabela de Crédito em Loja para Clientes
CREATE TABLE public.customer_store_credit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.customer_store_credit ENABLE ROW LEVEL SECURITY;

-- Tabela de Comissões de Venda
CREATE TABLE public.sales_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id UUID NOT NULL REFERENCES auth.users(id),
  commission_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

-- Adicionar taxa de comissão na tabela de perfis
ALTER TABLE public.profiles
ADD COLUMN commission_rate NUMERIC DEFAULT 0.05; -- Padrão de 5%

-- Políticas RLS para Crédito em Loja
CREATE POLICY "Authenticated users can view store credit" ON public.customer_store_credit FOR SELECT USING (true);
CREATE POLICY "Managers and admins can manage store credit" ON public.customer_store_credit FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Políticas RLS para Comissões de Venda
CREATE POLICY "Users can view their own commissions" ON public.sales_commissions FOR SELECT USING (salesperson_id = auth.uid());
CREATE POLICY "Managers and admins can view all commissions" ON public.sales_commissions FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "System can create commissions" ON public.sales_commissions FOR INSERT WITH CHECK (true); -- A criação será via function
