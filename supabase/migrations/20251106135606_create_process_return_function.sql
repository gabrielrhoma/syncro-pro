CREATE TYPE return_item AS (
    product_id UUID,
    quantity INTEGER
);

CREATE OR REPLACE FUNCTION public.process_return_logic(
    p_user_id UUID,
    p_sale_id UUID,
    p_items_to_return return_item[],
    p_refund_method TEXT
)
RETURNS VOID AS $$
DECLARE
  v_total_refund_amount NUMERIC := 0;
  item return_item;
  v_sale_item record;
  v_customer_id UUID;
BEGIN
  -- 1. Calcular o valor total do reembolso e restabelecer o estoque
  FOREACH item IN ARRAY p_items_to_return
  LOOP
    SELECT * INTO v_sale_item
    FROM public.sale_items
    WHERE sale_id = p_sale_id AND product_id = item.product_id;

    IF v_sale_item IS NULL THEN
      RAISE EXCEPTION 'Item de venda não encontrado para o produto ID %', item.product_id;
    END IF;

    v_total_refund_amount := v_total_refund_amount + (v_sale_item.unit_price * item.quantity);

    UPDATE public.products
    SET stock_quantity = stock_quantity + item.quantity
    WHERE id = item.product_id;
  END LOOP;

  -- 2. Processar o reembolso
  IF p_refund_method = 'cash' THEN
    INSERT INTO public.transactions (
      type,
      category,
      description,
      amount,
      created_by
    ) VALUES (
      'expense',
      'Devolução',
      'Reembolso em dinheiro para a venda ID ' || p_sale_id,
      v_total_refund_amount,
      p_user_id
    );
  ELSIF p_refund_method = 'store_credit' THEN
    SELECT customer_id INTO v_customer_id FROM public.sales WHERE id = p_sale_id;
    IF v_customer_id IS NULL THEN
      RAISE EXCEPTION 'A venda não está associada a um cliente para gerar crédito em loja.';
    END IF;

    INSERT INTO public.customer_store_credit (customer_id, balance)
    VALUES (v_customer_id, v_total_refund_amount)
    ON CONFLICT (customer_id) DO UPDATE
    SET balance = customer_store_credit.balance + v_total_refund_amount;
  END IF;

END;
$$ LANGUAGE plpgsql;
