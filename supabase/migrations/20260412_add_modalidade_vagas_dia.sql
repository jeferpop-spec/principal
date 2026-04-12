-- Migration: Adicionar modalidade em vagas_dia

-- 1. Adicionando coluna 'modalidade'
ALTER TABLE public.vagas_dia ADD COLUMN IF NOT EXISTS modalidade VARCHAR(100);

-- Opcional (se quiser preencher as antigas com um placeholder 'Não Informada'):
-- UPDATE public.vagas_dia SET modalidade = 'Não informada' WHERE modalidade IS NULL;
