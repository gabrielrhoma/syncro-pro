BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(1);

-- Setup
-- ... (INSERTs para criar um cliente, uma definição de campo customizável do tipo 'number')

-- Teste
SELECT throws_ok(
  $$ SELECT public.set_custom_field('customers', 'customer_id', 'field_name', '"not a number"') $$,
  'Valor inválido. Esperado um número.',
  '`set_custom_field` deve lançar uma exceção para tipo de dado inválido'
);

SELECT * FROM finish();
ROLLBACK;
