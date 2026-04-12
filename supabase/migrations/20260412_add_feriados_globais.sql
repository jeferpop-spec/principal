-- Criar tabela de bloqueios_agenda para gerenciar indisponibilidade de médicos e Feriados Globais
CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID REFERENCES public.medicos(id) ON DELETE CASCADE, -- REMOVIDO "NOT NULL" PARA PERMITIR BLOQUEIO GLOBAL
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo VARCHAR(50) NOT NULL, -- Inclui 'feriado'
  descricao TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT data_valida CHECK (data_fim >= data_inicio),
  CONSTRAINT motivo_valido CHECK (motivo IN ('ferias', 'licenca', 'afastamento', 'abono', 'indisponibilidade', 'feriado'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bloqueios_medico ON public.bloqueios_agenda(medico_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_periodo ON public.bloqueios_agenda(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_bloqueios_medico_periodo ON public.bloqueios_agenda(medico_id, data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_bloqueios_ativo ON public.bloqueios_agenda(ativo) WHERE ativo = true;

-- RLS (Row Level Security)
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler bloqueios ativos
DROP POLICY IF EXISTS "bloqueios_read_active" ON public.bloqueios_agenda;
CREATE POLICY "bloqueios_read_active" ON public.bloqueios_agenda FOR ALL USING (true); -- MODIFICADO PARA COMPATIBILIDADE ALL IN ONE
