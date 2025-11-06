CREATE OR REPLACE FUNCTION public.redeem_loyalty_points_logic(
    p_user_id UUID,
    p_customer_id UUID,
    p_points_to_redeem INT,
    p_store_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_loyalty_balance INT;
  v_loyalty_id UUID;
  v_loyalty_rule record;
  v_discount_amount NUMERIC;
BEGIN
  IF NOT is_member_of_store(p_user_id, p_store_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para operar nesta loja.';
  END IF;

  -- 1. Trava a linha e verifica o saldo
  SELECT id, points_balance INTO v_loyalty_id, v_loyalty_balance
  FROM public.customer_loyalty
  WHERE customer_id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND OR v_loyalty_balance < p_points_to_redeem THEN
    RAISE EXCEPTION 'Pontos de fidelidade insuficientes.';
  END IF;

  -- 2. Busca a regra de resgate e calcula o desconto
  SELECT * INTO v_loyalty_rule FROM public.loyalty_rules WHERE store_id = p_store_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhuma regra de fidelidade ativa encontrada para esta loja.';
  END IF;

  v_discount_amount := p_points_to_redeem * v_loyalty_rule.point_to_real_rate;

  -- 3. Debita os pontos e registra a transação
  UPDATE public.customer_loyalty
  SET points_balance = points_balance - p_points_to_redeem
  WHERE id = v_loyalty_id;

  INSERT INTO public.loyalty_transactions (loyalty_id, points_change, type)
  VALUES (v_loyalty_id, -p_points_to_redeem, 'redeem');

  -- 4. Retorna o valor do desconto
  RETURN json_build_object('success', true, 'discount_amount', v_discount_amount);
END;
$$ LANGUAGE plpgsql;
