-- Remove plaintext certificate password storage and use Supabase secrets instead
ALTER TABLE public.company_settings DROP COLUMN IF EXISTS certificate_password;

-- Add comment explaining certificate password should be stored in secrets
COMMENT ON TABLE public.company_settings IS 'Company fiscal settings. Certificate password must be stored in Supabase secrets as FISCAL_CERT_PASSWORD for security.';