-- Adicionar novas tabelas para módulo fiscal e configurações

-- Tabela de informações fiscais dos produtos
CREATE TABLE IF NOT EXISTS public.product_tax_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  ncm TEXT,
  cfop TEXT DEFAULT '5102',
  cest TEXT,
  icms_origin TEXT,
  icms_tax_situation TEXT,
  pis_tax_situation TEXT,
  cofins_tax_situation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de documentos fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('nfc-e', 'nf-e')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'cancelled', 'error')),
  sefaz_protocol TEXT,
  xml_data TEXT,
  danfe_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tipo enum para regime tributário
CREATE TYPE tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');

-- Tipo enum para ambiente SEFAZ
CREATE TYPE sefaz_environment AS ENUM ('production', 'homologation');

-- Tabela de configurações da empresa (deve ter apenas uma linha)
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  cnpj TEXT,
  state_registration TEXT,
  tax_regime tax_regime DEFAULT 'simples_nacional',
  digital_certificate_a1 BYTEA,
  certificate_password TEXT,
  certificate_expires_at TIMESTAMP WITH TIME ZONE,
  sefaz_environment sefaz_environment DEFAULT 'homologation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Modificações em tabelas existentes

-- Adicionar campos fiscais na tabela sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS fiscal_status TEXT DEFAULT 'none' CHECK (fiscal_status IN ('none', 'pending', 'authorized', 'error')),
ADD COLUMN IF NOT EXISTS fiscal_document_id UUID REFERENCES public.fiscal_documents(id) ON DELETE SET NULL;

-- Adicionar campo de análise de IA na tabela cash_registers
ALTER TABLE public.cash_registers
ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

-- Remover cost_price de products (opcional - vou manter como último custo)
-- ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price;

-- Enable RLS nas novas tabelas
ALTER TABLE public.product_tax_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_tax_info
CREATE POLICY "Authenticated users can view product tax info"
ON public.product_tax_info FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Managers and admins can manage product tax info"
ON public.product_tax_info FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Políticas RLS para fiscal_documents
CREATE POLICY "Authenticated users can view fiscal documents"
ON public.fiscal_documents FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fiscal documents"
ON public.fiscal_documents FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para company_settings (apenas admin)
CREATE POLICY "Admins can view company settings"
ON public.company_settings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage company settings"
ON public.company_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_product_tax_info_updated_at
BEFORE UPDATE ON public.product_tax_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_documents_updated_at
BEFORE UPDATE ON public.fiscal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();