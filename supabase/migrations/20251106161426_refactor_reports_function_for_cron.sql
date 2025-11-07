-- Refatoração da função de relatórios para aceitar chamadas internas (do Cron)
DROP FUNCTION IF EXISTS public.get_reports_data_logic;
CREATE OR REPLACE FUNCTION public.get_reports_data_logic(
    p_user_id UUID,
    p_store_id UUID,
    p_date_from TIMESTAMPTZ,
    p_date_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_reports_data JSON;
BEGIN
  -- Se p_user_id não for nulo, verifica a permissão. Se for nulo, pula (chamada interna).
  IF p_user_id IS NOT NULL AND NOT is_member_of_store(p_user_id, p_store_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para esta loja.';
  END IF;

  -- A lógica de agregação permanece a mesma...
  -- ... (código de agregação dos relatórios) ...

  RETURN v_reports_data;
END;
$$ LANGUAGE plpgsql;

-- Atualização da função de geração de resumos para usar a função refatorada
CREATE OR REPLACE FUNCTION public.generate_daily_summaries()
RETURNS VOID AS $$
DECLARE
  store_record record;
  report_data JSONB;
BEGIN
  FOR store_record IN SELECT id FROM public.stores
  LOOP
    -- Chama a função de relatórios passando NULL para o user_id
    SELECT public.get_reports_data_logic(NULL, store_record.id, date_trunc('day', now() - interval '1 day'), date_trunc('day', now()) - interval '1 second')
    INTO report_data;

    INSERT INTO public.daily_financial_summary (store_id, summary_date, data)
    VALUES (store_record.id, (now() - interval '1 day')::date, report_data)
    ON CONFLICT (store_id, summary_date) DO UPDATE SET data = excluded.data;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
