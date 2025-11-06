-- Função auxiliar para verificar a associação de loja do usuário
CREATE OR REPLACE FUNCTION is_member_of_store(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_stores
    WHERE user_id = _user_id AND store_id = _store_id
  ) OR has_role(_user_id, 'admin');
$$;

-- Tabela: products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Admins and managers can manage products" ON public.products;
CREATE POLICY "Users can access products from their stores" ON public.products FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
CREATE POLICY "Users can access sales from their stores" ON public.sales FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: customers
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Users can access customers from their stores" ON public.customers FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: purchase_orders
DROP POLICY IF EXISTS "Authenticated users can view purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can create purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can access purchase orders from their stores" ON public.purchase_orders FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: accounts_payable
DROP POLICY IF EXISTS "Authenticated users can view accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can create accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can update accounts payable" ON public.accounts_payable;
CREATE POLICY "Users can access accounts payable from their stores" ON public.accounts_payable FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: accounts_receivable
DROP POLICY IF EXISTS "Authenticated users can view accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can create accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users can update accounts receivable" ON public.accounts_receivable;
CREATE POLICY "Users can access accounts receivable from their stores" ON public.accounts_receivable FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));

-- Tabela: inventory_adjustments
DROP POLICY IF EXISTS "Managers and admins can view adjustments" ON public.inventory_adjustments;
DROP POLICY IF EXISTS "Managers and admins can create adjustments" ON public.inventory_adjustments;
CREATE POLICY "Users can access inventory adjustments from their stores" ON public.inventory_adjustments FOR ALL
  USING (is_member_of_store(auth.uid(), store_id))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Tabela: cash_registers
-- (Assumindo que esta tabela também terá RLS por loja, caso contrário, ajuste)
CREATE POLICY "Users can access cash registers from their stores" ON public.cash_registers FOR ALL
  USING (is_member_of_store(auth.uid(), store_id));
