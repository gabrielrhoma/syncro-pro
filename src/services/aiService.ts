import { supabase } from "@/integrations/supabase/client";

export class AIService {
  private static readonly CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

  /**
   * Gera insights de IA para o dashboard
   */
  static async generateDashboardInsights(data: {
    salesData: Array<{ day: string; vendas: number }>;
    topProducts: Array<{ produto: string; vendas: number }>;
    lowStockProducts: string[];
  }): Promise<string> {
    try {
      const prompt = `Você é um assistente de gestão para um dono de varejo. Com base nos dados:

Vendas últimos 7 dias: ${JSON.stringify(data.salesData)}
Top 5 Produtos: ${JSON.stringify(data.topProducts)}
Produtos com Estoque Baixo: ${data.lowStockProducts.join(', ') || 'Nenhum'}

Qual é o único insight acionável mais importante que eu devo saber hoje? Responda em até 2 frases.`;

      const response = await fetch(this.CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: prompt,
          type: 'chat'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao chamar IA');
      }

      const result = await response.json();
      return result.reply || "Não foi possível gerar insights no momento.";
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
      return "Erro ao conectar com a IA. Tente novamente mais tarde.";
    }
  }

  /**
   * Gera descrição de produto com IA
   */
  static async generateProductDescription(productName: string, category?: string): Promise<string> {
    try {
      const prompt = `Crie uma descrição de produto para e-commerce, curta e otimizada para SEO (máx 150 caracteres), para o produto: '${productName}'${category ? ` da categoria '${category}'` : ''}.`;

      const response = await fetch(this.CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: prompt,
          type: 'chat'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao chamar IA');
      }

      const result = await response.json();
      return result.reply || "Descrição não disponível.";
    } catch (error) {
      console.error("Erro ao gerar descrição:", error);
      return "Erro ao gerar descrição. Tente novamente.";
    }
  }

  /**
   * Analisa diferença de caixa com IA
   */
  static async analyzeCashDifference(difference: number, notes: string): Promise<string> {
    try {
      const prompt = `Um caixa fechou com uma diferença de R$ ${difference.toFixed(2)}. A nota do operador foi: "${notes}". Resuma a causa provável em no máximo 5 palavras (ex: 'Provável erro de troco', 'Sangria não registrada').`;

      const response = await fetch(this.CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: prompt,
          type: 'chat'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao chamar IA');
      }

      const result = await response.json();
      return result.reply || "Análise não disponível";
    } catch (error) {
      console.error("Erro ao analisar diferença:", error);
      return "Erro na análise";
    }
  }
}