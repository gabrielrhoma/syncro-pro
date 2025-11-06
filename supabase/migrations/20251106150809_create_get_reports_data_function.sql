CREATE OR REPLACE FUNCTION public.get_reports_data_logic(
    p_user_id UUID,
    p_store_id UUID,
    p_date_from TIMESTAMPTZ,
    p_date_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_reports_data JSON;
BEGIN
  IF NOT is_member_of_store(p_user_id, p_store_id) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para esta loja.';
  END IF;

  SELECT json_build_object(
    'financial_summary', (SELECT json_build_object(
        'totalRevenue', COALESCE(SUM(final_amount), 0),
        'totalCost', COALESCE((SELECT SUM(si.quantity * p.cost_price) FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = s.id), 0),
        'totalExpenses', (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.type = 'expense' AND t.transaction_date BETWEEN p_date_from AND p_date_to)
      ) FROM sales s WHERE s.store_id = p_store_id AND s.created_at BETWEEN p_date_from AND p_date_to),

    'top_products', (SELECT json_agg(p) FROM (
      SELECT p.name AS product_name, SUM(si.quantity) AS total_quantity, SUM(si.subtotal) AS total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.store_id = p_store_id AND s.created_at BETWEEN p_date_from AND p_date_to
      GROUP BY p.name ORDER BY total_revenue DESC LIMIT 10
    ) p),

    'category_sales', (SELECT json_agg(c) FROM (
      SELECT c.name AS category_name, SUM(si.subtotal) AS total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.store_id = p_store_id AND s.created_at BETWEEN p_date_from AND p_date_to
      GROUP BY c.name ORDER BY total_revenue DESC
    ) c),

    'top_customers', (SELECT json_agg(cust) FROM (
      SELECT c.name AS customer_name, COUNT(s.id) AS total_purchases, SUM(s.final_amount) AS total_spent
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.store_id = p_store_id AND s.created_at BETWEEN p_date_from AND p_date_to
      GROUP BY c.name ORDER BY total_spent DESC LIMIT 10
    ) cust)
  )
  INTO v_reports_data;

  RETURN v_reports_data;
END;
$$ LANGUAGE plpgsql;
