CREATE TYPE coupon_result AS (
  discount_amount NUMERIC,
  coupon_id UUID
);

CREATE OR REPLACE FUNCTION public.validate_and_apply_coupon(
    p_coupon_code TEXT,
    p_store_id UUID,
    p_total_amount NUMERIC
)
RETURNS coupon_result AS $$
DECLARE
  v_coupon record;
  v_discount_amount NUMERIC := 0;
BEGIN
  -- 1. Busca e trava o cupom para evitar condição de corrida
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = p_coupon_code AND (store_id = p_store_id OR store_id IS NULL)
  FOR UPDATE;

  -- 2. Valida as regras do cupom
  IF v_coupon IS NULL OR v_coupon.active = false THEN
    RAISE EXCEPTION 'Cupom inválido ou inexistente.';
  END IF;
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < now() THEN
    RAISE EXCEPTION 'Cupom expirado.';
  END IF;
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'Limite de usos do cupom atingido.';
  END IF;

  -- 3. Calcula o desconto
  IF v_coupon.type = 'percentage' THEN
    v_discount_amount := p_total_amount * (v_coupon.value / 100);
  ELSIF v_coupon.type = 'fixed' THEN
    v_discount_amount := v_coupon.value;
  END IF;

  -- Garante que o desconto não seja maior que o total
  IF v_discount_amount > p_total_amount THEN
    v_discount_amount := p_total_amount;
  END IF;

  -- 4. Incrementa o uso do cupom
  UPDATE public.coupons
  SET current_uses = current_uses + 1
  WHERE id = v_coupon.id;

  -- 5. Retorna o resultado
  RETURN (v_discount_amount, v_coupon.id);
END;
$$ LANGUAGE plpgsql;
