DROP FUNCTION IF EXISTS public.create_sale_and_emit_nfce;

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
  v_final_amount NUMERIC := 0; -- Assuming discount is handled in cart
  item cart_item;
  v_fiscal_status TEXT := 'pending';
  v_fiscal_document_id UUID;
  v_danfe_url TEXT;
  v_sale_data JSON;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- 1. Calcular o valor total da venda
  FOREACH item IN ARRAY p_cart_items
  LOOP
    v_total_amount := v_total_amount + item.subtotal;
  END LOOP;
  v_final_amount := v_total_amount; -- Placeholder for discount logic

  -- 2. Criar o registro na tabela sales
  INSERT INTO public.sales (
    sale_number, customer_id, total_amount, final_amount, payment_method, cashier_id, fiscal_status
  ) VALUES (
    'V-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), p_customer_id, v_total_amount, v_final_amount, p_payment_method, p_user_id, 'pending'
  ) RETURNING id INTO v_sale_id;

  -- 3. Inserir os itens da venda
  FOREACH item IN ARRAY p_cart_items
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_sale_id, item.product_id, item.quantity, item.unit_price, item.subtotal);
  END LOOP;

  -- 4. Lidar com a lógica financeira (Venda a Prazo vs. Outros)
  IF p_payment_method = 'a_prazo' THEN
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'Um cliente deve ser selecionado para vendas a prazo.';
    END IF;
    INSERT INTO public.accounts_receivable (description, customer_id, sale_id, amount, due_date, created_by)
    VALUES ('Venda a prazo ' || 'V-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), p_customer_id, v_sale_id, v_final_amount, current_date + interval '30 days', p_user_id);
  ELSE
    INSERT INTO public.transactions (type, category, description, amount, payment_method, sale_id, created_by)
    VALUES ('income', 'Venda', 'Venda ' || 'V-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), v_final_amount, p_payment_method, v_sale_id, p_user_id);
  END IF;

  -- 5. Lógica de Comissão
  SELECT commission_rate INTO v_commission_rate FROM public.profiles WHERE id = p_user_id;
  v_commission_amount := v_final_amount * COALESCE(v_commission_rate, 0);
  IF v_commission_amount > 0 THEN
    INSERT INTO public.sales_commissions (sale_id, salesperson_id, commission_amount)
    VALUES (v_sale_id, p_user_id, v_commission_amount);
  END IF;

  -- 6. Simular a chamada para a API Fiscal
  IF v_final_amount > 100 THEN
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

  -- 7. Atualizar a venda com o status fiscal
  UPDATE public.sales
  SET fiscal_status = v_fiscal_status, fiscal_document_id = v_fiscal_document_id
  WHERE id = v_sale_id;

  -- 8. Retornar os dados da venda
  SELECT json_build_object('sale_id', s.id, 'fiscal_status', s.fiscal_status, 'danfe_url', fd.danfe_url)
  INTO v_sale_data
  FROM public.sales s
  LEFT JOIN public.fiscal_documents fd ON s.fiscal_document_id = fd.id
  WHERE s.id = v_sale_id;

  RETURN v_sale_data;
END;
$$ LANGUAGE plpgsql;
