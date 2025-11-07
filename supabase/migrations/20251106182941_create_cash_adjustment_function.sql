CREATE OR REPLACE FUNCTION public.create_cash_adjustment_logic(
    p_user_id UUID,
    p_register_id UUID,
    p_store_id UUID,
    p_type TEXT,
    p_amount NUMERIC,
    p_reason TEXT
)
RETURNS VOID AS $$
DECLARE
  v_amount_to_update NUMERIC;
  v_current_cash NUMERIC;
BEGIN
  IF NOT is_member_of_store(p_user_id, p_store_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para operar nesta loja.';
  END IF;

  IF p_type = 'sangria' THEN
    v_amount_to_update := p_amount * -1;

    SELECT current_cash_amount INTO v_current_cash FROM public.cash_registers WHERE id = p_register_id FOR UPDATE;
    IF v_current_cash < p_amount THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa para esta operação.';
    END IF;
  ELSIF p_type = 'suprimento' THEN
    v_amount_to_update := p_amount;
  ELSE
    RAISE EXCEPTION 'Tipo de ajuste inválido. Use "sangria" ou "suprimento".';
  END IF;

  UPDATE public.cash_registers
  SET current_cash_amount = current_cash_amount + v_amount_to_update
  WHERE id = p_register_id;

  INSERT INTO public.cash_register_transactions (cash_register_id, store_id, user_id, type, amount, reason)
  VALUES (p_register_id, p_store_id, (SELECT id FROM profiles WHERE id = p_user_id), p_type, p_amount, p_reason);
END;
$$ LANGUAGE plpgsql;
