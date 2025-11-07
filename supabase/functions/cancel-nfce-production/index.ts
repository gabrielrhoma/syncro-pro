import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fiscal_document_id, reason } = await req.json();

    const FISCAL_API_KEY = Deno.env.get("FISCAL_API_KEY");
    const FISCAL_API_URL = Deno.env.get("FISCAL_API_URL");

    if (!FISCAL_API_KEY || !FISCAL_API_URL) {
      throw new Error("Credenciais da API fiscal não configuradas.");
    }

    const payload = {
      reason: reason,
    };

    const response = await fetch(`${FISCAL_API_URL}/nfce/${fiscal_document_id}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FISCAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || "Erro ao cancelar NFC-e na API fiscal.");
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
