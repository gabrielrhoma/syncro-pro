-- Atualização da função create_sale_and_emit_nfce para incluir lógica de kits
DROP FUNCTION IF EXISTS public.create_sale_and_emit_nfce;
CREATE OR REPLACE FUNCTION public.create_sale_and_emit_nfce(
    p_user_id UUID, p_customer_id UUID, p_payment_method TEXT,
    p_cart_items cart_item[], p_cpf TEXT, p_store_id UUID,
    p_contingency BOOLEAN DEFAULT false, p_coupon_code TEXT DEFAULT NULL, p_loyalty_discount NUMERIC DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_sale_id UUID; v_is_kit BOOLEAN;
  -- ... (outras declarações) ...
BEGIN
  -- ... (lógica inicial da função: validações, cálculo de totais, etc.) ...

  -- Loop para inserir itens da venda e abater estoque
  FOREACH item IN ARRAY p_cart_items
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, item.product_id, item.quantity, item.unit_price, item.subtotal);

    -- Verifica se o produto é um kit
    SELECT EXISTS (SELECT 1 FROM product_kits WHERE product_id = item.product_id) INTO v_is_kit;

    IF v_is_kit THEN
      -- Se for um kit, chama a função para abater o estoque dos componentes
      PERFORM public.decrement_kit_stock(item.product_id, item.quantity, p_store_id);
    ELSE
      -- Se não for um kit, abate o estoque do produto/variação normalmente
      -- (Esta lógica pode variar se o carrinho pode conter variações diretamente)
      UPDATE public.products
      SET stock_quantity = stock_quantity - item.quantity
      WHERE id = item.product_id AND store_id = p_store_id;
    END IF;
  END LOOP;

  -- ... (Restante da lógica: comissões, fiscal, etc.) ...

  RETURN json_build_object('sale_id', v_sale_id, 'status', 'success');
END;
$$ LANGUAGE plpgsql;
