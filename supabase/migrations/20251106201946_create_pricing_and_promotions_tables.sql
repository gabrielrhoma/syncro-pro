-- Tabela de Listas de Preços
CREATE TABLE public.price_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

-- Tabela de Junção Cliente x Lista de Preços
CREATE TABLE public.customer_price_list_link (
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  PRIMARY KEY (customer_id, price_list_id)
);
ALTER TABLE public.customer_price_list_link ENABLE ROW LEVEL SECURITY;

-- Tabela de Preços de Produtos por Lista
CREATE TABLE public.product_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  CONSTRAINT chk_product_or_variation_price CHECK ((product_id IS NOT NULL AND product_variation_id IS NULL) OR (product_id IS NULL AND product_variation_id IS NOT NULL))
);
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Tabela de Promoções
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('bogo_x_y', 'percentage_off', 'fixed_discount')),
  buy_quantity INT,
  pay_quantity INT,
  discount_value NUMERIC,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Managers and admins can manage price lists" ON public.price_lists FOR ALL USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
CREATE POLICY "Managers and admins can manage customer price links" ON public.customer_price_list_link FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers and admins can manage product prices" ON public.product_prices FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers and admins can manage promotions" ON public.promotions FOR ALL USING (is_member_of_store(auth.uid(), store_id) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));
