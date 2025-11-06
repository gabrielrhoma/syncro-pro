-- Função para atualizar status de faturas vencidas e criar alertas
CREATE OR REPLACE FUNCTION public.update_overdue_invoices()
RETURNS VOID AS $$
DECLARE
  invoice record;
BEGIN
  -- Contas a Pagar
  FOR invoice IN
    UPDATE public.accounts_payable
    SET status = 'overdue'
    WHERE due_date < now() AND status = 'pending'
    RETURNING id, store_id
  LOOP
    INSERT INTO public.system_alerts (store_id, type, message, related_entity_id)
    VALUES (invoice.store_id, 'invoice_overdue', 'A conta a pagar #' || invoice.id || ' está vencida.', invoice.id);
  END LOOP;

  -- Contas a Receber
  FOR invoice IN
    UPDATE public.accounts_receivable
    SET status = 'overdue'
    WHERE due_date < now() AND status = 'pending'
    RETURNING id, store_id
  LOOP
    INSERT INTO public.system_alerts (store_id, type, message, related_entity_id)
    VALUES (invoice.store_id, 'invoice_overdue', 'A conta a receber #' || invoice.id || ' está vencida.', invoice.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar estoque baixo em todas as lojas
CREATE OR REPLACE FUNCTION public.check_low_stock_all_stores()
RETURNS VOID AS $$
DECLARE
  low_stock_item record;
BEGIN
  -- Produtos Simples
  FOR low_stock_item IN
    SELECT id, name, stock_quantity, min_stock, store_id
    FROM public.products
    WHERE stock_quantity < min_stock AND active = true
  LOOP
    INSERT INTO public.system_alerts (store_id, type, message, related_entity_id)
    VALUES (low_stock_item.store_id, 'low_stock', 'O produto "' || low_stock_item.name || '" está com estoque baixo (' || low_stock_item.stock_quantity || '/' || low_stock_item.min_stock || ').', low_stock_item.id);
  END LOOP;

  -- Variações de Produtos
  FOR low_stock_item IN
    SELECT v.id, v.sku, v.stock_quantity, p.min_stock, v.store_id
    FROM public.product_variations v
    JOIN public.products p ON v.product_id = p.id
    WHERE v.stock_quantity < p.min_stock
  LOOP
    INSERT INTO public.system_alerts (store_id, type, message, related_entity_id)
    VALUES (low_stock_item.store_id, 'low_stock', 'A variação "' || low_stock_item.sku || '" está com estoque baixo (' || low_stock_item.stock_quantity || '/' || low_stock_item.min_stock || ').', low_stock_item.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar resumos financeiros diários
CREATE OR REPLACE FUNCTION public.generate_daily_summaries()
RETURNS VOID AS $$
DECLARE
  store_record record;
  report_data JSONB;
BEGIN
  FOR store_record IN SELECT id FROM public.stores
  LOOP
    -- Supabase RPC não permite chamar com o mesmo usuário, então precisamos simular a chamada ou refatorar
    -- Por simplicidade aqui, vamos chamar a função de lógica diretamente.
    -- O ideal seria ter uma versão da get_reports_data_logic que não dependa de auth.uid() para ser chamada internamente.
    -- Vamos assumir que a get_reports_data_logic pode ser chamada com um user_id de um admin.

    -- Esta implementação é um placeholder e precisa de um usuário admin para funcionar.
    -- SELECT public.get_reports_data_logic((SELECT id FROM auth.users LIMIT 1), store_record.id, date_trunc('day', now() - interval '1 day'), date_trunc('day', now()) - interval '1 second')
    -- INTO report_data;

    -- INSERT INTO public.daily_financial_summary (store_id, summary_date, data)
    -- VALUES (store_record.id, (now() - interval '1 day')::date, report_data);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
