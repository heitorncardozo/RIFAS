-- ============================================
-- SISTEMA DE RIFAS - Setup Supabase
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Criar tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  turma TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de rifas
CREATE TABLE IF NOT EXISTS rifas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  aluno_id UUID REFERENCES alunos(id) ON DELETE SET NULL,
  vendido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  rifa_id UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  comprovante_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rifas_vendido ON rifas(vendido);
CREATE INDEX IF NOT EXISTS idx_rifas_numero ON rifas(numero);
CREATE INDEX IF NOT EXISTS idx_vendas_aluno ON vendas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_vendas_created ON vendas(created_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- === ALUNOS ===
-- Público pode ler alunos
CREATE POLICY "Público pode ler alunos"
  ON alunos FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin pode inserir alunos
CREATE POLICY "Admin pode inserir alunos"
  ON alunos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin pode atualizar alunos
CREATE POLICY "Admin pode atualizar alunos"
  ON alunos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin pode deletar alunos
CREATE POLICY "Admin pode deletar alunos"
  ON alunos FOR DELETE
  TO authenticated
  USING (true);

-- === RIFAS ===
-- Público pode ler rifas
CREATE POLICY "Público pode ler rifas"
  ON rifas FOR SELECT
  TO anon, authenticated
  USING (true);

-- Público pode atualizar rifas (marcar como vendido)
CREATE POLICY "Público pode atualizar rifas"
  ON rifas FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Admin pode inserir rifas
CREATE POLICY "Admin pode inserir rifas"
  ON rifas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin pode deletar rifas
CREATE POLICY "Admin pode deletar rifas"
  ON rifas FOR DELETE
  TO authenticated
  USING (true);

-- === VENDAS ===
-- Público pode inserir vendas
CREATE POLICY "Público pode inserir vendas"
  ON vendas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Público pode ler vendas (necessário para verificação)
CREATE POLICY "Público pode ler vendas"
  ON vendas FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin pode deletar vendas
CREATE POLICY "Admin pode deletar vendas"
  ON vendas FOR DELETE
  TO authenticated
  USING (true);

-- Admin pode atualizar vendas
CREATE POLICY "Admin pode atualizar vendas"
  ON vendas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. STORAGE - Bucket para comprovantes
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode fazer upload
CREATE POLICY "Qualquer um pode fazer upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'comprovantes');

-- Política: qualquer um pode ver comprovantes
CREATE POLICY "Qualquer um pode ver comprovantes"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'comprovantes');

-- Política: admin pode deletar comprovantes
CREATE POLICY "Admin pode deletar comprovantes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comprovantes');

-- ============================================
-- 7. GERAR RIFAS (1 a 800)
-- ============================================

INSERT INTO rifas (numero)
SELECT generate_series(1, 800)
ON CONFLICT (numero) DO NOTHING;

-- ============================================
-- 8. ALUNOS DE EXEMPLO (opcional - remova se não quiser)
-- ============================================

-- INSERT INTO alunos (nome, turma) VALUES
--   ('João Silva', '3º A'),
--   ('Maria Santos', '3º B'),
--   ('Pedro Oliveira', '2º A'),
--   ('Ana Costa', '2º B'),
--   ('Lucas Souza', '1º A');

-- ============================================
-- PRONTO! Agora crie um usuário admin em:
-- Supabase Dashboard > Authentication > Users > Add User
-- ============================================
