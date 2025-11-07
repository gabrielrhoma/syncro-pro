import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sale_id, reason } = await req.json();

    if (!sale_id || !reason) {
      return new Response(JSON.stringify({ error: 'Sale ID and reason are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Primeiro, chama a função de produção para cancelar na API fiscal
    const { error: fiscalError } = await supabaseClient.functions.invoke('cancel-nfce-production', {
      body: { sale_id, reason }, // Supondo que a função precise do sale_id
    });

    if (fiscalError) {
      throw new Error(`Erro na API Fiscal: ${fiscalError.message}`);
    }

    // Se o cancelamento fiscal foi bem-sucedido, atualiza o banco de dados
    const { error: dbError } = await supabaseClient.rpc('cancel_nfce', {
      p_sale_id: sale_id,
      p_reason: reason,
    });

    if (dbError) {
      // Isso indica uma inconsistência que pode precisar de tratamento manual
      throw new Error(`Cancelado na API fiscal, mas falhou ao atualizar o banco de dados: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ message: 'NFC-e cancelada com sucesso.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Error cancelling NFC-e:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});