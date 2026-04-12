/*
  # Atualizar estrutura da tabela codigos_aghu para UDI

  Adicionar campos necessários para integração com dados reais da UDI:
  - Renomear 'especialidade' para 'exame' (mais descritivo)
  - Adicionar campo 'preparo' (instruções de preparo para o exame)
  - Adicionar campo 'observacoes' (observações adicionais)
*/

-- Adicionar novos campos à tabela codigos_aghu
ALTER TABLE codigos_aghu
ADD COLUMN IF NOT EXISTS exame text,
ADD COLUMN IF NOT EXISTS preparo text,
ADD COLUMN IF NOT EXISTS observacoes text;

-- Migrar dados existentes de especialidade para exame
UPDATE codigos_aghu SET exame = especialidade WHERE exame IS NULL;

-- Tornar exame NOT NULL após migração
ALTER TABLE codigos_aghu ALTER COLUMN exame SET NOT NULL;

-- Remover coluna especialidade antiga (opcional, manter por compatibilidade)
-- ALTER TABLE codigos_aghu DROP COLUMN IF EXISTS especialidade;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_codigos_exame ON codigos_aghu(exame);
CREATE INDEX IF NOT EXISTS idx_codigos_modalidade ON codigos_aghu(modalidade);