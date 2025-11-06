-- Remove o agendamento antigo para evitar duplicatas
SELECT cron.unschedule('nightly-tasks');

-- Recria o agendamento com a nova função de análise de IA
SELECT cron.schedule(
  'nightly-tasks',
  '0 3 * * *', -- Executa todo dia às 3h da manhã (UTC)
  $$
    SELECT public.update_overdue_invoices();
    SELECT public.check_low_stock_all_stores();
    SELECT public.generate_daily_summaries();
    SELECT public.run_proactive_ai_analysis();
  $$
);
