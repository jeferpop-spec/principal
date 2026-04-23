-- ======================================================================================
-- Permitir leitura de dados para usuários anônimos (sem login) 
-- Corrige o problema onde os dados "sumiram" da tela por falta de autenticação no app.
-- ======================================================================================

-- 1. Médicos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar médicos" ON public.medicos;
DROP POLICY IF EXISTS "Leitura pública para médicos" ON public.medicos;

CREATE POLICY "Leitura pública para médicos"
  ON public.medicos FOR SELECT
  USING (true);

-- 2. Códigos AGHU
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar códigos" ON public.codigos_aghu;
DROP POLICY IF EXISTS "Leitura pública para códigos" ON public.codigos_aghu;

CREATE POLICY "Leitura pública para códigos"
  ON public.codigos_aghu FOR SELECT
  USING (true);

-- 3. Vagas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar vagas" ON public.vagas_dia;
DROP POLICY IF EXISTS "Leitura pública para vagas" ON public.vagas_dia;

CREATE POLICY "Leitura pública para vagas"
  ON public.vagas_dia FOR SELECT
  USING (true);

-- 4. Marcações
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar marcações" ON public.marcacoes;
DROP POLICY IF EXISTS "Leitura pública para marcações" ON public.marcacoes;

CREATE POLICY "Leitura pública para marcações"
  ON public.marcacoes FOR SELECT
  USING (true);
