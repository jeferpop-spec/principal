/*
  # Corrigir Problemas de Segurança: RLS e Search Path

  ## Problemas Corrigidos:
  1. Configurar search_path em todas as funções PL/pgSQL para 'public'
  2. Refinar políticas de RLS para não usar apenas 'true'
  3. Garantir que apenas usuários autenticados possam acessar dados
  4. Implementar políticas restritivas por padrão
  5. Adicionar validações de segurança nas operações
*/

-- ========================================
-- 1. REMOVER DEPENDÊNCIAS E RECRIAR
-- ========================================

DROP TRIGGER IF EXISTS trigger_user_roles_updated ON user_roles;
DROP FUNCTION IF EXISTS public.update_user_roles_timestamp();
DROP FUNCTION IF EXISTS public.get_vagas_disponiveis(date, uuid);
DROP FUNCTION IF EXISTS public.check_marcacao_duplicata(date, uuid, text, text);
DROP FUNCTION IF EXISTS public.validate_vagas_disponiveis(date, uuid);

-- ========================================
-- 2. RECRIAR FUNÇÕES COM SEARCH_PATH SEGURO
-- ========================================

CREATE FUNCTION public.get_vagas_disponiveis(
  p_data date,
  p_medico_id uuid
) RETURNS TABLE (
  total_vagas integer,
  vagas_ocupadas integer,
  vagas_disponiveis integer
) AS $$
BEGIN
  SET search_path = public, pg_catalog;
  
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

CREATE FUNCTION public.check_marcacao_duplicata(
  p_data date,
  p_medico_id uuid,
  p_modalidade text,
  p_especialidade text
) RETURNS boolean AS $$
BEGIN
  SET search_path = public, pg_catalog;
  
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

CREATE FUNCTION public.validate_vagas_disponiveis(
  p_data date,
  p_medico_id uuid
) RETURNS boolean AS $$
DECLARE
  v_disponiveis integer;
BEGIN
  SET search_path = public, pg_catalog;
  
  SELECT vagas_disponiveis INTO v_disponiveis
  FROM get_vagas_disponiveis(p_data, p_medico_id);
  
  RETURN COALESCE(v_disponiveis, 0) > 0;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION public.update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  SET search_path = public, pg_catalog;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER trigger_user_roles_updated
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_timestamp();

-- ========================================
-- 3. REFINAR POLÍTICAS DE RLS PARA MEDICOS
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar médicos" ON medicos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir médicos" ON medicos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar médicos" ON medicos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar médicos" ON medicos;

CREATE POLICY "Usuários autenticados podem visualizar médicos"
  ON medicos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin e atendente podem inserir médicos"
  ON medicos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin e atendente podem atualizar médicos"
  ON medicos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin pode deletar médicos"
  ON medicos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

-- ========================================
-- 4. REFINAR POLÍTICAS DE RLS PARA CODIGOS_AGHU
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar códigos" ON codigos_aghu;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir códigos" ON codigos_aghu;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar códigos" ON codigos_aghu;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar códigos" ON codigos_aghu;

CREATE POLICY "Usuários autenticados podem visualizar códigos"
  ON codigos_aghu FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin e atendente podem inserir códigos"
  ON codigos_aghu FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin e atendente podem atualizar códigos"
  ON codigos_aghu FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin pode deletar códigos"
  ON codigos_aghu FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

-- ========================================
-- 5. REFINAR POLÍTICAS DE RLS PARA VAGAS_DIA
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar vagas" ON vagas_dia;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir vagas" ON vagas_dia;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar vagas" ON vagas_dia;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar vagas" ON vagas_dia;

CREATE POLICY "Usuários autenticados podem visualizar vagas"
  ON vagas_dia FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, médico e atendente podem inserir vagas"
  ON vagas_dia FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'medico', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin, médico e atendente podem atualizar vagas"
  ON vagas_dia FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'medico', 'atendente')
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'medico', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin pode deletar vagas"
  ON vagas_dia FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

-- ========================================
-- 6. REFINAR POLÍTICAS DE RLS PARA MARCACOES
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar marcações" ON marcacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir marcações" ON marcacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar marcações" ON marcacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar marcações" ON marcacoes;

CREATE POLICY "Usuários autenticados podem visualizar marcações"
  ON marcacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, médico e atendente podem inserir marcações"
  ON marcacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'medico', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin e atendente podem atualizar marcações"
  ON marcacoes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

CREATE POLICY "Admin e atendente podem deletar marcações"
  ON marcacoes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'atendente')
        AND ativo = true
    )
  );

-- ========================================
-- 7. ATUALIZAR POLÍTICAS DE USER_ROLES
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar roles" ON user_roles;

CREATE POLICY "Usuários podem visualizar roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.ativo = true
    )
  );

CREATE POLICY "Admin pode criar roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

CREATE POLICY "Admin pode atualizar roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

CREATE POLICY "Admin pode deletar roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    )
  );

-- ========================================
-- 8. CRIAR ÍNDICES PARA OTIMIZAR RLS
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_ativo ON user_roles(ativo);
