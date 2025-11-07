export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          purchase_order_id: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          purchase_order_id?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          purchase_order_id?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          sale_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          sale_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action_type: string
          changes_json: Json | null
          created_at: string | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          changes_json?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          changes_json?: Json | null
          created_at?: string | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bank_statement_lines: {
        Row: {
          amount: number
          balance: number | null
          created_at: string | null
          description: string
          id: string
          matched: boolean | null
          matched_with_id: string | null
          matched_with_type: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          balance?: number | null
          created_at?: string | null
          description: string
          id?: string
          matched?: boolean | null
          matched_with_id?: string | null
          matched_with_type?: string | null
          transaction_date: string
        }
        Update: {
          amount?: number
          balance?: number | null
          created_at?: string | null
          description?: string
          id?: string
          matched?: boolean | null
          matched_with_id?: string | null
          matched_with_type?: string | null
          transaction_date?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          event_type: string
          id: string
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendees?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          event_type: string
          id?: string
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendees?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_register_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
          register_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          register_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          register_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_transactions_register_id_fkey"
            columns: ["register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          ai_analysis: string | null
          closed_at: string | null
          closed_by: string | null
          closing_balance: number | null
          created_at: string | null
          current_cash_amount: number | null
          id: string
          name: string
          notes: string | null
          opened_at: string | null
          opened_by: string | null
          opening_balance: number | null
          status: string | null
          store_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string | null
          current_cash_amount?: number | null
          id?: string
          name: string
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number | null
          status?: string | null
          store_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number | null
          created_at?: string | null
          current_cash_amount?: number | null
          id?: string
          name?: string
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opening_balance?: number | null
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          certificate_expires_at: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string | null
          digital_certificate_a1: string | null
          id: string
          sefaz_environment:
            | Database["public"]["Enums"]["sefaz_environment"]
            | null
          state_registration: string | null
          tax_regime: Database["public"]["Enums"]["tax_regime"] | null
          updated_at: string | null
        }
        Insert: {
          certificate_expires_at?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          digital_certificate_a1?: string | null
          id?: string
          sefaz_environment?:
            | Database["public"]["Enums"]["sefaz_environment"]
            | null
          state_registration?: string | null
          tax_regime?: Database["public"]["Enums"]["tax_regime"] | null
          updated_at?: string | null
        }
        Update: {
          certificate_expires_at?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          digital_certificate_a1?: string | null
          id?: string
          sefaz_environment?:
            | Database["public"]["Enums"]["sefaz_environment"]
            | null
          state_registration?: string | null
          tax_regime?: Database["public"]["Enums"]["tax_regime"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          max_uses: number | null
          min_purchase_amount: number | null
          start_date: string
          uses_count: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          max_uses?: number | null
          min_purchase_amount?: number | null
          start_date: string
          uses_count?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          max_uses?: number | null
          min_purchase_amount?: number | null
          start_date?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          created_at: string | null
          field_name: string
          field_type: string
          id: string
          required: boolean | null
          store_id: string | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          field_name: string
          field_type: string
          id?: string
          required?: boolean | null
          store_id?: string | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          field_name?: string
          field_type?: string
          id?: string
          required?: boolean | null
          store_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          field_definition_id: string
          id: string
          record_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_definition_id: string
          id?: string
          record_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_definition_id?: string
          id?: string
          record_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          points_balance: number | null
          total_points_earned: number | null
          total_points_redeemed: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          points_balance?: number | null
          total_points_earned?: number | null
          total_points_redeemed?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          points_balance?: number | null
          total_points_earned?: number | null
          total_points_redeemed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_price_list_link: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          price_list_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          price_list_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          price_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_price_list_link_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_price_list_link_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_store_credit: {
        Row: {
          balance: number | null
          created_at: string | null
          customer_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          customer_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          customer_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_store_credit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          cpf_cnpj: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      ecommerce_connections: {
        Row: {
          active: boolean | null
          api_key_encrypted: string | null
          api_url: string
          created_at: string | null
          id: string
          platform: string
        }
        Insert: {
          active?: boolean | null
          api_key_encrypted?: string | null
          api_url: string
          created_at?: string | null
          id?: string
          platform: string
        }
        Update: {
          active?: boolean | null
          api_key_encrypted?: string | null
          api_url?: string
          created_at?: string | null
          id?: string
          platform?: string
        }
        Relationships: []
      }
      fiscal_documents: {
        Row: {
          created_at: string | null
          danfe_url: string | null
          error_message: string | null
          id: string
          sale_id: string | null
          sefaz_protocol: string | null
          status: string
          type: string
          updated_at: string | null
          xml_data: string | null
        }
        Insert: {
          created_at?: string | null
          danfe_url?: string | null
          error_message?: string | null
          id?: string
          sale_id?: string | null
          sefaz_protocol?: string | null
          status?: string
          type: string
          updated_at?: string | null
          xml_data?: string | null
        }
        Update: {
          created_at?: string | null
          danfe_url?: string | null
          error_message?: string | null
          id?: string
          sale_id?: string | null
          sefaz_protocol?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          xml_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_documents_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          product_id: string | null
          product_variation_id: string | null
          quantity_change: number
          reason: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          product_id?: string | null
          product_variation_id?: string | null
          quantity_change: number
          reason: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          product_id?: string | null
          product_variation_id?: string | null
          quantity_change?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_items: {
        Row: {
          component_product_id: string | null
          component_variation_id: string | null
          created_at: string | null
          id: string
          kit_product_id: string
          quantity: number
        }
        Insert: {
          component_product_id?: string | null
          component_variation_id?: string | null
          created_at?: string | null
          id?: string
          kit_product_id: string
          quantity: number
        }
        Update: {
          component_product_id?: string | null
          component_variation_id?: string | null
          created_at?: string | null
          id?: string
          kit_product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_items_kit_product_id_fkey"
            columns: ["kit_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          min_points_to_redeem: number | null
          points_expiry_days: number | null
          points_per_real: number | null
          reais_per_point: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          min_points_to_redeem?: number | null
          points_expiry_days?: number | null
          points_per_real?: number | null
          reais_per_point?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          min_points_to_redeem?: number | null
          points_expiry_days?: number | null
          points_per_real?: number | null
          reais_per_point?: number | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          points_change: number
          sale_id: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          points_change: number
          sale_id?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          points_change?: number
          sale_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_bom: {
        Row: {
          created_at: string | null
          finished_product_id: string
          id: string
          quantity_needed: number
          raw_material_product_id: string | null
          raw_material_variation_id: string | null
        }
        Insert: {
          created_at?: string | null
          finished_product_id: string
          id?: string
          quantity_needed: number
          raw_material_product_id?: string | null
          raw_material_variation_id?: string | null
        }
        Update: {
          created_at?: string | null
          finished_product_id?: string
          id?: string
          quantity_needed?: number
          raw_material_product_id?: string | null
          raw_material_variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bom_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bom_raw_material_product_id_fkey"
            columns: ["raw_material_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string | null
          id: string
          price: number
          price_list_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          price_list_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          price_list_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tax_info: {
        Row: {
          cest: string | null
          cfop: string | null
          cofins_tax_situation: string | null
          created_at: string | null
          icms_origin: string | null
          icms_tax_situation: string | null
          id: string
          ncm: string | null
          pis_tax_situation: string | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          cest?: string | null
          cfop?: string | null
          cofins_tax_situation?: string | null
          created_at?: string | null
          icms_origin?: string | null
          icms_tax_situation?: string | null
          id?: string
          ncm?: string | null
          pis_tax_situation?: string | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          cest?: string | null
          cfop?: string | null
          cofins_tax_situation?: string | null
          created_at?: string | null
          icms_origin?: string | null
          icms_tax_situation?: string | null
          id?: string
          ncm?: string | null
          pis_tax_situation?: string | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_tax_info_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          order_number: string
          product_to_produce_id: string
          quantity_to_produce: number
          started_at: string | null
          status: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number: string
          product_to_produce_id: string
          quantity_to_produce: number
          started_at?: string | null
          status?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          product_to_produce_id?: string
          quantity_to_produce?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_product_to_produce_id_fkey"
            columns: ["product_to_produce_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          barcode: string | null
          category_id: string | null
          cfop: string | null
          cofins_rate: number | null
          cost_price: number | null
          created_at: string | null
          cst_icms: string | null
          description: string | null
          icms_rate: number | null
          id: string
          image_url: string | null
          ipi_rate: number | null
          min_stock: number | null
          name: string
          ncm: string | null
          pis_rate: number | null
          sale_price: number
          sku: string | null
          stock_quantity: number | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          barcode?: string | null
          category_id?: string | null
          cfop?: string | null
          cofins_rate?: number | null
          cost_price?: number | null
          created_at?: string | null
          cst_icms?: string | null
          description?: string | null
          icms_rate?: number | null
          id?: string
          image_url?: string | null
          ipi_rate?: number | null
          min_stock?: number | null
          name: string
          ncm?: string | null
          pis_rate?: number | null
          sale_price: number
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          barcode?: string | null
          category_id?: string | null
          cfop?: string | null
          cofins_rate?: number | null
          cost_price?: number | null
          created_at?: string | null
          cst_icms?: string | null
          description?: string | null
          icms_rate?: number | null
          id?: string
          image_url?: string | null
          ipi_rate?: number | null
          min_stock?: number | null
          name?: string
          ncm?: string | null
          pis_rate?: number | null
          sale_price?: number
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          buy_quantity: number | null
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          end_date: string
          get_quantity: number | null
          id: string
          name: string
          product_id: string | null
          start_date: string
          type: string
        }
        Insert: {
          active?: boolean | null
          buy_quantity?: number | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date: string
          get_quantity?: number | null
          id?: string
          name: string
          product_id?: string | null
          start_date: string
          type: string
        }
        Update: {
          active?: boolean | null
          buy_quantity?: number | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string
          get_quantity?: number | null
          id?: string
          name?: string
          product_id?: string | null
          start_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          purchase_order_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_order_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          received_date: string | null
          status: string | null
          supplier_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          received_date?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          received_date?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          sale_id?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          discount: number | null
          final_amount: number
          fiscal_document_id: string | null
          fiscal_status: string | null
          id: string
          notes: string | null
          payment_method: string | null
          sale_number: string
          status: string | null
          store_id: string | null
          total_amount: number
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          final_amount: number
          fiscal_document_id?: string | null
          fiscal_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          sale_number: string
          status?: string | null
          store_id?: string | null
          total_amount: number
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          final_amount?: number
          fiscal_document_id?: string | null
          fiscal_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          sale_number?: string
          status?: string | null
          store_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          commission_amount: number
          commission_percentage: number | null
          created_at: string | null
          id: string
          paid_at: string | null
          sale_id: string | null
          salesperson_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          commission_amount: number
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          sale_id?: string | null
          salesperson_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          sale_id?: string | null
          salesperson_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          legal_name: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          severity: string
          store_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          severity: string
          store_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          store_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          payment_method: string | null
          sale_id: string | null
          transaction_date: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          sale_id?: string | null
          transaction_date?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          sale_id?: string | null
          transaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stores: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "user"
      sefaz_environment: "production" | "homologation"
      tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "cashier", "user"],
      sefaz_environment: ["production", "homologation"],
      tax_regime: ["simples_nacional", "lucro_presumido", "lucro_real"],
    },
  },
} as const
