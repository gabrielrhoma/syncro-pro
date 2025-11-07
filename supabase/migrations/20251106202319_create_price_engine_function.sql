CREATE OR REPLACE FUNCTION public.calculate_price_for_sale(
    p_product_id UUID,
    p_variation_id UUID,
    p_customer_id UUID,
    p_quantity INT,
    p_store_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_base_price NUMERIC;
  v_final_price NUMERIC;
  v_promotion record;
  v_price_list_id UUID;
BEGIN
  -- 1. Buscar Preço Base
  IF p_customer_id IS NOT NULL THEN
    SELECT price_list_id INTO v_price_list_id FROM customer_price_list_link WHERE customer_id = p_customer_id;
  END IF;

  IF v_price_list_id IS NOT NULL THEN
    SELECT price INTO v_base_price FROM product_prices
    WHERE (product_id = p_product_id OR product_variation_id = p_variation_id) AND price_list_id = v_price_list_id;
  END IF;

  IF v_base_price IS NULL THEN
    IF p_variation_id IS NOT NULL THEN
      SELECT sale_price INTO v_base_price FROM product_variations WHERE id = p_variation_id;
    ELSE
      SELECT sale_price INTO v_base_price FROM products WHERE id = p_product_id;
    END IF;
  END IF;

  v_final_price := v_base_price;

  -- 2. Aplicar Promoção (se houver)
  -- Prioridade 1: BOGO
  SELECT * INTO v_promotion FROM promotions
  WHERE (product_id = p_product_id OR category_id = (SELECT category_id FROM products WHERE id = p_product_id))
    AND store_id = p_store_id AND type = 'bogo_x_y' AND active = true
    AND now() BETWEEN active_from AND active_until LIMIT 1;

  IF FOUND THEN
    IF p_quantity >= v_promotion.buy_quantity THEN
      v_final_price := (v_base_price * v_promotion.pay_quantity) / v_promotion.buy_quantity;
    END IF;
  ELSE
    -- Prioridade 2: Outros Descontos
    SELECT * INTO v_promotion FROM promotions
    WHERE (product_id = p_product_id OR category_id = (SELECT category_id FROM products WHERE id = p_product_id))
      AND store_id = p_store_id AND type <> 'bogo_x_y' AND active = true
      AND now() BETWEEN active_from AND active_until LIMIT 1;

    IF FOUND THEN
      IF v_promotion.type = 'percentage_off' THEN
        v_final_price := v_base_price * (1 - v_promotion.discount_value / 100);
      ELSIF v_promotion.type = 'fixed_discount' THEN
        v_final_price := v_base_price - v_promotion.discount_value;
      END IF;
    END IF;
  END IF;

  RETURN GREATEST(0, v_final_price); -- Garante que o preço não seja negativo
END;
$$ LANGUAGE plpgsql;
