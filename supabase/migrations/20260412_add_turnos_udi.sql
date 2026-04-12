-- Migration: Adicionar coluna 'turno' para dividir agendas

-- 1. ADICIONAR COLUNA EM marcacoes (Com valor padrão 'manha')
ALTER TABLE public.marcacoes 
ADD COLUMN IF NOT EXISTS turno text DEFAULT 'manha' CHECK (turno IN ('manha', 'tarde'));

-- Atualizar dados legados para manha (se houver)
UPDATE public.marcacoes SET turno = 'manha' WHERE turno IS NULL;

-- Tornar NOT NULL após garantir dados preenchidos
ALTER TABLE public.marcacoes ALTER COLUMN turno SET NOT NULL;


-- 2. ADICIONAR COLUNA EM vagas_dia (Com valor padrão 'manha')
ALTER TABLE public.vagas_dia 
ADD COLUMN IF NOT EXISTS turno text DEFAULT 'manha' CHECK (turno IN ('manha', 'tarde'));

-- Atualizar dados legados para manha (se houver)
UPDATE public.vagas_dia SET turno = 'manha' WHERE turno IS NULL;

-- Tornar NOT NULL
ALTER TABLE public.vagas_dia ALTER COLUMN turno SET NOT NULL;

-- 3. REMOVER RESTRIÇÃO DE DUPLICIDADE VELHA DA DATA E MÉDICO
ALTER TABLE public.vagas_dia DROP CONSTRAINT IF EXISTS vagas_dia_data_medico_id_key;

-- 4. CRIAR NOVA RESTRIÇÃO PERMITINDO 1 CONFIGURAÇÃO POR TURNO (Manhã e Tarde)
ALTER TABLE public.vagas_dia ADD CONSTRAINT vagas_dia_data_medico_id_turno_key UNIQUE (data, medico_id, turno);
