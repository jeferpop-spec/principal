/*
  # Sistema de Gestão de Vagas e Marcações Médicas

  ## Estrutura do Banco de Dados

  1. Tabelas criadas:
    - `medicos` - Cadastro de médicos
      - `id` (uuid, primary key)
      - `nome` (text, nome do médico)
      - `ativo` (boolean, se o médico está ativo)
      - `created_at` (timestamp)
    
    - `codigos_aghu` - Códigos AGHU vinculados a médico, modalidade e especialidade
      - `id` (uuid, primary key)
      - `medico_id` (uuid, foreign key -> medicos)
      - `modalidade` (text, tipo de atendimento)
      - `especialidade` (text, especialidade ou nome do exame)
      - `codigo_aghu` (text, código do sistema AGHU)
      - `ativo` (boolean, se o código está ativo)
      - `created_at` (timestamp)
    
    - `vagas_dia` - Configuração de vagas por médico e data
      - `id` (uuid, primary key)
      - `data` (date, data do atendimento)
      - `medico_id` (uuid, foreign key -> medicos)
      - `vagas_totais` (integer, quantidade de vagas - min 1, max 6)
      - `created_at` (timestamp)
      - UNIQUE constraint em (data, medico_id) para evitar duplicidade
    
    - `marcacoes` - Registro de marcações de atendimentos
      - `id` (uuid, primary key)
      - `data` (date, data da marcação)
      - `medico_id` (uuid, foreign key -> medicos)
      - `modalidade` (text)
      - `especialidade` (text)
      - `codigo_aghu` (text)
      - `status` (text, status da marcação: agendado, confirmado, cancelado)
      - `created_at` (timestamp)

  2. Security:
    - RLS habilitado em todas as tabelas
    - Políticas permitem acesso autenticado para operações CRUD
    - Sistema interno: políticas permissivas para usuários autenticados

  3. Importantes:
    - Relacionamentos via foreign keys garantem integridade referencial
    - Índices criados para otimizar consultas por data e médico
    - Constraint de vagas entre 1 e 6
    - Constraint de unicidade em vagas_dia para evitar duplicação
*/

-- Criar tabela de médicos
CREATE TABLE IF NOT EXISTS medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de códigos AGHU
CREATE TABLE IF NOT EXISTS codigos_aghu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid REFERENCES medicos(id) ON DELETE CASCADE NOT NULL,
  modalidade text NOT NULL,
  especialidade text NOT NULL,
  codigo_aghu text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de vagas por dia
CREATE TABLE IF NOT EXISTS vagas_dia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  medico_id uuid REFERENCES medicos(id) ON DELETE CASCADE NOT NULL,
  vagas_totais integer NOT NULL CHECK (vagas_totais >= 1 AND vagas_totais <= 6),
  created_at timestamptz DEFAULT now(),
  UNIQUE(data, medico_id)
);

-- Criar tabela de marcações
CREATE TABLE IF NOT EXISTS marcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  medico_id uuid REFERENCES medicos(id) ON DELETE CASCADE NOT NULL,
  modalidade text NOT NULL,
  especialidade text NOT NULL,
  codigo_aghu text NOT NULL,
  status text DEFAULT 'agendado',
  created_at timestamptz DEFAULT now()
);

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_codigos_medico ON codigos_aghu(medico_id);
CREATE INDEX IF NOT EXISTS idx_codigos_ativo ON codigos_aghu(ativo);
CREATE INDEX IF NOT EXISTS idx_vagas_data ON vagas_dia(data);
CREATE INDEX IF NOT EXISTS idx_vagas_medico ON vagas_dia(medico_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_data ON marcacoes(data);
CREATE INDEX IF NOT EXISTS idx_marcacoes_medico ON marcacoes(medico_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_status ON marcacoes(status);

-- Habilitar RLS em todas as tabelas
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_aghu ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para medicos
CREATE POLICY "Usuários autenticados podem visualizar médicos"
  ON medicos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir médicos"
  ON medicos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar médicos"
  ON medicos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar médicos"
  ON medicos FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para codigos_aghu
CREATE POLICY "Usuários autenticados podem visualizar códigos"
  ON codigos_aghu FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir códigos"
  ON codigos_aghu FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar códigos"
  ON codigos_aghu FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar códigos"
  ON codigos_aghu FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para vagas_dia
CREATE POLICY "Usuários autenticados podem visualizar vagas"
  ON vagas_dia FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir vagas"
  ON vagas_dia FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vagas"
  ON vagas_dia FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar vagas"
  ON vagas_dia FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para marcacoes
CREATE POLICY "Usuários autenticados podem visualizar marcações"
  ON marcacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir marcações"
  ON marcacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar marcações"
  ON marcacoes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar marcações"
  ON marcacoes FOR DELETE
  TO authenticated
  USING (true);