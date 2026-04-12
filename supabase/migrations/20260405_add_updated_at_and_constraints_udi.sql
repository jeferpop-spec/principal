/*
  # Adicionar updated_at e constraints únicos para UDI

  ## Mudanças:
  1. Adicionar coluna `updated_at` em `medicos`
  2. Adicionar unique constraint em `medicos(nome)`
  3. Adicionar coluna `updated_at` em `codigos_aghu`
  4. Adicionar unique constraint em `codigos_aghu(medico_id, codigo_aghu)`

  Essas mudanças permitem:
  - Rastrear atualizações nos registros
  - Evitar duplicação de médicos com nomes iguais
  - Evitar duplicação de códigos AGHU para o mesmo médico
  - Usar ON CONFLICT para upsert seguro no seed
*/

-- =====================================================================
-- TABELA medicos: Adicionar updated_at e unique constraint
-- =====================================================================

-- Adicionar coluna updated_at a medicos (se não existir)
ALTER TABLE public.medicos
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Criar unique constraint em medicos(nome)
-- Se já existir índice único, isso não causará erro
ALTER TABLE public.medicos DROP CONSTRAINT IF EXISTS uk_medicos_nome;
ALTER TABLE public.medicos ADD CONSTRAINT uk_medicos_nome UNIQUE(nome);

-- Criar índice para atualizar updated_at automaticamente (opcional, usa trigger)
-- Para simplicidade, vamos atualizar manualmente no seed


-- =====================================================================
-- TABELA codigos_aghu: Adicionar updated_at e unique constraint
-- =====================================================================

-- Adicionar coluna updated_at a codigos_aghu (se não existir)
ALTER TABLE public.codigos_aghu
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Criar unique constraint em codigos_aghu(medico_id, codigo_aghu)
-- Isso garante que não tenhamos o mesmo código AGHU duplicado para o mesmo médico
ALTER TABLE public.codigos_aghu DROP CONSTRAINT IF EXISTS uk_codigos_aghu_medico_codigo;
ALTER TABLE public.codigos_aghu ADD CONSTRAINT uk_codigos_aghu_medico_codigo UNIQUE(medico_id, codigo_aghu);

-- Criar índice composto para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_codigos_aghu_medico_codigo 
ON public.codigos_aghu(medico_id, codigo_aghu);

-- Criar índice em updated_at para ordenação
CREATE INDEX IF NOT EXISTS idx_medicos_updated_at ON public.medicos(updated_at);
CREATE INDEX IF NOT EXISTS idx_codigos_aghu_updated_at ON public.codigos_aghu(updated_at);


-- =====================================================================
-- VERIFICAÇÃO: Mostrar estrutura das tabelas após mudanças
-- =====================================================================
-- Esta query mostra a estrutura final para validação (comentada)
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name IN ('medicos', 'codigos_aghu')
-- ORDER BY table_name, ordinal_position;
