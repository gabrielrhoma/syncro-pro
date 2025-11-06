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

    const saleData = await req.json();

    if (!saleData.store_id) {
      return new Response(JSON.stringify({ error: 'Store ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: saleCreationData, error: creationError } = await supabaseClient.rpc('create_sale_and_emit_nfce', {
    const { data, error } = await supabaseClient.rpc('create_sale_and_emit_nfce', {
      p_user_id: user.id,
      p_customer_id: saleData.customer_id,
      p_payment_method: saleData.payment_method,
      p_cart_items: saleData.cart_items,
      p_cpf: saleData.cpf,
      p_store_id: saleData.store_id,
      p_contingency: saleData.contingency || false
    });

    if (creationError) throw new Error(creationError.message);

    if (saleData.contingency) {
      return new Response(JSON.stringify(saleCreationData), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { data: fiscalData, error: fiscalError } = await supabaseClient.functions.invoke('emit-nfce-production', {
        body: { saleData }, // Passar os dados necessários
      });

      if (fiscalError) throw fiscalError;

      await supabaseClient.from('sales').update({ fiscal_status: 'authorized', fiscal_document_id: fiscalData.id }).eq('id', saleCreationData.sale_id);
      return new Response(JSON.stringify({ ...saleCreationData, fiscal_status: 'authorized' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (e) {
      await supabaseClient.from('sales').update({ fiscal_status: 'error' }).eq('id', saleCreationData.sale_id);
      // Opcional: registrar a mensagem de erro em `fiscal_documents`
      return new Response(JSON.stringify({ ...saleCreationData, fiscal_status: 'error', error_message: e.message }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
      p_cpf: saleData.cpf
    });

    if (error) {
      console.error('Error creating sale:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});