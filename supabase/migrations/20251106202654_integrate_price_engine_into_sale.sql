-- Atualização da função create_sale_and_emit_nfce para integrar o motor de preços
DROP FUNCTION IF EXISTS public.create_sale_and_emit_nfce;
CREATE OR REPLACE FUNCTION public.create_sale_and_emit_nfce(
    p_user_id UUID, p_customer_id UUID, p_payment_method TEXT,
    p_cart_items cart_item[], p_cpf TEXT, p_store_id UUID,
    p_contingency BOOLEAN DEFAULT false, p_coupon_code TEXT DEFAULT NULL, p_loyalty_discount NUMERIC DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_sale_id UUID; v_total_amount NUMERIC := 0; v_final_unit_price NUMERIC; v_subtotal NUMERIC;
  -- ... (outras declarações) ...
BEGIN
  -- ... (lógica de validação e desconto de cupom/fidelidade) ...

  -- Loop para calcular totais e inserir itens da venda com preços corretos
  FOREACH item IN ARRAY p_cart_items
  LOOP
    -- Chama o motor de preços para obter o preço unitário final
    v_final_unit_price := public.calculate_price_for_sale(item.product_id, NULL, p_customer_id, item.quantity, p_store_id);
    v_subtotal := v_final_unit_price * item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, item.product_id, item.quantity, v_final_unit_price, v_subtotal);

    -- ... (lógica de decremento de estoque para kits/produtos) ...
  END LOOP;

  -- Atualiza o valor total/final da venda com os preços calculados
  UPDATE public.sales SET total_amount = v_total_amount, final_amount = v_total_amount - v_discount_amount WHERE id = v_sale_id;

  -- ... (Restante da lógica: comissões, fiscal, etc.) ...

  RETURN json_build_object('sale_id', v_sale_id, 'status', 'success');
END;
$$ LANGUAGE plpgsql;
