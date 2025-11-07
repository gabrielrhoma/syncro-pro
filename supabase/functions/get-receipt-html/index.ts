import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { p_sale_id } = await req.json();
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    const { data: sale } = await supabaseClient
      .from('sales')
      .select('*, store:stores(name), customer:customers(name), sale_items(*, product:products(name))')
      .eq('id', p_sale_id)
      .single();

    if (!sale) throw new Error("Venda não encontrada.");

    let itemsHtml = '';
    for (const item of sale.sale_items) {
      itemsHtml += `<tr><td>${item.product.name}</td><td>${item.quantity}</td><td>${item.unit_price.toFixed(2)}</td><td>${item.subtotal.toFixed(2)}</td></tr>`;
    }

    const html = `
      <div style="font-family: monospace; width: 300px;">
        <h2>${sale.store.name}</h2>
        <p>Recibo de Venda</p>
        <p>Cliente: ${sale.customer ? sale.customer.name : 'N/A'}</p>
        <hr/>
        <table>
          <thead><tr><th>Item</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <hr/>
        <p>Total: R$ ${sale.final_amount.toFixed(2)}</p>
      </div>
    `;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
});
