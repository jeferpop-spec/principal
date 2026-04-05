-- Dados de exemplo para testar o sistema

-- Inserir médicos
INSERT INTO medicos (nome, ativo) VALUES
('Dr. Vinicius Silva', true),
('Dra. Sergio Costa', true),
('Dra. Maria Santos', true),
('Dr. João Oliveira', true);

-- Inserir códigos AGHU (aguardar IDs dos médicos)
-- Execute este script via Supabase SQL Editor ou adapte os IDs conforme necessário

-- Exemplo de inserção de códigos:
-- INSERT INTO codigos_aghu (medico_id, modalidade, especialidade, codigo_aghu, ativo)
-- SELECT
--   m.id,
--   'Consulta',
--   'Cardiologia',
--   'AGHU-CARDIO-001',
--   true
-- FROM medicos m WHERE m.nome = 'Dr. Vinicius Silva';

-- INSERT INTO codigos_aghu (medico_id, modalidade, especialidade, codigo_aghu, ativo)
-- SELECT
--   m.id,
--   'Exame',
--   'Ultrassom',
--   'AGHU-ULTRA-001',
--   true
-- FROM medicos m WHERE m.nome = 'Dra. Sergio Costa';

-- Inserir vagas do dia (próximos 7 dias)
-- INSERT INTO vagas_dia (data, medico_id, vagas_totais)
-- SELECT
--   CURRENT_DATE,
--   m.id,
--   4
-- FROM medicos m WHERE m.nome = 'Dr. Vinicius Silva';

-- INSERT INTO vagas_dia (data, medico_id, vagas_totais)
-- SELECT
--   CURRENT_DATE,
--   m.id,
--   3
-- FROM medicos m WHERE m.nome = 'Dra. Sergio Costa';
