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
    const { saleData, customerData } = await req.json();

    // 1. Ler segredos do ambiente
    const FISCAL_API_KEY = Deno.env.get("FISCAL_API_KEY");
    const FISCAL_API_URL = Deno.env.get("FISCAL_API_URL");

    if (!FISCAL_API_KEY || !FISCAL_API_URL) {
      throw new Error("Credenciais da API fiscal não configuradas.");
    }

    // 2. Formatar o payload para a API fiscal (exemplo genérico)
    const payload = {
      // Estrutura do corpo da requisição conforme a documentação do provedor fiscal
      // Exemplo:
      // sale: saleData,
      // customer: customerData,
    };

    // 3. Realizar a chamada fetch
    const response = await fetch(`${FISCAL_API_URL}/nfce/emit`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FISCAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // A API fiscal deve retornar um JSON com a mensagem de erro detalhada
      throw new Error(responseData.error || "Erro desconhecido na API fiscal.");
    }

    // 4. Retornar a resposta de sucesso
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
