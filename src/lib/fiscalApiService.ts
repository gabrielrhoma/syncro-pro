import { supabase } from "@/integrations/supabase/client";

interface SaleData {
  id: string;
  sale_number: string;
  final_amount: number;
  payment_method: string;
  customer_id?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

interface EmitNFCeResponse {
  success: boolean;
  protocol?: string;
  xml_data?: string;
  danfe_url?: string;
  error_message?: string;
}

export class FiscalApiService {
  /**
   * Emite uma NFC-e para uma venda
   * Esta é uma implementação de exemplo. Em produção, você deve integrar com
   * uma API fiscal real (ex: PlugNotas, Focus NFe, etc.)
   */
  static async emitNFCe(saleData: SaleData, customerCpf?: string): Promise<EmitNFCeResponse> {
    try {
      // Verificar se as configurações fiscais estão habilitadas
      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (!settings || !settings.cnpj) {
        return {
          success: false,
          error_message: "Configurações fiscais não encontradas. Configure em Configurações > Fiscal.",
        };
      }

      // Simular emissão (em produção, chamar API fiscal externa)
      // Em produção, você faria algo como:
      // const response = await fetch('https://api.plugnotas.com.br/nfce', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      //   body: JSON.stringify({ ... dados da nota ... })
      // });

      // Para desenvolvimento/demonstração, retornamos sucesso simulado
      const mockProtocol = `PROT${Date.now()}`;
      const mockXml = `<?xml version="1.0"?><NFCe><numero>${saleData.sale_number}</numero></NFCe>`;
      const mockDanfeUrl = `https://example.com/danfe/${saleData.id}`;

      return {
        success: true,
        protocol: mockProtocol,
        xml_data: mockXml,
        danfe_url: mockDanfeUrl,
      };
    } catch (error) {
      console.error("Erro ao emitir NFC-e:", error);
      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Erro desconhecido ao emitir NFC-e",
      };
    }
  }

  /**
   * Cancela uma NFC-e já emitida
   */
  static async cancelNFCe(fiscalDocumentId: string, justification: string): Promise<EmitNFCeResponse> {
    try {
      const { data: fiscalDoc } = await supabase
        .from('fiscal_documents')
        .select('*')
        .eq('id', fiscalDocumentId)
        .single();

      if (!fiscalDoc) {
        return {
          success: false,
          error_message: "Documento fiscal não encontrado",
        };
      }

      if (fiscalDoc.status !== 'authorized') {
        return {
          success: false,
          error_message: "Apenas documentos autorizados podem ser cancelados",
        };
      }

      // Em produção, chamar API fiscal para cancelamento
      // const response = await fetch(`https://api.plugnotas.com.br/nfce/${fiscalDoc.sefaz_protocol}/cancel`, ...);

      // Simular cancelamento
      await supabase
        .from('fiscal_documents')
        .update({ status: 'cancelled' })
        .eq('id', fiscalDocumentId);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Erro ao cancelar NFC-e:", error);
      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Erro desconhecido ao cancelar NFC-e",
      };
    }
  }

  /**
   * Consulta o status de um documento fiscal
   */
  static async checkStatus(fiscalDocumentId: string): Promise<{ status: string; message?: string }> {
    try {
      const { data: fiscalDoc } = await supabase
        .from('fiscal_documents')
        .select('status, error_message')
        .eq('id', fiscalDocumentId)
        .single();

      if (!fiscalDoc) {
        return { status: 'not_found', message: 'Documento não encontrado' };
      }

      return {
        status: fiscalDoc.status,
        message: fiscalDoc.error_message || undefined,
      };
    } catch (error) {
      console.error("Erro ao consultar status:", error);
      return { status: 'error', message: 'Erro ao consultar status' };
    }
  }
}