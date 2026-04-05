# 🔌 Guia de Integração - Bloqueios com Componentes Existentes

## 📍 Passo a Passo de Integração

### Passo 1: Executar Migration no Supabase

Copie o código de `supabase/migrations/20260405_create_bloqueios_agenda.sql` e execute no SQL Editor do Supabase.

---

### Passo 2: Integrar com Calendario.tsx

**Localização**: `src/pages/Calendario.tsx`

**Adicione ao topo**:
```typescript
import { useBloqueios } from '../hooks/useBloqueios';
import { BloqueioIndicator, BloqueioOverlay } from '../components/BloqueioIndicator';
```

**Dentro do componente**:
```typescript
export function Calendario() {
  // ... código existente ...
  const { verificarDiaBloqueado } = useBloqueios();

  // ... resto do código ...

  return (
    <div>
      {/* ... codigo existente ... */}

      <div className="grid grid-cols-7 gap-3 auto-rows-max">
        {dias.map((dia, index) => {
          const dataStr = dia.toISOString().split('T')[0];
          const vagasDoDia = filteredVagas.get(dataStr) || [];
          const ehMesAtual = dia.getMonth() === mesAtual.getMonth();
          const ehHoje = dataStr === new Date().toISOString().split('T')[0];
          const ehFimDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
          
          // ✨ NOVO: Verificar bloqueio
          const bloqueio = filterMedico ? verificarDiaBloqueado(filterMedico, dataStr) : null;

          return (
            <div key={index} className="relative">
              {/* ✨ NOVO: Mostrar overlay se bloqueado */}
              {bloqueio && (
                <div className="absolute inset-0 rounded-xl z-20 pointer-events-none">
                  <BloqueioOverlay bloqueio={bloqueio} showDetails={false} />
                </div>
              )}

              <AgendaCell
                data={dia}
                vagasDoDia={bloqueio ? [] : vagasDoDia}
                ehMesAtual={ehMesAtual}
                ehHoje={ehHoje}
                ehFimDeSemana={ehFimDeSemana}
                esFeriado={!!bloqueio}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Passo 3: Adicionar Botão de Gerenciar Bloqueios

**Em Vagas.tsx ou Dashboard.tsx**:

```typescript
import { useState } from 'react';
import { BloqueioDialog } from '../components/BloqueioDialog';
import { Lock } from 'lucide-react';

export function MedicosTable() {
  const [showBloqueioDialog, setShowBloqueioDialog] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<any>(null);

  const handleOpenBloqueios = (medico: any) => {
    setSelectedMedico(medico);
    setShowBloqueioDialog(true);
  };

  return (
    <>
      {/* Tabela de médicos */}
      <table className="w-full">
        <tbody>
          {medicos.map((medico) => (
            <tr key={medico.id}>
              <td>{medico.nome}</td>
              <td>
                <button
                  onClick={() => handleOpenBloqueios(medico)}
                  className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <Lock size={16} />
                  Bloqueios
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dialog de Bloqueios */}
      <BloqueioDialog
        isOpen={showBloqueioDialog}
        medicoId={selectedMedico?.id || ''}
        medicoNome={selectedMedico?.nome || ''}
        onClose={() => setShowBloqueioDialog(false)}
        onBloqueioCreated={() => {
          // Recarregar dados se necessário
          console.log('Novo bloqueio criado');
        }}
      />
    </>
  );
}
```

---

### Passo 4: Impedir Marcações em Períodos Bloqueados

**Em Marcacao.tsx**:

```typescript
import { useBloqueios } from '../hooks/useBloqueios';
import { Notification } from '../components/Notification';

export function Marcacao() {
  const { verificarDiaBloqueado } = useBloqueios();
  const [notification, setNotification] = useState<NotificationState>(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [medicoSelected, setMedicoSelected] = useState('');

  const handleMarcacao = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✨ NOVO: Verificar bloqueio antes de marcar
    const bloqueio = verificarDiaBloqueado(medicoSelected, dataSelecionada);

    if (bloqueio) {
      setNotification({
        type: 'warning',
        message: `❌ Médico indisponível nesta data: ${bloqueio.descricao || bloqueio.motivo}`,
      });
      return;
    }

    // Continuar com marcação normal
    try {
      const { error } = await supabase.from('marcacoes').insert({
        medico_id: medicoSelected,
        data: dataSelecionada,
        // ... outros campos
      });

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Marcação realizada com sucesso!',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao realizar marcação',
      });
    }
  };

  return (
    <form onSubmit={handleMarcacao}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Inputs existentes */}
      
      <button type="submit">
        Marcar Consulta
      </button>
    </form>
  );
}
```

---

### Passo 5: Validar Conflitos de Bloqueio na API

**Criar função utilitária** `src/lib/bloqueios.utils.ts`:

```typescript
import { supabase } from './supabase';

/**
 * Verifica se há conflito entre um novo bloqueio e outros existentes
 */
export async function verificarConflitoBloqueio(
  medicoId: string,
  dataInicio: string,
  dataFim: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('bloqueios_agenda')
      .select('id')
      .eq('medico_id', medicoId)
      .eq('ativo', true)
      .lte('data_inicio', dataFim)
      .gte('data_fim', dataInicio);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Erro ao verificar conflito:', error);
    return false;
  }
}

/**
 * Lista medicos que estão bloqueados em uma data
 */
export async function obterMedicosBloqueadosEmData(data: string) {
  try {
    const { data: bloqueios, error } = await supabase
      .from('bloqueios_agenda')
      .select('medico_id, medico:medicos(nome), motivo, descricao')
      .eq('ativo', true)
      .lte('data_inicio', data)
      .gte('data_fim', data);

    if (error) throw error;
    return bloqueios || [];
  } catch (error) {
    console.error('Erro ao obter medicos bloqueados:', error);
    return [];
  }
}
```

---

## 🎯 Checklist de Integração

- [ ] Migration executada no Supabase
- [ ] Hook `useBloqueios` importado em `Calendario.tsx`
- [ ] Overlay de bloqueio mostrando em células
- [ ] Botão "Bloqueios" adicionado em Vagas/Dashboard
- [ ] `BloqueioDialog` funcional
- [ ] Validação em `Marcacao.tsx`
- [ ] Testes locais passando
- [ ] Dark mode funcionando
- [ ] Mensagens de erro claras

---

## 🧪 Teste Manual

### Cenário 1: Criar Bloqueio
1. Abrir Vagas/Dashboard
2. Clicar em "🔒 Bloqueios" de um médico
3. Clicar em "Novo Bloqueio"
4. Preencher:
   - Data Início: 2026-04-15
   - Data Fim: 2026-04-20
   - Motivo: Férias
   - Descrição: Férias planejadas
5. Salvar
6. Verificar se aparece na lista

### Cenário 2: Bloquear Calendário
1. Abrir Calendário
2. Filtrar por médico com bloqueio
3. Verificar dias bloqueados exibem overlay
4. Passar mouse para ver tooltip

### Cenário 3: Impedir Marcação
1. Abrir Marcação
2. Selecionar médico bloqueado
3. Selecionar data dentro do bloqueio
4. Tentar marcar
5. Verificar mensagem de erro

---

## 🎨 Customizações Sugeridas

### Adicionar Botão em AgendaCell

Modificar `src/components/AgendaCell.tsx`:

```typescript
interface AgendaCellProps {
  // ... props existentes ...
  onBloqueioClick?: () => void;
}

export function AgendaCell({
  // ... props ...
  onBloqueioClick,
}: AgendaCellProps) {
  return (
    <div className="relative">
      {/* ... código existente ... */}
      
      {onBloqueioClick && (
        <button
          onClick={onBloqueioClick}
          className="absolute top-2 right-2 text-lg hover:scale-110 transition-transform"
          title="Gerenciar bloqueios"
        >
          🔒
        </button>
      )}
    </div>
  );
}
```

---

## 📞 Suporte Rápido

**Hook não encontrado?**
- Verificar se arquivo `src/hooks/useBloqueios.ts` existe
- Executar `npm run typecheck`

**Migration falha?**
- Verificar se já existe tabela `bloqueios_agenda`
- Droppar tabela e recriar se necessário

**Bloqueios não aparecem?**
- Verificar se `ativo = true` no Supabase
- Verificar datas no formato ISO (YYYY-MM-DD)

**Componentes não carregam?**
- Verificar imports
- Limpar cache: `npm cache clean --force`
- Rodar: `npm run dev`

