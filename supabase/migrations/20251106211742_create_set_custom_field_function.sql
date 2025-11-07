CREATE OR REPLACE FUNCTION public.set_custom_field(
    p_table_name TEXT,
    p_entity_id UUID,
    p_field_name TEXT,
    p_value JSONB
)
RETURNS VOID AS $$
DECLARE
  v_field_def record;
  v_store_id UUID;
BEGIN
  -- 1. Verifica a permissão do usuário
  EXECUTE format('SELECT store_id FROM public.%I WHERE id = %L', p_table_name, p_entity_id) INTO v_store_id;
  IF NOT is_member_of_store(auth.uid(), v_store_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para editar esta entidade.';
  END IF;

  -- 2. Busca a definição e valida o tipo do campo
  SELECT * INTO v_field_def FROM public.custom_field_definitions
  WHERE applies_to_table = p_table_name AND field_name = p_field_name AND store_id = v_store_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Definição de campo customizável não encontrada.';
  END IF;

  -- Lógica de validação de tipo completa
  CASE v_field_def.field_type
    WHEN 'number' THEN IF jsonb_typeof(p_value) <> 'number' THEN RAISE EXCEPTION 'Valor inválido. Esperado um número.'; END IF;
    WHEN 'text' THEN IF jsonb_typeof(p_value) <> 'string' THEN RAISE EXCEPTION 'Valor inválido. Esperado um texto.'; END IF;
    WHEN 'boolean' THEN IF jsonb_typeof(p_value) <> 'boolean' THEN RAISE EXCEPTION 'Valor inválido. Esperado um booleano.'; END IF;
    WHEN 'date' THEN
      -- Tenta converter para data para validar o formato
      BEGIN PERFORM p_value::text::date; EXCEPTION WHEN others THEN RAISE EXCEPTION 'Valor inválido. Esperado uma data no formato YYYY-MM-DD.'; END;
    -- Adicionar outros tipos, como 'select', se necessário
    ELSE -- não faz nada
  END CASE;

  -- 3. Atualiza o campo JSONB usando SQL dinâmico
  EXECUTE format(
    'UPDATE public.%I SET custom_fields = jsonb_set(COALESCE(custom_fields, ''{}''::jsonb), ARRAY[%L], %L::jsonb) WHERE id = %L',
    p_table_name,
    p_field_name,
    p_value,
    p_entity_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
