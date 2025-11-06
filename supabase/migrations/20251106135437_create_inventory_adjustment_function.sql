CREATE OR REPLACE FUNCTION public.create_inventory_adjustment_logic(
    p_user_id UUID,
    p_product_id UUID,
    p_product_variation_id UUID,
    p_quantity_change INTEGER,
    p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  v_cost_price NUMERIC;
  v_cost_of_adjustment NUMERIC;
BEGIN
  -- 1. Atualizar estoque e obter o preço de custo
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_quantity = stock_quantity + p_quantity_change
    WHERE id = p_product_id
    RETURNING cost_price INTO v_cost_price;
  ELSIF p_product_variation_id IS NOT NULL THEN
    UPDATE public.product_variations
    SET stock_quantity = stock_quantity + p_quantity_change
    WHERE id = p_product_variation_id
    RETURNING cost_price INTO v_cost_price;
  ELSE
    RAISE EXCEPTION 'ID do produto ou da variação deve ser fornecido.';
  END IF;

  -- 2. Calcular o custo do ajuste
  v_cost_of_adjustment := p_quantity_change * v_cost_price;

  -- 3. Criar o registro de ajuste de estoque
  INSERT INTO public.inventory_adjustments (
    product_id,
    product_variation_id,
    quantity_change,
    reason,
    cost,
    created_by
  ) VALUES (
    p_product_id,
    p_product_variation_id,
    p_quantity_change,
    p_reason,
    v_cost_of_adjustment,
    p_user_id
  );

  -- 4. Se for uma perda, criar transação de despesa
  IF p_quantity_change < 0 THEN
    INSERT INTO public.transactions (
      type,
      category,
      description,
      amount,
      created_by
    ) VALUES (
      'expense',
      'Perda de Estoque',
      'Ajuste de estoque por ' || p_reason,
      ABS(v_cost_of_adjustment),
      p_user_id
    );
  END IF;

END;
$$ LANGUAGE plpgsql;
