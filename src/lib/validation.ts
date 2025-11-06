import { z } from 'zod';

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone muito longo').regex(/^[0-9+\s()-]*$/, 'Telefone inválido').optional().or(z.literal('')),
  cpf_cnpj: z.string().max(18, 'CPF/CNPJ muito longo').regex(/^[0-9.-]*$/, 'CPF/CNPJ inválido').optional().or(z.literal('')),
  address: z.string().max(500, 'Endereço muito longo').trim().optional().or(z.literal('')),
  city: z.string().max(100, 'Cidade muito longa').trim().optional().or(z.literal('')),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').trim().optional().or(z.literal('')),
  zip_code: z.string().max(10, 'CEP muito longo').regex(/^[0-9-]*$/, 'CEP inválido').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notas muito longas').trim().optional().or(z.literal('')),
});

// Supplier validation schema
export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  legal_name: z.string().max(200, 'Razão social muito longa').trim().optional().or(z.literal('')),
  cnpj: z.string().max(18, 'CNPJ muito longo').regex(/^[0-9.-]*$/, 'CNPJ inválido').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone muito longo').regex(/^[0-9+\s()-]*$/, 'Telefone inválido').optional().or(z.literal('')),
  contact_person: z.string().max(100, 'Nome muito longo').trim().optional().or(z.literal('')),
  address: z.string().max(500, 'Endereço muito longo').trim().optional().or(z.literal('')),
  city: z.string().max(100, 'Cidade muito longa').trim().optional().or(z.literal('')),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').trim().optional().or(z.literal('')),
  zip_code: z.string().max(10, 'CEP muito longo').regex(/^[0-9-]*$/, 'CEP inválido').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notas muito longas').trim().optional().or(z.literal('')),
});

// Product validation schema
export const productSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').trim().optional().or(z.literal('')),
  sku: z.string().max(50, 'SKU muito longo').trim().optional().or(z.literal('')),
  barcode: z.string().max(50, 'Código de barras muito longo').regex(/^[0-9]*$/, 'Código de barras inválido').optional().or(z.literal('')),
  sale_price: z.number().min(0, 'Preço não pode ser negativo').max(9999999.99, 'Preço muito alto'),
  cost_price: z.number().min(0, 'Custo não pode ser negativo').max(9999999.99, 'Custo muito alto').optional(),
  stock_quantity: z.number().int('Quantidade deve ser inteira').min(0, 'Quantidade não pode ser negativa').optional(),
  min_stock: z.number().int('Quantidade deve ser inteira').min(0, 'Quantidade não pode ser negativa').optional(),
  ncm: z.string().max(8, 'NCM deve ter no máximo 8 caracteres').regex(/^[0-9]*$/, 'NCM inválido').optional().or(z.literal('')),
  cfop: z.string().max(4, 'CFOP deve ter no máximo 4 caracteres').regex(/^[0-9]*$/, 'CFOP inválido').optional().or(z.literal('')),
  cst_icms: z.string().max(3, 'CST ICMS muito longo').optional().or(z.literal('')),
  icms_rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').optional(),
  pis_rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').optional(),
  cofins_rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').optional(),
  ipi_rate: z.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa não pode exceder 100%').optional(),
});

// Calendar event validation schema
export const calendarEventSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').trim().optional().or(z.literal('')),
  event_type: z.string().trim().min(1, 'Tipo de evento é obrigatório').max(50, 'Tipo muito longo'),
  location: z.string().max(200, 'Local muito longo').trim().optional().or(z.literal('')),
  start_date: z.string().datetime('Data de início inválida'),
  end_date: z.string().datetime('Data de término inválida'),
});

// User invitation validation schema
export const userInvitationSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  role: z.enum(['admin', 'manager', 'user'], { errorMap: () => ({ message: 'Função inválida' }) }),
});

// Transaction validation schema
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa'),
  description: z.string().max(500, 'Descrição muito longa').trim().optional().or(z.literal('')),
  amount: z.number().positive('Valor deve ser positivo').max(9999999.99, 'Valor muito alto'),
  payment_method: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto', 'transferencia']),
});

// Sale validation schema
export const saleSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(10000),
    unit_price: z.number().positive(),
    subtotal: z.number().positive(),
  })).min(1, 'Carrinho não pode estar vazio'),
  total_amount: z.number().positive('Total deve ser positivo'),
  discount: z.number().min(0, 'Desconto não pode ser negativo'),
  final_amount: z.number().positive('Valor final deve ser positivo'),
  payment_method: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']),
}).refine(data => data.discount <= data.total_amount, {
  message: 'Desconto não pode exceder o total',
  path: ['discount'],
}).refine(data => Math.abs(data.final_amount - (data.total_amount - data.discount)) < 0.01, {
  message: 'Valor final inconsistente com total e desconto',
  path: ['final_amount'],
});

// Accounts Payable validation schema
export const accountsPayableSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo').max(9999999.99, 'Valor muito alto'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  supplier_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notas muito longas').trim().optional().or(z.literal('')),
  category: z.string().max(100, 'Categoria muito longa').trim().optional().or(z.literal('')),
});

// Accounts Receivable validation schema
export const accountsReceivableSchema = z.object({
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo').max(9999999.99, 'Valor muito alto'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  customer_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notas muito longas').trim().optional().or(z.literal('')),
});

// Purchase Order Item validation schema
export const purchaseOrderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int('Quantidade deve ser inteira').positive('Quantidade deve ser positiva').max(100000, 'Quantidade muito alta'),
  unit_price: z.number().positive('Preço deve ser positivo').min(0.01, 'Preço mínimo: R$ 0,01').max(9999999.99, 'Preço muito alto'),
  subtotal: z.number().positive('Subtotal deve ser positivo'),
});

// Purchase Order validation schema
export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Fornecedor é obrigatório'),
  expected_delivery: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notas muito longas').trim().optional().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1, 'Adicione pelo menos um produto'),
  total_amount: z.number().positive('Total deve ser positivo'),
});
