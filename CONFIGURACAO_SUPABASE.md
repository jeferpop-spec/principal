# 🔧 CONFIGURAÇÃO DO SUPABASE - PASSO A PASSO

## ❌ Problema Atual:
A aplicação está carregando, mas não consegue conectar ao Supabase porque as credenciais estão incorretas.

## ✅ Solução: Configure o Supabase

### Passo 1: Criar projeto no Supabase
1. Acesse: https://supabase.com
2. Clique: "New Project"
3. Preencha os dados do projeto
4. Aguarde a criação (~2 minutos)

### Passo 2: Obter as credenciais
1. No painel do projeto, vá em: **Settings → API**
2. Copie:
   - **Project URL** (ex: `https://abcdefghijk.supabase.co`)
   - **anon/public key** (chave longa começando com `eyJ...`)

### Passo 3: Configurar arquivo .env
Edite o arquivo `.env` na raiz do projeto:

```env
# Substitua pelos valores reais do seu projeto
VITE_SUPABASE_URL=https://SEU_PROJETO_AQUI.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA_AQUI
```

### Passo 4: Executar scripts SQL no Supabase
1. Abra o **SQL Editor** no painel do Supabase
2. Execute primeiro: `supabase/migrations/20260405_add_updated_at_and_constraints_udi.sql`
3. Execute depois: `supabase/seed_medicos_codigos_udi.sql`

### Passo 5: Reiniciar aplicação
```bash
# Pare o servidor (Ctrl+C no terminal)
npm run dev
```

## 🎯 Resultado Esperado:
- ✅ Médicos aparecem no Dashboard
- ✅ Códigos aparecem na página Códigos
- ✅ Todas as funcionalidades funcionam

## 🔍 Verificar se está funcionando:
Após configurar, você deve ver:
- Dashboard: "17 médicos" e "1.292 códigos"
- Página Códigos: Lista com médicos e códigos
- Menus funcionais

---
**IMPORTANTE:** Sem essas credenciais corretas, a aplicação não consegue acessar o banco de dados!