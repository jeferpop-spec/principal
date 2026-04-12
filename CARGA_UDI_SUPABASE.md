# 📋 Guia de Execução - Carga da UDI no Supabase

## 📊 Sumário do Processamento

| Item | Valor |
|------|-------|
| **Médicos processados** | 17 médicos ativos |
| **Códigos AGHU** | 1.292 registros |
| **Modalidades** | 4 (ULTRASSOM, TOMOGRAFIA, RAIO-X, MAMOGRAFO) |
| **Dados** | 100% reais, extraídos de CSV da UDI |

---

## ⚠️ Pré-requisitos para Execução

✅ Banco de dados Supabase ativo  
✅ Acesso ao SQL Editor do Supabase  
✅ Migrations anteriores já executadas (20260328 até 20260406)

---

## 🚀 Ordem Correta de Execução

### Passo 1️⃣: Executar Migration de Preparação

**Arquivo:** `supabase/migrations/20260405_add_updated_at_and_constraints_udi.sql`

**O que faz:**
- ✅ Adiciona coluna `updated_at` em `medicos`
- ✅ Adiciona coluna `updated_at` em `codigos_aghu`
- ✅ Cria unique constraint em `medicos(nome)`
- ✅ Cria unique constraint em `codigos_aghu(medico_id, codigo_aghu)`
- ✅ Cria índices para performance

**Tempo estimado:** < 1 segundo

**Como executar:**
1. Abra o Supabase SQL Editor
2. Copie e cole todo o conteúdo de `20260405_add_updated_at_and_constraints_udi.sql`
3. Clique em "Run" (Execute)
4. Confirme que não houve erros

---

### Passo 2️⃣: Executar Seed de Dados

**Arquivo:** `supabase/seed_medicos_codigos_udi.sql`

**O que faz:**
- ✅ Insere 17 médicos em `medicos` com UPSERT seguro
- ✅ Insere 1.292 códigos AGHU em `codigos_aghu` com UPSERT seguro
- ✅ Mantém integridade referencial (médicos ✔️ e códigos ✔️)
- ✅ Converte campos vazios em NULL (preparo, observacoes)

**Tempo estimado:** 2-5 segundos

**Como executar:**
1. Abra o Supabase SQL Editor
2. Copie e cole todo o conteúdo de `seed_medicos_codigos_udi.sql`
3. Clique em "Run" (Execute)
4. Aguarde conclusão (vai aparecer "1292 rows inserted" ou similar)

---

## ✅ Validação após Execução

### Query de Verificação Rápida:

```sql
-- Verificar contagem de registros
SELECT 
  'MÉDICOS ATIVOS' as tipo,
  COUNT(*) as total
FROM public.medicos
WHERE ativo = true
UNION ALL
SELECT 
  'CÓDIGOS AGHU ATIVOS' as tipo,
  COUNT(*) as total
FROM public.codigos_aghu
WHERE ativo = true
ORDER BY total DESC;
```

**Resultado esperado:**
```
tipo                    | total
------------------------|-------
MÉDICOS ATIVOS          |    17
CÓDIGOS AGHU ATIVOS     | 1.292
```

### Query de Verificação Detalhada:

```sql
-- Validar distribuição por médico
SELECT 
  m.nome as medico,
  COUNT(c.id) as quantidade_codigos,
  COUNT(DISTINCT c.modalidade) as modalidades
FROM public.medicos m
LEFT JOIN public.codigos_aghu c ON c.medico_id = m.id AND c.ativo = true
WHERE m.ativo = true
GROUP BY m.nome
ORDER BY quantidade_codigos DESC;
```

---

## 🔧 Resolução de Problemas

### ❌ Erro: "Column 'updated_at' does not exist"

**Causa:** Migration 1 não foi executada  
**Solução:** Execute primeiro a migration `20260405_add_updated_at_and_constraints_udi.sql`

---

### ❌ Erro: "Duplicate key value violates unique constraint"

**Causa:** Os dados já foram inseridos  
**Solução (Opção 1):** Use UPSERT (já está configurado - execute de novo)  
**Solução (Opção 2):** Limpe os dados comentados no início do seed e exclua antes de recarregar

---

### ❌ Erro: "Constraint 'uk_medicos_nome' does not exist"

**Causa:** Migration 1 não foi executada com sucesso  
**Solução:** Verifique a execução da migration e execute novamente

---

## 📁 Verificar Dados Carregados

### Ver todos os médicos:
```sql
SELECT nome, ativo, created_at FROM public.medicos 
WHERE ativo = true 
ORDER BY nome;
```

### Ver códigos de um médico específico:
```sql
SELECT m.nome, c.modalidade, c.exame, c.codigo_aghu, c.preparo 
FROM public.codigos_aghu c
JOIN public.medicos m ON m.id = c.medico_id
WHERE m.nome = 'MARCELA SILVA VIEIRA' AND c.ativo = true
LIMIT 10;
```

### Ver distribuição por modalidade:
```sql
SELECT 
  modalidade,
  COUNT(*) as quantidade
FROM public.codigos_aghu
WHERE ativo = true
GROUP BY modalidade
ORDER BY quantidade DESC;
```

---

## 🎯 Resumo dos Médicos Carregados

Os 17 médicos carregados são:

1. CARLOS FERREIRA NETO II
2. CECILIA GAVRIELA DE ARRUDA CASTELO BRANCO BRITO
3. DANIEL MACEDO SEVERO DE LUCENA
4. GALBA LEITE OLIVEIRA
5. IGOR MOTTA DE AQUINO
6. JOYCE FREIRE GONÇALVES DE MELO
7. LAUTÔNIO JR CARLOS LOUREIRO
8. LICIA MARIA RICARTE
9. LUIS FELIPE DE AMORIM PAIVA
10. MARCELA SILVA VIEIRA
11. MARCELLA ALVES DE FARIAS
12. PHIDIAS LUNA FREIRE DE CARVALHO
13. RAPHAEL GEOMES TEIXEIRA
14. RICARDO LOUREIRO CAVALCANTI SOBRINHO
15. SERGIO TSENG
16. TATIANA FORTALEZA ARRAES DE CARVALHO
17. VINICIUS VIEIRA MARCIEL RICARTE

---

## 📝 Notas Importantes

- ✅ Todos os dados são reais e extraídos dos CSV da UDI
- ✅ Nenhum dado fictício foi utilizado
- ✅ A estrutura garante integridade referencial
- ✅ O UPSERT permite reexecução segura
- ✅ Campos `preparo` e `observacoes` vazios são armazenados como NULL (economiza espaço)

---

## 🔄 Para Limpar e Recarregar

### Opção 1: Descomente os comandos DELETE no seed

Bem no início do `seed_medicos_codigos_udi.sql`, existem comandos DELETE comentados.  
Descomente-os para limpar antes de recarregar:

```sql
DELETE FROM public.codigos_aghu 
WHERE medico_id IN (SELECT id FROM public.medicos WHERE nome IN (...));

DELETE FROM public.medicos WHERE nome IN (...);
```

### Opção 2: Limpe manualmente

```sql
-- Remover codigos de médicos da UDI
DELETE FROM public.codigos_aghu 
WHERE medico_id IN (
  SELECT id FROM public.medicos 
  WHERE nome LIKE '%MARCELA%' OR nome LIKE '%CARLOS%' /* etc */
);

-- Remover médicos da UDI
DELETE FROM public.medicos 
WHERE nome IN (
  'MARCELA SILVA VIEIRA',
  'CARLOS FERREIRA NETO II',
  /* ... etc */
);
```

---

**✨ Após completar estes passos, sua UDI estará totalmente configurada no Supabase!**
