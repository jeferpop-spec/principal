# ⚡ Quick Start - Calendário Visual

## 📦 Arquivos Criados/Modificados

```
✨ NOVO:
  - src/components/VagaIndicator.tsx
  - src/components/AgendaCell.tsx
  - CALENDAR_COMPONENTS_GUIDE.md
  - CALENDAR_EXTENSIONS.md
  - IMPLEMENTACAO_RESUMO.md
  - QUICKSTART.md (este arquivo)

✏️ MODIFICADO:
  - src/pages/Calendario.tsx
```

---

## 🚀 Começar Agora

### 1. Verificar Imports
`src/pages/Calendario.tsx` já importa automaticamente:
```typescript
import { AgendaCell, AgendaCellData } from '../components/AgendaCell';
```

### 2. Testar Localmente
```bash
# Terminal
npm run dev

# Navegar em: http://localhost:5173
# Clicar em "Calendário"
```

### 3. Verificar se Funciona
- [ ] Componente carrega sem erros
- [ ] Mostra vagas do mês atual
- [ ] Nome do médico aparece
- [ ] Modalidade surge abaixo do nome
- [ ] Boxes de vagas mostram (■ e □)
- [ ] Legenda mostra no final da página

---

## 🎯 Usar em Outra Página

### Exemplo 1: Só VagaIndicator

```typescript
import { VagaIndicator } from '../components/VagaIndicator';

export function MinhaPage() {
  return (
    <div>
      <h1>Status de Vagas</h1>
      <VagaIndicator 
        total={10} 
        preenchidas={3}
        size="lg"
      />
    </div>
  );
}
```

### Exemplo 2: Só AgendaCell

```typescript
import { AgendaCell, AgendaCellData } from '../components/AgendaCell';

export function MinhaOutraPagina() {
  const vagasDodia: AgendaCellData[] = [
    {
      data: '2026-04-10',
      medicoNome: 'Dr. João Silva',
      medico_id: 'med-123',
      modalidade: 'Ultrassom',
      vagas_totais: 5,
      vagas_preenchidas: 2,
    }
  ];

  return (
    <AgendaCell
      data={new Date(2026, 3, 10)}
      vagasDoDia={vagasDodia}
      ehMesAtual={true}
      ehHoje={false}
      esFeriado={false}
    />
  );
}
```

---

## 🔧 Customização Rápida

### Mudar Cor de Vaga Ocupada

**VagaIndicator.tsx**, na função `getStatusClasses()`:

Procure por:
```typescript
case 'ocupada':
  return `${baseClasses} bg-orange-500 border-orange-600 ...`;
```

Mude `orange` para `blue`, `green`, `purple`, etc.

---

### Mudar Cor de "Hoje"

**AgendaCell.tsx**, na função `getBackgroundColor()`:

Procure por:
```typescript
if (ehHoje) {
  return 'bg-blue-50 dark:bg-blue-950 border-blue-300 ...';
}
```

Mude `blue` para qualquer cor do Tailwind.

---

### Mudar Símbolos

**VagaIndicator.tsx**, no objeto `statusSymbols`:

```typescript
const statusSymbols: Record<VagaStatus, string> = {
  livre: '□',        // Mude para ○, ◻, etc
  ocupada: '■',      // Mude para ●, ◼, etc
  bloqueada: '⛔',    // Mude para 🚫, ❌, etc
  feriado: '🔴',     // Mude para 🔵, ⭕, etc
};
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Componentes não aparecem | Verificar `npm run typecheck` |
| Modalidade não mostra | Verificar se há dados em `codigos_aghu` com `ativo=true` |
| Styles não funcionam | Rodar `npm run dev` novamente |
| TypeScript errors | Executar `npm run typecheck` e verificar imports |

---

## 📚 Documentação Completa

Para aprender mais:

1. **Features Básicas** → [IMPLEMENTACAO_RESUMO.md](IMPLEMENTACAO_RESUMO.md)
2. **Documentação Técnica** → [CALENDAR_COMPONENTS_GUIDE.md](CALENDAR_COMPONENTS_GUIDE.md)
3. **Exemplos de Extensão** → [CALENDAR_EXTENSIONS.md](CALENDAR_EXTENSIONS.md)

---

## 💡 Dicas

1. **Props do VagaIndicator:**
   - `size="sm" | "md" | "lg"` → Tamanho das caixas
   - `showLabel={true/false}` → Mostra "2/5"?
   - `status="livre" | "ocupada" | "bloqueada" | "feriado"` → Tipo

2. **Props do AgendaCell:**
   - `ehHoje={true}` → Fundo azul
   - `esFeriado={true}` → Fundo vermelho
   - `ehFimDeSemana={true}` → Badge "Fim de semana"

3. **Debugging:**
   - Console.log os valores antes de passar para componentes
   - Verificar se dados vêm do Supabase corretamente

---

## 🎉 Pronto!

Se tudo deu certo, você tem sistemas completamente funcional!

Para adicionar features como feriados, bloqueios, etc., veja [CALENDAR_EXTENSIONS.md](CALENDAR_EXTENSIONS.md).

