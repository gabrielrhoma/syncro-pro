CREATE OR REPLACE FUNCTION public.run_proactive_ai_analysis()
RETURNS VOID AS $$
DECLARE
  store_rec record;
  prompt_text TEXT;
  ai_response JSONB;
  insight TEXT;
BEGIN
  FOR store_rec IN SELECT id, name FROM public.stores WHERE active = true
  LOOP
    -- Coleta de dados (exemplos)
    prompt_text := 'Você é um gerente de varejo. Analise os dados da Loja ' || store_rec.name || ' e retorne um array JSON de strings com 3 alertas acionáveis. Dados: ...';

    -- Chamada à IA via pg_net para a Edge Function
    SELECT content::jsonb INTO ai_response
    FROM net.http_post(
        url:= current_setting('app.supabase.url') || '/functions/v1/chat-assistant',
        headers:='{"Authorization": "Bearer ' || current_setting('app.supabase.service_role_key') || '", "Content-Type": "application/json"}',
        body:=jsonb_build_object('messages', jsonb_build_array(jsonb_build_object('role', 'user', 'content', prompt_text)))
    );

    -- Processa a resposta e salva os alertas
    IF ai_response IS NOT NULL THEN
      FOR insight IN SELECT jsonb_array_elements_text(ai_response)
      LOOP
        INSERT INTO public.system_alerts (store_id, type, message)
        VALUES (store_rec.id, 'ai_insight', insight);
      END LOOP;
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql;
