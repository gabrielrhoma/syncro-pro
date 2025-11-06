CREATE TYPE cart_item AS (
    product_id UUID,
    quantity INTEGER,
    unit_price NUMERIC,
    subtotal NUMERIC
);

CREATE OR REPLACE FUNCTION public.create_sale_and_emit_nfce(
    p_user_id UUID,
    p_customer_id UUID,
    p_payment_method TEXT,
    p_cart_items cart_item[],
    p_cpf TEXT
)
RETURNS JSON AS $$
DECLARE
  v_sale_id UUID;
  v_total_amount NUMERIC := 0;
  item cart_item;
  v_fiscal_status TEXT := 'pending';
  v_fiscal_document_id UUID;
  v_danfe_url TEXT;
  v_sale_data JSON;
BEGIN
  -- 1. Calcular o valor total da venda
  FOREACH item IN ARRAY p_cart_items
  LOOP
    v_total_amount := v_total_amount + item.subtotal;
  END LOOP;

  -- 2. Criar o registro na tabela sales
  INSERT INTO public.sales (
    sale_number,
    customer_id,
    total_amount,
    final_amount,
    payment_method,
    cashier_id,
    fiscal_status
  )
  VALUES (
    'V-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    p_customer_id,
    v_total_amount,
    v_total_amount,
    p_payment_method,
    p_user_id,
    'pending'
  )
  RETURNING id INTO v_sale_id;

  -- 3. Inserir os itens da venda
  FOREACH item IN ARRAY p_cart_items
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, item.product_id, item.quantity, item.unit_price, item.subtotal);
  END LOOP;

  -- 4. Simular a chamada para a API Fiscal (substituir pela chamada real)
  -- Lógica de simulação: se o total for maior que 100, simula sucesso. Senão, simula erro.
  IF v_total_amount > 100 THEN
    v_fiscal_status := 'authorized';
    v_danfe_url := 'https://danfe.exemplo.com/' || v_sale_id::TEXT;

    INSERT INTO public.fiscal_documents (sale_id, type, status, danfe_url)
    VALUES (v_sale_id, 'nfc-e', 'authorized', v_danfe_url)
    RETURNING id INTO v_fiscal_document_id;
  ELSE
    v_fiscal_status := 'error';
    INSERT INTO public.fiscal_documents (sale_id, type, status, error_message)
    VALUES (v_sale_id, 'nfc-e', 'error', 'Erro de comunicação com a SEFAZ (simulado)')
    RETURNING id INTO v_fiscal_document_id;
  END IF;

  -- 5. Atualizar a venda com o status fiscal
  UPDATE public.sales
  SET fiscal_status = v_fiscal_status,
      fiscal_document_id = v_fiscal_document_id
  WHERE id = v_sale_id;

  -- 6. Retornar os dados da venda, incluindo o status fiscal e a URL do DANFE
  SELECT json_build_object(
    'sale_id', s.id,
    'fiscal_status', s.fiscal_status,
    'danfe_url', fd.danfe_url
  )
  INTO v_sale_data
  FROM public.sales s
  LEFT JOIN public.fiscal_documents fd ON s.fiscal_document_id = fd.id
  WHERE s.id = v_sale_id;

  RETURN v_sale_data;
END;
$$ LANGUAGE plpgsql;
