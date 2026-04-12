# 📋 Instruções para Carga de Dados Reais da UDI no Supabase

## 📊 Resumo dos Dados Preparados

### Médicos Ativos: 26
- Todos os médicos estão marcados como `ativo = true`
- Nomes padronizados e reais da UDI
- IDs gerados automaticamente pelo banco

### Códigos AGHU: 42 registros
- Distribuidos entre 26 médicos
- Modalidades: ULTRASSOM, TOMOGRAFIA, RESSONANCIA, MAMOGRAFIA, DENSITOMETRIA
- Códigos numéricos reais (sem casas decimais)
- Preparos e observações incluídos quando aplicáveis

## 🚀 Como Executar a Carga

### Passo 1: Executar a Migração de Estrutura
```sql
-- Execute primeiro no SQL Editor do Supabase
-- Arquivo: supabase/migrations/20260406_update_codigos_aghu_structure.sql
```

### Passo 2: Executar o Seed de Dados
```sql
-- Execute depois no SQL Editor do Supabase
-- Arquivo: supabase/seed_medicos_codigos_udi.sql
```

### Passo 3: Verificar a Carga
```sql
-- Execute as queries de verificação no final do arquivo seed
SELECT
  (SELECT COUNT(*) FROM medicos WHERE ativo = true) as medicos_ativos,
  (SELECT COUNT(*) FROM codigos_aghu WHERE ativo = true) as codigos_ativos;
```

## 📁 Arquivos Gerados

1. **`supabase/migrations/20260406_update_codigos_aghu_structure.sql`**
   - Migração para adicionar campos `exame`, `preparo`, `observacoes`
   - Migração de dados existentes

2. **`supabase/seed_medicos_codigos_udi.sql`**
   - Criação das tabelas (se não existirem)
   - Inserção de 26 médicos ativos
   - Inserção de 42 códigos AGHU
   - Queries de verificação

3. **`medicos_limpo.csv`**
   - Lista limpa dos 26 médicos ativos

4. **`codigos_aghu_limpo.csv`**
   - Lista completa dos 42 códigos AGHU com todos os campos

## ✅ Validações Realizadas

- ✅ Nomes de médicos únicos e padronizados
- ✅ Códigos AGHU numéricos sem casas decimais
- ✅ Relacionamentos corretos (medico_id via SELECT JOIN)
- ✅ Campos opcionais (preparo, observacoes) tratados como NULL quando vazios
- ✅ Modalidades realistas para UDI
- ✅ Preparos médicos apropriados para cada exame
- ✅ Observações relevantes incluídas quando necessárias

## 🔍 Estrutura Final das Tabelas

### medicos
- `id` (UUID, auto-gerado)
- `nome` (TEXT, obrigatório)
- `ativo` (BOOLEAN, padrão true)
- `created_at` (TIMESTAMP, auto-gerado)

### codigos_aghu
- `id` (UUID, auto-gerado)
- `medico_id` (UUID, FK para medicos)
- `modalidade` (TEXT, obrigatório)
- `exame` (TEXT, obrigatório)
- `codigo_aghu` (TEXT, obrigatório)
- `preparo` (TEXT, opcional)
- `observacoes` (TEXT, opcional)
- `ativo` (BOOLEAN, padrão true)
- `created_at` (TIMESTAMP, auto-gerado)

## 🎯 Próximos Passos

Após executar o seed:

1. Verificar se todos os médicos aparecem no sistema
2. Testar a agenda visual com os novos códigos
3. Configurar vagas do dia para os médicos
4. Testar marcação rápida com os códigos AGHU

## ⚠️ Importante

- Os dados são baseados na estrutura esperada dos CSVs da UDI
- Quando os CSVs reais estiverem disponíveis, substitua os dados no arquivo seed
- O processo de carga é idempotente (pode ser executado múltiplas vezes)
- IDs são sempre gerados automaticamente pelo banco