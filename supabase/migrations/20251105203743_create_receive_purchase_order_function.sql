CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_purchase_order_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_purchase_order record;
  v_supplier_id UUID;
  v_total_amount NUMERIC;
  item record;
BEGIN
  -- 1. Obter os detalhes da ordem de compra
  SELECT * INTO v_purchase_order
  FROM public.purchase_orders
  WHERE id = p_purchase_order_id;

  -- 2. Verificar se a ordem existe e se está com o status correto
  IF v_purchase_order IS NULL THEN
    RAISE EXCEPTION 'Ordem de compra não encontrada.';
  END IF;

  IF v_purchase_order.status NOT IN ('approved', 'sent') THEN
    RAISE EXCEPTION 'A ordem de compra não pode ser recebida, pois seu status é %', v_purchase_order.status;
  END IF;

  -- 3. Iterar pelos itens da ordem e atualizar o estoque
  FOR item IN
    SELECT product_id, quantity
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_purchase_order_id
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity + item.quantity
    WHERE id = item.product_id;
  END LOOP;

  -- 4. Gerar a conta a pagar
  INSERT INTO public.accounts_payable (
    description,
    supplier_id,
    purchase_order_id,
    amount,
    due_date,
    created_by
  )
  VALUES (
    'Referente à Ordem de Compra #' || v_purchase_order.order_number,
    v_purchase_order.supplier_id,
    p_purchase_order_id,
    v_purchase_order.total_amount,
    current_date + interval '30 days',
    p_user_id
  );

  -- 5. Atualizar o status da ordem de compra
  UPDATE public.purchase_orders
  SET status = 'received',
      received_date = now()
  WHERE id = p_purchase_order_id;

END;
$$ LANGUAGE plpgsql;
