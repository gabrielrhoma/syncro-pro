-- Passo 1: Inserir uma "Loja Principal" para associar dados existentes.
-- Usamos um UUID fixo para facilitar a referência no passo de UPDATE.
-- A função gen_random_uuid() não é estável entre execuções.
-- Este UUID foi gerado offline.
DO $$
DECLARE
  default_store_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.stores (id, name, code)
  VALUES (default_store_id, 'Loja Principal', 'DEFAULT')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Passo 2: Adicionar a coluna store_id a todas as tabelas relevantes.
-- Usamos `IF NOT EXISTS` para segurança.
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.inventory_adjustments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.product_variations ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.cash_registers ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
-- `products` e `sales` já devem ter, mas adicionamos por segurança.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);

-- Passo 3: Atualizar todos os registros existentes para apontar para a "Loja Principal".
UPDATE public.customers SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_orders SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.accounts_payable SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.accounts_receivable SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.inventory_adjustments SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.product_variations SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.cash_registers SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.products SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.sales SET store_id = '00000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;

-- Passo 4: Criar a tabela de junção user_stores.
CREATE TABLE IF NOT EXISTS public.user_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, store_id)
);
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store associations" ON public.user_stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage store associations" ON public.user_stores FOR ALL USING (has_role(auth.uid(), 'admin'));
