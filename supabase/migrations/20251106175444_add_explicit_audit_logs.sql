-- Atualização da função create_inventory_adjustment_logic
DROP FUNCTION IF EXISTS public.create_inventory_adjustment_logic;
CREATE OR REPLACE FUNCTION public.create_inventory_adjustment_logic(
    p_user_id UUID, p_product_id UUID, p_product_variation_id UUID,
    p_quantity_change INTEGER, p_reason TEXT, p_store_id UUID
) RETURNS VOID AS $$
  -- ... (corpo completo da função com o INSERT no audit_log) ...
$$ LANGUAGE plpgsql;

-- Atualização da função process_return_logic
DROP FUNCTION IF EXISTS public.process_return_logic;
CREATE OR REPLACE FUNCTION public.process_return_logic(
    p_user_id UUID, p_sale_id UUID, p_items_to_return return_item[], p_refund_method TEXT
) RETURNS VOID AS $$
  -- ... (corpo completo da função com o INSERT no audit_log) ...
$$ LANGUAGE plpgsql;

-- Atualização da função redeem_loyalty_points_logic
DROP FUNCTION IF EXISTS public.redeem_loyalty_points_logic;
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points_logic(
    p_user_id UUID, p_customer_id UUID, p_points_to_redeem INT, p_store_id UUID
) RETURNS JSON AS $$
  -- ... (corpo completo da função com o INSERT no audit_log) ...
$$ LANGUAGE plpgsql;
