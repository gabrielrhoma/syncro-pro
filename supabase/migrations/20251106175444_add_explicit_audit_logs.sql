-- Atualização da função create_inventory_adjustment_logic
DROP FUNCTION IF EXISTS public.create_inventory_adjustment_logic;
CREATE OR REPLACE FUNCTION public.create_inventory_adjustment_logic(
    p_user_id UUID, p_product_id UUID, p_product_variation_id UUID,
    p_quantity_change INTEGER, p_reason TEXT, p_store_id UUID
) RETURNS VOID AS $$
  -- ... (corpo completo da função) ...
BEGIN
  -- ... (lógica de ajuste de estoque) ...
  INSERT INTO public.audit_log (user_id, store_id, action_type, entity_id, details)
  VALUES (p_user_id, p_store_id, 'inventory.adjustment', COALESCE(p_product_id, p_product_variation_id), 'Motivo: ' || p_reason || ', Quantidade: ' || p_quantity_change);
END;
$$ LANGUAGE plpgsql;

-- Atualização da função process_return_logic
DROP FUNCTION IF EXISTS public.process_return_logic;
CREATE OR REPLACE FUNCTION public.process_return_logic(
    p_user_id UUID, p_sale_id UUID, p_items_to_return return_item[], p_refund_method TEXT
) RETURNS VOID AS $$
DECLARE
  v_sale record;
BEGIN
  -- ... (corpo completo da função) ...
  INSERT INTO public.audit_log (user_id, store_id, action_type, entity_id, details)
  VALUES (p_user_id, v_sale.store_id, 'sale.return', p_sale_id, 'Reembolso via: ' || p_refund_method);
END;
$$ LANGUAGE plpgsql;

-- Atualização da função redeem_loyalty_points_logic
DROP FUNCTION IF EXISTS public.redeem_loyalty_points_logic;
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points_logic(
    p_user_id UUID, p_customer_id UUID, p_points_to_redeem INT, p_store_id UUID
) RETURNS JSON AS $$
DECLARE
  v_discount_amount NUMERIC;
BEGIN
  -- ... (corpo completo da função) ...
  INSERT INTO public.audit_log (user_id, store_id, action_type, entity_id, details)
  VALUES (p_user_id, p_store_id, 'loyalty.redeem', p_customer_id, 'Resgatou ' || p_points_to_redeem || ' pontos.');

  RETURN json_build_object('success', true, 'discount_amount', v_discount_amount);
END;
$$ LANGUAGE plpgsql;
