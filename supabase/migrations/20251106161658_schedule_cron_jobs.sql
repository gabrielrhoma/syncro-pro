-- Agendamento das tarefas noturnas para rodar diariamente às 3h da manhã (UTC)
SELECT cron.schedule(
  'nightly-maintenance-tasks',
  '0 3 * * *',
  $$
    SELECT public.update_overdue_invoices();
    SELECT public.check_low_stock_all_stores();
    SELECT public.generate_daily_summaries();
  $$
);
