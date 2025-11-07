-- 1. Cria a função wrapper para acionar a sincronização de todas as lojas
CREATE OR REPLACE FUNCTION public.trigger_all_store_syncs()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    store_rec record;
    supabase_url TEXT := current_setting('app.supabase.url');
    service_role_key TEXT := current_setting('app.supabase.service_role_key'); -- Busca a chave do ambiente
BEGIN
    FOR store_rec IN SELECT id FROM public.stores WHERE active = true
    LOOP
        BEGIN
            PERFORM net.http_post(
                url:= supabase_url || '/functions/v1/pull-orders-from-ecommerce',
                headers:='{"Authorization": "Bearer ' || service_role_key || '", "Content-Type": "application/json"}',
                body:=jsonb_build_object('p_store_id', store_rec.id)
            );
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Falha ao sincronizar a loja %: %', store_rec.id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- 2. Agenda a função wrapper para rodar a cada 15 minutos
SELECT cron.schedule('sync-ecommerce-orders', '*/15 * * * *', $$
  SELECT public.trigger_all_store_syncs();
$$);
