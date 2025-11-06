CREATE OR REPLACE FUNCTION public.decrement_kit_stock(
    p_kit_product_id UUID,
    p_quantity_sold INT,
    p_store_id UUID
)
RETURNS VOID AS $$
DECLARE
  kit_item_record record;
  v_kit_id UUID;
BEGIN
  -- Encontrar o ID do kit a partir do ID do produto pai
  SELECT id INTO v_kit_id FROM public.product_kits WHERE product_id = p_kit_product_id;
  IF NOT FOUND THEN
    -- Não é um erro, simplesmente não é um kit. A função de venda tratará isso.
    RETURN;
  END IF;

  -- Loop através dos itens do kit
  FOR kit_item_record IN
    SELECT product_id, product_variation_id, quantity
    FROM public.kit_items
    WHERE kit_id = v_kit_id
  LOOP
    IF kit_item_record.product_id IS NOT NULL THEN
      -- É um produto simples
      UPDATE public.products
      SET stock_quantity = stock_quantity - (kit_item_record.quantity * p_quantity_sold)
      WHERE id = kit_item_record.product_id AND store_id = p_store_id;
    ELSIF kit_item_record.product_variation_id IS NOT NULL THEN
      -- É uma variação de produto
      UPDATE public.product_variations
      SET stock_quantity = stock_quantity - (kit_item_record.quantity * p_quantity_sold)
      WHERE id = kit_item_record.product_variation_id AND store_id = p_store_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
