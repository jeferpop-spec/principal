-- Corrige as tabelas antigas preenchendo as vagas passadas com suas categorias originais (Ex: Raio-X)
UPDATE public.vagas_dia
SET modalidade = (
  SELECT modalidade 
  FROM public.codigos_aghu 
  WHERE codigos_aghu.medico_id = vagas_dia.medico_id 
  LIMIT 1
)
WHERE modalidade IS NULL OR modalidade = '';
