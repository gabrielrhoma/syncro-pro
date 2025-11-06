-- Tabela de Movimentos de Caixa (Sangria/Suprimento)
CREATE TABLE public.cash_register_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('sangria', 'suprimento')),
  amount NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cash_register_transactions ENABLE ROW LEVEL SECURITY;

-- Tabela de Linhas de Extrato Bancário
CREATE TABLE public.bank_statement_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  is_reconciled BOOLEAN DEFAULT false,
  transaction_id UUID REFERENCES public.transactions(id),
  payable_id UUID REFERENCES public.accounts_payable(id),
  receivable_id UUID REFERENCES public.accounts_receivable(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;

-- Adicionar colunas para anexos
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Políticas RLS para Movimentos de Caixa
CREATE POLICY "Users can access cash register transactions from their stores" ON public.cash_register_transactions FOR ALL
  USING (is_member_of_store(auth.uid(), store_id))
  WITH CHECK (is_member_of_store(auth.uid(), store_id));

-- Políticas RLS para Linhas de Extrato Bancário
CREATE POLICY "Managers and admins can manage bank statement lines" ON public.bank_statement_lines FOR ALL
  USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
  WITH CHECK (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
