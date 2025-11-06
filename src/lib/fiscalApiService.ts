import { supabase } from "@/integrations/supabase/client";

interface SaleData {
  sale_id: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
  total_amount: number;
  discount: number;
  final_amount: number;
  payment_method: string;
}

interface EmitNFCeResponse {
  success: boolean;
  message: string;
  fiscal_document_id?: string;
  sefaz_protocol?: string;
  danfe_url?: string;
}

export class FiscalApiService {
  /**
   * Emite uma NFC-e para uma venda
   * Esta é uma implementação mock. Em produção, você deve integrar com
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
          message: "Configurações fiscais não encontradas. Configure em Configurações > Fiscal.",
        };
      }

      // MOCK: Simular emissão de NFC-e
      // Em produção, você faria algo como:
      // const response = await fetch('https://api.plugnotas.com.br/nfce', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      //   body: JSON.stringify({
      //     empresa: { cnpj: settings.cnpj },
      //     cliente: { cpf: customerCpf },
      //     itens: saleData.items,
      //     total: saleData.final_amount
      //   })
      // });

      const mockProtocol = `PROT${Date.now()}`;
      
      const mockFiscalDocument = {
        sale_id: saleData.sale_id,
        type: 'nfc-e',
        status: 'authorized',
        sefaz_protocol: mockProtocol,
        xml_data: `<xml>Mock NFC-e Data for ${saleData.sale_id}</xml>`,
        danfe_url: `https://example.com/danfe/${mockProtocol}`,
      };

      const { data, error } = await supabase
        .from('fiscal_documents')
        .insert(mockFiscalDocument)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar documento fiscal:', error);
        return {
          success: false,
          message: 'Erro ao salvar documento fiscal no banco',
        };
      }

      return {
        success: true,
        message: 'NFC-e emitida com sucesso (mock)',
        fiscal_document_id: data.id,
        sefaz_protocol: mockProtocol,
        danfe_url: mockFiscalDocument.danfe_url,
      };
    } catch (error) {
      console.error("Erro ao emitir NFC-e:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao emitir NFC-e",
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
          message: "Documento fiscal não encontrado",
        };
      }

      if (fiscalDoc.status !== 'authorized') {
        return {
          success: false,
          message: "Apenas documentos autorizados podem ser cancelados",
        };
      }

      // MOCK: Em produção, chamar API fiscal para cancelamento
      // const response = await fetch(`https://api.plugnotas.com.br/nfce/${fiscalDoc.sefaz_protocol}/cancel`, {
      //   method: 'POST',
      //   body: JSON.stringify({ justificativa: justification })
      // });

      await supabase
        .from('fiscal_documents')
        .update({ status: 'cancelled' })
        .eq('id', fiscalDocumentId);

      return {
        success: true,
        message: 'NFC-e cancelada com sucesso (mock)',
      };
    } catch (error) {
      console.error("Erro ao cancelar NFC-e:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao cancelar NFC-e",
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
