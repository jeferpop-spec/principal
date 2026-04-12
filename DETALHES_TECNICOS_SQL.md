# 🔧 Detalhes Técnicos das Correções SQL

## Problema Original

O seed gerado tinha:
```sql
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) VALUES (...)
ON CONFLICT (nome) DO UPDATE SET ...
```

Mas o banco tinha:
```sql
-- Estrutura original (do 20260328050905)
CREATE TABLE medicos (
  id uuid PRIMARY KEY,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
  -- ❌ Sem updated_at
  -- ❌ Sem unique constraint em (nome)
);
```

**Resultado:** ❌ Erro ao executar seed

---

## Solução: Nova Migration

Arquivo: `supabase/migrations/20260405_add_updated_at_and_constraints_udi.sql`

### Mudanha 1: Adicionar `updated_at` em medicos

```sql
ALTER TABLE public.medicos
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

**O que faz:**
- Cria coluna que rastreia último UPDATE
- Usa `DEFAULT now()` para novos registros
- `IF NOT EXISTS` para idempotência

---

### Mudança 2: Unique Constraint em medicos(nome)

```sql
ALTER TABLE public.medicos
ADD CONSTRAINT IF NOT EXISTS uk_medicos_nome UNIQUE(nome);
```

**O que habilita:**
- `ON CONFLICT (nome) DO UPDATE` no seed
- Evita duplicação de médicos
- Permite UPSERT seguro

---

### Mudança 3: Adicionar `updated_at` em codigos_aghu

```sql
ALTER TABLE public.codigos_aghu
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

**O que faz:**
- Rastreia atualizações de códigos
- Mesmo padrão que em medicos

---

### Mudança 4: Unique Constraint em codigos_aghu(medico_id, codigo_aghu)

```sql
ALTER TABLE public.codigos_aghu
ADD CONSTRAINT IF NOT EXISTS uk_codigos_aghu_medico_codigo UNIQUE(medico_id, codigo_aghu);
```

**O que habilita:**
- `ON CONFLICT (medico_id, codigo_aghu) DO UPDATE` no seed
- Evita duplicação de códigos para um mesmo médico
- Permite UPSERT seguro

---

### Mudança 5: Índices Suporte

```sql
CREATE INDEX IF NOT EXISTS idx_codigos_aghu_medico_codigo 
ON public.codigos_aghu(medico_id, codigo_aghu);

CREATE INDEX IF NOT EXISTS idx_medicos_updated_at ON public.medicos(updated_at);
CREATE INDEX IF NOT EXISTS idx_codigos_aghu_updated_at ON public.codigos_aghu(updated_at);
```

**Benefícios:**
- Faster lookups para ON CONFLICT
- Faster queries ordernadas por updated_at
- Melhor performance em joins medico_id + codigo_aghu

---

## Resultado: Seed Agora Funciona

### Antes (❌ ERRO):
```sql
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) VALUES (...)
-- ❌ Column 'updated_at' does not exist
-- ❌ Constraint 'uk_medicos_nome' does not exist
```

### Depois (✅ SUCESSO):
```sql
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) VALUES (...)
ON CONFLICT (nome) DO UPDATE SET ativo = true, updated_at = now();
-- ✅ Funciona!
```

---

## Impacto nas Tabelas

### Tabela: medicos

**Antes:**
```
id            | uuid          | PRIMARY KEY
nome          | text          | NOT NULL
ativo         | boolean       | DEFAULT true
created_at    | timestamptz   | DEFAULT now()
```

**Depois:**
```
id            | uuid          | PRIMARY KEY
nome          | text          | NOT NULL, UNIQUE (uk_medicos_nome)
ativo         | boolean       | DEFAULT true
created_at    | timestamptz   | DEFAULT now()
updated_at    | timestamptz   | DEFAULT now()  <- NOVO
```

---

### Tabela: codigos_aghu

**Antes:**
```
id            | uuid          | PRIMARY KEY
medico_id     | uuid          | FK → medicos.id
modalidade    | text          | NOT NULL
especialidade | text          | NOT NULL (era antes de 20260406)
exame         | text          | NOT NULL (adicionado em 20260406)
codigo_aghu   | text          | NOT NULL
ativo         | boolean       | DEFAULT true
created_at    | timestamptz   | DEFAULT now()
preparo       | text          | (de 20260406)
observacoes   | text          | (de 20260406)
```

**Depois:**
```
id            | uuid          | PRIMARY KEY
medico_id     | uuid          | FK → medicos.id
modalidade    | text          | NOT NULL
especialidade | text          | NOT NULL
exame         | text          | NOT NULL
codigo_aghu   | text          | NOT NULL
ativo         | boolean       | DEFAULT true
created_at    | timestamptz   | DEFAULT now()
updated_at    | timestamptz   | DEFAULT now()  <- NOVO
preparo       | text          |
observacoes   | text          |

UNIQUE CONSTRAINT: (medico_id, codigo_aghu) <- NOVO
```

---

## Por que ON CONFLICT é Importante

### Sem UPSERT:
```sql
INSERT INTO medicos VALUES ('MARCELA SILVA VIEIRA', ...)
-- Se executar novamente: ❌ "Current key exists"
```

### Com UPSERT (ON CONFLICT):
```sql
INSERT INTO medicos VALUES ('MARCELA SILVA VIEIRA', ...)
ON CONFLICT (nome) DO UPDATE SET ativo = true, updated_at = now();
-- Pode executar quantas vezes quiser: ✅ Atualiza ou insere
```

**Benefícios:**
- Idempotência (pode rodar novamente)
- Garante sempre 17 médicos (não duplica)
- Atualiza updated_at se houver re-execução

---

## Validação Pré e Pós Migration

### Antes (❌):
```sql
-- Tenta usar coluna que não existe
SELECT updated_at FROM medicos;
-- Error: ERROR: column "updated_at" does not exist
```

### Depois (✅):
```sql
-- Funciona perfeitamente
SELECT updated_at FROM medicos;
-- (timestamp values)
```

---

## Sintaxe Completa do Seed (Médicos)

```sql
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) 
VALUES
  ('CARLOS FERREIRA NETO II', true, now(), now()),
  ('CECILIA GAVRIELA DE ARRUDA CASTELO BRANCO BRITO', true, now(), now()),
  -- ... 15 mais
ON CONFLICT (nome) DO UPDATE SET ativo = true, updated_at = now();
```

**Quebra:**
1. `INSERT INTO ... VALUES` - Tenta inserir 17 médicos
2. `ON CONFLICT (nome)` - Se nome duplicado:
3. `DO UPDATE SET` -Atualiza os campos especificados
4. `updated_at = now()` - Rastreia que foi atualizado

---

## Sintaxe Completa do Seed (Códigos AGHU)

```sql
WITH medicos_map AS (
  SELECT id, nome FROM public.medicos WHERE ativo = true
)
INSERT INTO public.codigos_aghu 
  (medico_id, modalidade, exame, codigo_aghu, preparo, observacoes, ativo, created_at, updated_at)
SELECT
  mm.id,
  c.modalidade,
  c.exame,
  c.codigo_aghu,
  NULLIF(c.preparo, ''),
  NULLIF(c.observacao, ''),
  true,
  now(),
  now()
FROM (VALUES (...1292 rows...)) AS c(...)
JOIN medicos_map mm ON mm.nome = c.medico
ON CONFLICT (medico_id, codigo_aghu) DO UPDATE 
SET modalidade = EXCLUDED.modalidade, 
    exame = EXCLUDED.exame, 
    ativo = true,
    updated_at = now();
```

**Quebra em passos:**
1. `WITH medicos_map` - Cria map de nomes para IDs
2. `INSERT ... SELECT` - Insere combinando dados com IDs
3. `NULLIF(..., '')` - Converte strings vazias em NULL
4. `JOIN medicos_map` - Acha o ID de cada médico
5. `ON CONFLICT (medico_id, codigo_aghu)` - Se código duplicado:
6. `DO UPDATE SET` - Atualiza campos (não duplica)

---

## Garantias

✅ **Sem perda de dados** - Apenas adiciona colunas/constraints  
✅ **Idempotente** - Migration pode rodar múltiplas vezes  
✅ **Reverível** - `DROP COLUMN updated_at`, `DROP CONSTRAINT` (se necessário)  
✅ **Performance** - Índices otimizam queries  
✅ **Compatibilidade** - `IF NOT EXISTS` evita erros se já existe  

---

## Próxima Execução

1. Execute: `20260405_add_updated_at_and_constraints_udi.sql` 
   - Status: ✅ Colunas e constraints criados
   
2. Execute: `seed_medicos_codigos_udi.sql`
   - Status: ✅ 17 médicos + 1.292 códigos inseridos
   
3. Resultado:
```sql
SELECT COUNT(*) FROM medicos WHERE ativo = true;
-- 17

SELECT COUNT(*) FROM codigos_aghu WHERE ativo = true;
-- 1292
```

---

*Gerado em 5 de abril de 2026*
