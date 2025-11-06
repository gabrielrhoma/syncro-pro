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
    const { p_store_id } = await req.json();
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: conn } = await supabaseClient.from('ecommerce_connections').select('*').eq('store_id', p_store_id).single();
    if (!conn || !conn.active) throw new Error("Conexão e-commerce inativa ou não encontrada.");

    const API_KEY = Deno.env.get(`${conn.platform.toUpperCase()}_API_KEY_${p_store_id}`);
    if (!API_KEY) throw new Error("Chave de API do e-commerce não configurada.");

    const response = await fetch(`${conn.api_url}/orders?since=${conn.last_sync || ''}`, {
      headers: { "Authorization": `Bearer ${API_KEY}` },
    });
    const orders = await response.json();

    for (const order of orders) {
      const { data: existingSale } = await supabaseClient.from('sales').select('id').eq('ecommerce_order_id', order.id).single();
      if (existingSale) continue;

      let allSkusExist = true;
      for (const item of order.line_items) {
        const { data: product } = await supabaseClient.from('products').select('id').or(`sku.eq.${item.sku},barcode.eq.${item.sku}`).single();
        if (!product) {
          allSkusExist = false;
          await supabaseClient.from('system_alerts').insert({
            store_id: p_store_id,
            type: 'ecommerce_sync_error',
            message: `Falha ao importar Pedido E-commerce #${order.id}. SKU '${item.sku}' não encontrado no ERP.`
          });
          break;
        }
      }
      if (!allSkusExist) continue;

      // Lógica para encontrar/criar cliente...

      await supabaseClient.rpc('create_sale_and_emit_nfce', {
        p_store_id: p_store_id,
        p_contingency: true, // Importar sem emitir NFC-e
        /* ... mapear o restante dos dados do pedido ... */
      });
    }

    await supabaseClient.from('ecommerce_connections').update({ last_sync: new Date().toISOString() }).eq('id', conn.id);

    return new Response(JSON.stringify({ success: true, imported_count: orders.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
