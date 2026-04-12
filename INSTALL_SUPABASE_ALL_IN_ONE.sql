-- 1. LIMPAR TABELAS VAZIAS OU COM ESTRUTURA ANTIGA
DROP TABLE IF EXISTS public.marcacoes CASCADE;
DROP TABLE IF EXISTS public.vagas_dia CASCADE;
DROP TABLE IF EXISTS public.codigos_aghu CASCADE;
DROP TABLE IF EXISTS public.medicos CASCADE;

-- 2. CRIAR TABELA: MEDICOS
CREATE TABLE public.medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Constraint para Médicos
ALTER TABLE public.medicos ADD CONSTRAINT uk_medicos_nome UNIQUE(nome);

-- 3. CRIAR TABELA: CODIGOS_AGHU (Com a estrutura mais atualizada!)
CREATE TABLE public.codigos_aghu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  modalidade text NOT NULL,
  exame text NOT NULL,  -- Renomeado de especialidade para exame!
  codigo_aghu text NOT NULL,
  preparo text,         -- Coluna adicionada para a carga da UDI
  observacoes text,     -- Coluna adicionada para a carga da UDI
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Constraint para Codigos_Aghu
ALTER TABLE public.codigos_aghu ADD CONSTRAINT uk_codigos_aghu_medico_codigo UNIQUE(medico_id, codigo_aghu);

-- 4. CRIAR TABELA: VAGAS_DIA
CREATE TABLE public.vagas_dia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  medico_id uuid REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  turno text NOT NULL DEFAULT 'manha' CHECK (turno IN ('manha', 'tarde')),
  vagas_totais integer NOT NULL CHECK (vagas_totais >= 1 AND vagas_totais <= 6),
  created_at timestamptz DEFAULT now(),
  UNIQUE(data, medico_id, turno)
);

-- 5. CRIAR TABELA: MARCACOES
CREATE TABLE public.marcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  medico_id uuid REFERENCES public.medicos(id) ON DELETE CASCADE NOT NULL,
  turno text NOT NULL DEFAULT 'manha' CHECK (turno IN ('manha', 'tarde')),
  modalidade text NOT NULL,
  especialidade text NOT NULL,
  codigo_aghu text NOT NULL,
  status text DEFAULT 'agendado',
  created_at timestamptz DEFAULT now()
);

-- 6. CRIAR ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_codigos_medico ON public.codigos_aghu(medico_id);
CREATE INDEX IF NOT EXISTS idx_codigos_ativo ON public.codigos_aghu(ativo);
CREATE INDEX IF NOT EXISTS idx_codigos_exame ON public.codigos_aghu(exame);
CREATE INDEX IF NOT EXISTS idx_codigos_modalidade ON public.codigos_aghu(modalidade);
CREATE INDEX IF NOT EXISTS idx_vagas_data ON public.vagas_dia(data);
CREATE INDEX IF NOT EXISTS idx_vagas_medico ON public.vagas_dia(medico_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_data ON public.marcacoes(data);
CREATE INDEX IF NOT EXISTS idx_marcacoes_medico ON public.marcacoes(medico_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_status ON public.marcacoes(status);
CREATE INDEX IF NOT EXISTS idx_medicos_updated_at ON public.medicos(updated_at);
CREATE INDEX IF NOT EXISTS idx_codigos_aghu_updated_at ON public.codigos_aghu(updated_at);

-- 7. HABILITAR SEGURANÇA (RLS) E POLÍTICAS BÁSICAS
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_aghu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso livre_medicos" ON public.medicos FOR ALL USING (true);
CREATE POLICY "Acesso livre_codigos" ON public.codigos_aghu FOR ALL USING (true);
CREATE POLICY "Acesso livre_vagas" ON public.vagas_dia FOR ALL USING (true);
CREATE POLICY "Acesso livre_marcacoes" ON public.marcacoes FOR ALL USING (true);
