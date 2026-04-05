-- Criar tabela de bloqueios_agenda para gerenciar indisponibilidade de médicos
CREATE TABLE IF NOT EXISTS bloqueios_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo VARCHAR(50) NOT NULL, -- 'ferias', 'licenca', 'afastamento', 'abono', 'indisponibilidade'
  descricao TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT data_valida CHECK (data_fim >= data_inicio),
  CONSTRAINT motivo_valido CHECK (motivo IN ('ferias', 'licenca', 'afastamento', 'abono', 'indisponibilidade'))
);

-- Índices para performance
CREATE INDEX idx_bloqueios_medico ON bloqueios_agenda(medico_id);
CREATE INDEX idx_bloqueios_periodo ON bloqueios_agenda(data_inicio, data_fim);
CREATE INDEX idx_bloqueios_medico_periodo ON bloqueios_agenda(medico_id, data_inicio, data_fim);
CREATE INDEX idx_bloqueios_ativo ON bloqueios_agenda(ativo) WHERE ativo = true;

-- RLS (Row Level Security)
ALTER TABLE bloqueios_agenda ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler bloqueios ativos
CREATE POLICY "bloqueios_read_active" ON bloqueios_agenda
  FOR SELECT USING (ativo = true);

-- Política: Apenas admin/staff pode inserir bloqueios
CREATE POLICY "bloqueios_insert" ON bloqueios_agenda
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'staff', 'medico')
  );

-- Política: Apenas admin/owner pode atualizar bloqueios
CREATE POLICY "bloqueios_update" ON bloqueios_agenda
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'staff') OR
    criado_por = auth.uid()
  );

-- Política: Apenas admin pode deletar bloqueios
CREATE POLICY "bloqueios_delete" ON bloqueios_agenda
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_bloqueios_agenda_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bloqueios_agenda_update_timestamp
BEFORE UPDATE ON bloqueios_agenda
FOR EACH ROW
EXECUTE FUNCTION update_bloqueios_agenda_timestamp();

-- View: Bloqueios válidos (dentro do período de validade)
CREATE OR REPLACE VIEW bloqueios_validos AS
SELECT *
FROM bloqueios_agenda
WHERE ativo = true AND data_fim >= CURRENT_DATE;

-- View: Bloqueios expirados
CREATE OR REPLACE VIEW bloqueios_expirados AS
SELECT *
FROM bloqueios_agenda
WHERE ativo = true AND data_fim < CURRENT_DATE;
