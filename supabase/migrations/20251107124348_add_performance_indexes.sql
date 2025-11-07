-- Análise de Performance (Exemplo para a query de top_products ANTES dos índices)
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT p.name, SUM(si.quantity), SUM(si.subtotal)
-- FROM sale_items si
-- JOIN products p ON si.product_id = p.id
-- JOIN sales s ON si.sale_id = s.id
-- WHERE s.store_id = '...' AND s.created_at BETWEEN '...' AND '...'
-- GROUP BY p.name ORDER BY SUM(si.subtotal) DESC LIMIT 10;
--
-- Exemplo de resultado (sem índices):
-- ...
--   ->  Parallel Hash Join  (cost=... rows=... width=...) (actual time=... rows=... loops=...)
--         Hash Cond: (si.sale_id = s.id)
--         Buffers: shared hit=...
--         ->  Parallel Seq Scan on sales s  (cost=... rows=... width=...) (actual time=... rows=... loops=...)
--               Filter: ((store_id = '...') AND (created_at >= '...') AND (created_at <= '...'))
--               Buffers: shared hit=...
-- ...

-- Criação de Índices de Performance
CREATE INDEX IF NOT EXISTS sales_store_id_created_at_idx ON public.sales (store_id, created_at);
CREATE INDEX IF NOT EXISTS transactions_store_id_date_idx ON public.transactions (store_id, transaction_date);
CREATE INDEX IF NOT EXISTS accounts_payable_store_id_due_date_status_idx ON public.accounts_payable (store_id, due_date, status);
CREATE INDEX IF NOT EXISTS accounts_receivable_store_id_due_date_status_idx ON public.accounts_receivable (store_id, due_date, status);
CREATE INDEX IF NOT EXISTS product_prices_list_id_product_variation_idx ON public.product_prices (price_list_id, product_id, product_variation_id);
CREATE INDEX IF NOT EXISTS audit_log_store_id_created_at_idx ON public.audit_log (store_id, created_at);
CREATE INDEX IF NOT EXISTS audit_log_entity_id_idx ON public.audit_log (entity_id);

-- Análise DEPOIS dos índices (espera-se o uso de Index Scan em vez de Seq Scan)
-- ...
--   ->  Index Scan using sales_store_id_created_at_idx on sales s ...
-- ...
