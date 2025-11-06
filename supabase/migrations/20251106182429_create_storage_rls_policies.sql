-- Políticas para o Bucket 'receipts' (Recibos/Faturas)
-- Nota: Supõe-se que o bucket foi criado com "Public access" DESATIVADO.
-- A leitura pública será controlada por uma política de SELECT.

-- Limpa políticas antigas, se existirem
DROP POLICY IF EXISTS "Allow public read access to receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage their receipts" ON storage.objects;

-- 1. Leitura pública para arquivos no bucket 'receipts'
CREATE POLICY "Allow public read access to receipts"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'receipts' );

-- 2. Apenas admins/managers podem inserir, atualizar ou deletar no bucket 'receipts'
CREATE POLICY "Allow managers and admins to manage receipts"
  ON storage.objects FOR INSERT, UPDATE, DELETE
  USING (
    bucket_id = 'receipts' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- Políticas para o Bucket 'customer_files' (Privado)
-- Nota: Supõe-se que este bucket foi criado como privado.

-- Limpa políticas antigas, se existirem
DROP POLICY IF EXISTS "Allow managers and admins to access customer files" ON storage.objects;
DROP POLICY IF EXISTS "Allow customers to access their own files" ON storage.objects;

-- 1. Apenas admins/managers podem gerenciar (ler, escrever, deletar) arquivos de clientes
CREATE POLICY "Allow managers and admins to access customer files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'customer_files' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- (Opcional, para futuro portal do cliente)
-- CREATE POLICY "Allow customers to access their own files"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'customer_files' AND
--     -- Lógica para verificar se auth.uid() é o "dono" do arquivo
--     -- Ex: auth.uid()::text = (storage.foldername(name))[1]
--   );
