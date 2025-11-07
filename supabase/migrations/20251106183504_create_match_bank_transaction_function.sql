CREATE OR REPLACE FUNCTION public.match_bank_transaction_logic(
    p_user_id UUID,
    p_statement_line_id UUID,
    p_entity_id UUID,
    p_entity_type TEXT,
    p_store_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_statement_line record;
  v_entity record;
  v_transaction_type TEXT;
BEGIN
  IF NOT (has_role(p_user_id, 'admin') OR has_role(p_user_id, 'manager')) THEN
    RAISE EXCEPTION 'Apenas administradores ou gerentes podem conciliar transações.';
  END IF;

  SELECT * INTO v_statement_line FROM public.bank_statement_lines WHERE id = p_statement_line_id AND store_id = p_store_id FOR UPDATE;
  IF NOT FOUND OR v_statement_line.is_reconciled THEN
    RAISE EXCEPTION 'Linha de extrato não encontrada, já conciliada ou pertence a outra loja.';
  END IF;

  IF p_entity_type = 'payable' THEN
    SELECT * INTO v_entity FROM public.accounts_payable WHERE id = p_entity_id;
    v_transaction_type := 'expense';
    IF v_statement_line.amount <> -v_entity.amount THEN
      RAISE EXCEPTION 'O valor do extrato não corresponde ao valor da conta a pagar.';
    END IF;
    UPDATE public.accounts_payable SET status = 'paid', payment_date = now() WHERE id = p_entity_id;
    UPDATE public.bank_statement_lines SET is_reconciled = true, payable_id = p_entity_id WHERE id = p_statement_line_id;
  ELSIF p_entity_type = 'receivable' THEN
    SELECT * INTO v_entity FROM public.accounts_receivable WHERE id = p_entity_id;
    v_transaction_type := 'income';
    IF v_statement_line.amount <> v_entity.amount THEN
      RAISE EXCEPTION 'O valor do extrato não corresponde ao valor da conta a receber.';
    END IF;
    UPDATE public.accounts_receivable SET status = 'paid', payment_date = now() WHERE id = p_entity_id;
    UPDATE public.bank_statement_lines SET is_reconciled = true, receivable_id = p_entity_id WHERE id = p_statement_line_id;
  ELSE
    RAISE EXCEPTION 'Tipo de entidade inválido. Use "payable" ou "receivable".';
  END IF;

  -- Gera a transação financeira
  INSERT INTO public.transactions (type, category, description, amount, payment_method, created_by)
  VALUES (v_transaction_type, 'Conciliação Bancária', 'Conciliação da linha de extrato ' || v_statement_line.description, ABS(v_statement_line.amount), 'conciliacao_bancaria', p_user_id);
END;
$$ LANGUAGE plpgsql;
