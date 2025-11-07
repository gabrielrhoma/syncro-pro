BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(3);

-- Setup de dados
-- ... (INSERTs para criar produtos, promoções, listas de preços, etc.)

-- Testes
SELECT is((SELECT public.calculate_price_for_sale('product_id', NULL, 'customer_id', 5, 'store_id')),
          'expected_price',
          'BOGO "Leve 3 Pague 2" com 5 unidades deve funcionar');

SELECT is((SELECT public.calculate_price_for_sale('product_id', NULL, 'atacado_customer_id', 1, 'store_id')),
          'wholesale_price',
          'Lista de Preços Atacado deve ser aplicada');

SELECT is((SELECT public.calculate_price_for_sale('bogo_product_id', NULL, 'atacado_customer_id', 3, 'store_id')),
          'bogo_price',
          'Promoção BOGO deve ter prioridade sobre a Lista de Preços');

SELECT * FROM finish();
ROLLBACK;
