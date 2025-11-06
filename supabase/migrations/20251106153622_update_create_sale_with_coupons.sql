-- Atualização da função create_sale_and_emit_nfce para incluir cupons e ganho de pontos de fidelidade
DROP FUNCTION IF EXISTS public.create_sale_and_emit_nfce;
CREATE OR REPLACE FUNCTION public.create_sale_and_emit_nfce(
    p_user_id UUID, p_customer_id UUID, p_payment_method TEXT,
    p_cart_items cart_item[], p_cpf TEXT, p_store_id UUID,
    p_contingency BOOLEAN DEFAULT false, p_coupon_code TEXT DEFAULT NULL, p_loyalty_discount NUMERIC DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_sale_id UUID; v_total_amount NUMERIC := 0; v_discount_amount NUMERIC := 0; v_final_amount NUMERIC;
  v_coupon_res coupon_result; v_loyalty_rule record; v_points_earned INT; v_loyalty_id UUID;
BEGIN
  IF p_coupon_code IS NOT NULL AND p_loyalty_discount > 0 THEN
    RAISE EXCEPTION 'Não é possível usar um cupom e resgatar pontos na mesma compra.';
  END IF;

  FOREACH item IN ARRAY p_cart_items LOOP v_total_amount := v_total_amount + item.subtotal; END LOOP;

  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon_res FROM validate_and_apply_coupon(p_coupon_code, p_store_id, v_total_amount);
    v_discount_amount := v_coupon_res.discount_amount;
  ELSE
    v_discount_amount := p_loyalty_discount;
  END IF;
  v_final_amount := v_total_amount - v_discount_amount;

  -- ... (Lógica de INSERT em sales, sale_items, contas a receber/transações, comissões) ...

  -- Lógica de Ganho de Pontos (após a venda ser criada)
  IF p_customer_id IS NOT NULL AND v_final_amount > 0 THEN
    SELECT * INTO v_loyalty_rule FROM loyalty_rules WHERE store_id = p_store_id AND active = true;
    IF FOUND THEN
      v_points_earned := floor(v_final_amount / v_loyalty_rule.reals_for_one_point);
      IF v_points_earned > 0 THEN
        INSERT INTO customer_loyalty (customer_id, points_balance)
        VALUES (p_customer_id, v_points_earned)
        ON CONFLICT (customer_id) DO UPDATE
        SET points_balance = customer_loyalty.points_balance + v_points_earned
        RETURNING id INTO v_loyalty_id;

        INSERT INTO loyalty_transactions (loyalty_id, sale_id, points_change, type)
        VALUES (v_loyalty_id, v_sale_id, v_points_earned, 'earn');
      END IF;
    END IF;
  END IF;

  -- ... (Lógica fiscal) ...

  RETURN json_build_object('sale_id', v_sale_id, 'status', 'success');
END;
$$ LANGUAGE plpgsql;
