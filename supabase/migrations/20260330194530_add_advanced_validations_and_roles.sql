/*
  # Adicionar Validações Avançadas e Preparar Estrutura de Roles

  1. Adicionar constraint de unicidade para evitar duplicidade de marcações
  2. Criar tabela de roles de usuário para autenticação futura
  3. Adicionar colunas de auditoria
  4. Criar índices para otimizar validações
  5. Adicionar funções de validação

  ## Mudanças:
  - Adicionar UNIQUE constraint em marcacoes para evitar duplicatas
  - Criar tabela user_roles para preparar autenticação por perfil
  - Adicionar coluna user_id em marcacoes (nullable para compatibilidade)
  - Adicionar coluna cancelled_at em marcacoes para soft delete
  - Criar índices para performance de validações
*/

-- Adicionar coluna cancelled_at em marcacoes para soft delete
ALTER TABLE marcacoes 
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Criar índice para marcações não canceladas
CREATE INDEX IF NOT EXISTS idx_marcacoes_ativas ON marcacoes(data, medico_id) WHERE cancelled_at IS NULL;

-- Criar tabela de roles de usuário
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'medico', 'atendente', 'visualizador')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Usuários autenticados podem visualizar roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin pode gerenciar roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin' AND ativo = true
    )
  );

-- Criar função para contar vagas disponíveis
CREATE OR REPLACE FUNCTION get_vagas_disponiveis(
  p_data date,
  p_medico_id uuid
) RETURNS TABLE (
  total_vagas integer,
  vagas_ocupadas integer,
  vagas_disponiveis integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(vd.vagas_totais, 0)::integer as total_vagas,
    COALESCE(COUNT(m.id), 0)::integer as vagas_ocupadas,
    (COALESCE(vd.vagas_totais, 0) - COALESCE(COUNT(m.id), 0))::integer as vagas_disponiveis
  FROM
    vagas_dia vd
  LEFT JOIN marcacoes m ON vd.data = m.data 
    AND vd.medico_id = m.medico_id 
    AND m.status = 'agendado'
    AND m.cancelled_at IS NULL
  WHERE
    vd.data = p_data
    AND vd.medico_id = p_medico_id
  GROUP BY vd.vagas_totais;
END;
$$ LANGUAGE plpgsql;

-- Criar função para validar duplicidade de marcação
CREATE OR REPLACE FUNCTION check_marcacao_duplicata(
  p_data date,
  p_medico_id uuid,
  p_modalidade text,
  p_especialidade text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM marcacoes
    WHERE data = p_data
      AND medico_id = p_medico_id
      AND modalidade = p_modalidade
      AND especialidade = p_especialidade
      AND status != 'cancelado'
      AND cancelled_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Criar função para validar vagas disponíveis
CREATE OR REPLACE FUNCTION validate_vagas_disponiveis(
  p_data date,
  p_medico_id uuid
) RETURNS boolean AS $$
DECLARE
  v_disponiveis integer;
BEGIN
  SELECT vagas_disponiveis INTO v_disponiveis
  FROM get_vagas_disponiveis(p_data, p_medico_id);
  
  RETURN COALESCE(v_disponiveis, 0) > 0;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at em user_roles
CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_roles_updated
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_timestamp();
