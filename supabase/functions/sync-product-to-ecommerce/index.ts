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
    const { p_product_id, p_store_id } = await req.json();
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: conn } = await supabaseClient.from('ecommerce_connections').select('*').eq('store_id', p_store_id).single();
    if (!conn || !conn.active) throw new Error("Conexão e-commerce inativa ou não encontrada.");

    const { data: product } = await supabaseClient.from('products').select('*').eq('id', p_product_id).single();
    if (!product) throw new Error("Produto não encontrado.");

    const API_KEY = Deno.env.get(`${conn.platform.toUpperCase()}_API_KEY_${p_store_id}`);
    if (!API_KEY) throw new Error("Chave de API do e-commerce não configurada.");

    const payload = { /* Formatar o produto para a API externa */ };
    const method = product.external_ecommerce_id ? 'PUT' : 'POST';
    const url = product.external_ecommerce_id ? `${conn.api_url}/products/${product.external_ecommerce_id}` : `${conn.api_url}/products`;

    const response = await fetch(url, {
      method,
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error);

    await supabaseClient.from('products').update({ external_ecommerce_id: responseData.id }).eq('id', p_product_id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
