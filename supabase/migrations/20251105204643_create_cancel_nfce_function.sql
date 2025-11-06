CREATE OR REPLACE FUNCTION public.cancel_nfce(p_sale_id UUID, p_reason TEXT)
RETURNS VOID AS $$
DECLARE
  v_sale record;
BEGIN
  -- 1. Verificar se a venda existe e se pode ser cancelada
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id;

  IF v_sale IS NULL THEN
    RAISE EXCEPTION 'Venda não encontrada.';
  END IF;

  IF v_sale.fiscal_status <> 'authorized' THEN
    RAISE EXCEPTION 'Apenas vendas com status fiscal autorizado podem ser canceladas.';
  END IF;

  -- 2. Simular a chamada ao FiscalApiService.cancelNFCe
  -- (A lógica real de comunicação com a API fiscal entraria aqui)
  -- Se a API fiscal retornar erro, a exceção interromperia a transação.

  -- 3. Atualizar o status fiscal da venda
  UPDATE public.sales
  SET fiscal_status = 'cancelled'
  WHERE id = p_sale_id;

  -- 4. Atualizar o status do documento fiscal
  UPDATE public.fiscal_documents
  SET status = 'cancelled'
  WHERE id = v_sale.fiscal_document_id;

END;
$$ LANGUAGE plpgsql;
