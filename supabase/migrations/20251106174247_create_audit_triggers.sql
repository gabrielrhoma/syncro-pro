-- Função Genérica de Trigger para Log de Auditoria
CREATE OR REPLACE FUNCTION public.log_change_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_store_id UUID;
  v_changes_json JSONB;
BEGIN
  -- Determina o objeto a ser usado para extrair o store_id
  IF (TG_OP = 'DELETE') THEN
    v_store_id := OLD.store_id;
    v_changes_json := jsonb_build_object('old', to_jsonb(OLD));
  ELSE
    v_store_id := NEW.store_id;
    IF (TG_OP = 'INSERT') THEN
      v_changes_json := jsonb_build_object('new', to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
      v_changes_json := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    END IF;
  END IF;

  -- Insere o registro no log de auditoria
  INSERT INTO public.audit_log (user_id, store_id, action_type, entity_id, changes_json)
  VALUES (
    v_user_id,
    v_store_id,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    COALESCE(NEW.id, OLD.id),
    v_changes_json
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicação dos Triggers nas tabelas sensíveis
CREATE TRIGGER audit_products_trigger AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

CREATE TRIGGER audit_product_variations_trigger AFTER INSERT OR UPDATE OR DELETE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

CREATE TRIGGER audit_customers_trigger AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

CREATE TRIGGER audit_sales_trigger AFTER DELETE ON public.sales -- Apenas em DELETE, conforme solicitado
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

CREATE TRIGGER audit_coupons_trigger AFTER INSERT OR UPDATE OR DELETE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

CREATE TRIGGER audit_loyalty_rules_trigger AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_rules
  FOR EACH ROW EXECUTE FUNCTION public.log_change_trigger_function();

-- Adicione triggers para outras tabelas conforme necessário (suppliers, purchase_orders, etc.)
