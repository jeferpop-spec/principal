# ⚡ Quick Start - Bloqueios de Agenda

## 📦 Arquivos Criados

```
✨ NOVO:
  supabase/migrations/
  └─ 20260405_create_bloqueios_agenda.sql
  
  src/lib/
  ├─ bloqueios.types.ts
  └─ bloqueios.validations.ts
  
  src/hooks/
  └─ useBloqueios.ts
  
  src/components/
  ├─ BloqueioForm.tsx
  ├─ BloqueiosList.tsx
  ├─ BloqueioDialog.tsx
  └─ BloqueioIndicator.tsx
  
  Documentação:
  ├─ BLOQUEIOS_GUIA_COMPLETO.md
  ├─ BLOQUEIOS_INTEGRACAO.md
  └─ QUICK_START_BLOQUEIOS.md (este)
```

---

## 🚀 Setup Rápido (3 passos)

### 1️⃣ Migration no Supabase

1. Abrir: https://supabase.com/dashboard/project/[seu-project]/sql
2. Copiar conteúdo de: `supabase/migrations/20260405_create_bloqueios_agenda.sql`
3. Colar e executar
4. Verificar se tabela `bloqueios_agenda` foi criada ✓

### 2️⃣ Usar o Hook

```typescript
import { useBloqueios } from '../hooks/useBloqueios';

export function MeuComponente() {
  const { verificarDiaBloqueado, criarBloqueio } = useBloqueios();
  
  // Verificar se médico está bloqueado
  const bloqueio = verificarDiaBloqueado('medico-id', '2026-04-15');
  
  if (bloqueio) {
    console.log('✓ Médico está bloqueado:', bloqueio.motivo);
  }
}
```

### 3️⃣ Mostrar Dialog para Gerenciar

```typescript
import { BloqueioDialog } from '../components/BloqueioDialog';
import { useState } from 'react';

export function MinhaPage() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        🔒 Gerenciar Bloqueios
      </button>

      <BloqueioDialog
        isOpen={showDialog}
        medicoId="medico-123"
        medicoNome="Dr. João Silva"
        onClose={() => setShowDialog(false)}
      />
    </>
  );
}
```

---

## 🎯 Exemplos Prontos

### Proteger Marcações

```typescript
const { verificarDiaBloqueado } = useBloqueios();

const handleMarcar = async (medicoId: string, data: string) => {
  // ✨ Verificar blocking
  if (verificarDiaBloqueado(medicoId, data)) {
    alert('❌ Médico indisponível nesta data');
    return;
  }

  // ✓ Proceder com marcação
  await criarMarcacao(medicoId, data);
};
```

### Integrar com Calendário

```typescript
import { BloqueioOverlay } from '../components/BloqueioIndicator';

export function MeuCalendario() {
  const { verificarDiaBloqueado } = useBloqueios();

  return (
    <div className="grid grid-cols-7">
      {dias.map((dia) => {
        const bloqueio = verificarDiaBloqueado(medicoId, dia);
        
        return (
          <div key={dia} className="relative">
            {bloqueio && <BloqueioOverlay bloqueio={bloqueio} />}
            {/* Celula normal */}
          </div>
        );
      })}
    </div>
  );
}
```

### Criar Bloqueio Programaticamente

```typescript
import { useBloqueios } from '../hooks/useBloqueios';

export function BloquearFerias() {
  const { criarBloqueio } = useBloqueios();

  const bloqueioFerias = await criarBloqueio({
    medico_id: 'medico-123',
    data_inicio: '2026-07-01',
    data_fim: '2026-07-31',
    motivo: 'ferias',
    descricao: 'Férias de julho',
    observacoes: 'Aproveite bem!',
  });

  if (bloqueioFerias) {
    console.log('✓ Bloqueio criado:', bloqueioFerias.id);
  }
}
```

---

## 🎨 Motivos Disponíveis

```
🏖️  ferias        - Férias
📋 licenca       - Licença médica/pessoal
⚠️  afastamento   - Afastamento
✓  abono         - Abono/Folga
🚫 indisponibilidade - Indisponibilidade
```

Verifique cores e emojis em `src/lib/bloqueios.types.ts`:

```typescript
const motivosBloqueio = {
  ferias: { label: 'Férias', color: 'bg-yellow-100', icon: '🏖️' },
  // ...
}
```

---

## ⚙️ API do Hook

```typescript
const {
  // Consultas
  verificarDiaBloqueado(medicoId, data)          // → BloqueioAgenda | null
  obterDiasBloqueadosIntervalo(medicoId, ini, fim) // → DiaBloqueado[]
  verificarConflito(medicoId, ini, fim)           // → boolean
  carregarBloqueiosPorMedico(medicoId)            // → Promise<BloqueioAgenda[]>
  
  // Operações
  criarBloqueio(dados)                           // → Promise<BloqueioAgenda | null>
  atualizarBloqueio(id, dados)                   // → Promise<BloqueioAgenda | null>
  deletarBloqueio(id)                            // → Promise<boolean>

  // Estado
  bloqueios                                      // BloqueioAgenda[]
  loading                                        // boolean
  error                                          // string | null
} = useBloqueios();
```

---

## 🔧 Customizar Cores

Editar `src/lib/bloqueios.types.ts`:

```typescript
const motivosBloqueio = {
  ferias: {
    label: 'Férias',
    color: 'bg-yellow-100 text-yellow-800', // ← Mude aqui
    icon: '🏖️',
  },
  // ...
};
```

Tags Tailwind úteis:
- `bg-yellow-100`, `bg-blue-100`, `bg-red-100`
- `text-yellow-800`, `text-blue-800`, `text-red-800`
- Dark mode: `dark:bg-yellow-900`, `dark:text-yellow-200`

---

## 🧪 Testar Localmente

```bash
npm run dev
```

Navegar para página com:
1. Calendário
2. Lista de Médicos
3. Página de Marcação

Ao carregar a página, verificar:
- ✅ Hook carrega bloqueios
- ✅ Dias bloqueados mostram overlay
- ✅ Dialog abre e fecha
- ✅ Formulário valida
- ✅ Novo bloqueio aparece na lista

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Hook não encontrado" | Verificar path: `../hooks/useBloqueios` |
| "Table doesn't exist" | Executar migration no Supabase |
| Bloqueios não carregam | Verificar Supabase RLS permissions |
| Componente em branco | Verificar console para erros TypeScript |

---

## 📚 Documentação Completa

Para mais detalhes:
- **Guia Completo** → `BLOQUEIOS_GUIA_COMPLETO.md`
- **Integração Passo a Passo** → `BLOQUEIOS_INTEGRACAO.md`
- **Código Fonte** → `src/hooks/useBloqueios.ts`

---

## 💡 Dicas Pro

💡 **Reutilização**: BloqueioDialog funciona em qualquer página
💡 **Performance**: Hook cache bloqueios automaticamente
💡 **Segurança**: RLS garante apenas dados autorizados
💡 **TypeScript**: Tudo 100% tipado
💡 **Dark Mode**: Totalmente suportado com `dark:` classes

---

## 🎉 Pronto!

Seu sistema agora tem suporte completo a bloqueios de agenda médica!

Próximos passos:
1. ✅ Executar migration
2. ✅ Testar em uma página
3. ✅ Integrar com componentes existentes
4. ✅ Customizar cores/motivos conforme necessário

💪 Sucesso!

