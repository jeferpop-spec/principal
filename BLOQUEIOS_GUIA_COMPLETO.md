# 🔒 Bloqueio de Agenda Médica - Guia Completo

## 📋 Visão Geral

Sistema completo para gerenciar bloqueios de agenda médica com:
- ✅ Cadastro de bloqueios por período
- ✅ Múltiplos motivos (Férias, Licença, Afastamento, Abono, Indisponibilidade)
- ✅ Integração com calendário visual
- ✅ Impede marcações em períodos bloqueados
- ✅ Dashboard de gerenciamento
- ✅ Suporte a Dark Mode

---

## 📁 Arquivos Criados

```
Supabase (SQL):
├─ supabase/migrations/
│  └─ 20260405_create_bloqueios_agenda.sql

Tipos & Validações:
├─ src/lib/
│  ├─ bloqueios.types.ts         (Tipos e interfaces)
│  └─ bloqueios.validations.ts   (Validações)

Hooks:
├─ src/hooks/
│  └─ useBloqueios.ts            (Hook principal)

Componentes:
├─ src/components/
│  ├─ BloqueioForm.tsx           (Formulário)
│  ├─ BloqueiosList.tsx          (Lista)
│  ├─ BloqueioDialog.tsx         (Modal)
│  └─ BloqueioIndicator.tsx      (Indicadores visuais)
```

---

## 🚀 Quick Start

### 1. Executar Migration no Supabase

```sql
-- Execute em: https://supabase.com/dashboard
-- Copie o conteúdo de: supabase/migrations/20260405_create_bloqueios_agenda.sql
```

### 2. Importar no Projeto

```typescript
// Em qualquer componente que precise usar bloqueios:
import { useBloqueios } from '../hooks/useBloqueios';
import { BloqueioDialog } from '../components/BloqueioDialog';
import { BloqueioIndicator } from '../components/BloqueioIndicator';
```

### 3. Usar o Hook

```typescript
export function MeuComponente() {
  const {
    bloqueios,
    criarBloqueio,
    atualizarBloqueio,
    deletarBloqueio,
    verificarDiaBloqueado,
    carregarBloqueiosPorMedico,
  } = useBloqueios();

  // Verificar se um dia está bloqueado
  const bloqueio = verificarDiaBloqueado('medico-123', '2026-04-15');
  
  if (bloqueio) {
    console.log(`Dia bloqueado! Motivo: ${bloqueio.motivo}`);
  }
}
```

---

## 🎯 Casos de Uso

### 1️⃣ Gerenciar Bloqueios (Modal Completa)

```typescript
import { useState } from 'react';
import { BloqueioDialog } from '../components/BloqueioDialog';

export function MedicosPage() {
  const [selectedMedicoId, setSelectedMedicoId] = useState<string | null>(null);
  const [showBloqueioDialog, setShowBloqueioDialog] = useState(false);
  const [selectedMedicoNome, setSelectedMedicoNome] = useState('');

  const handleOpenBloqueios = (medicId: string, medicoNome: string) => {
    setSelectedMedicoId(medicId);
    setSelectedMedicoNome(medicoNome);
    setShowBloqueioDialog(true);
  };

  return (
    <>
      {/* Clique em médico */}
      {medicos.map((medico) => (
        <button
          key={medico.id}
          onClick={() => handleOpenBloqueios(medico.id, medico.nome)}
          className="p-2 hover:bg-gray-100"
        >
          {medico.nome} 🔒
        </button>
      ))}

      {/* Dialog */}
      <BloqueioDialog
        isOpen={showBloqueioDialog}
        medicoId={selectedMedicoId || ''}
        medicoNome={selectedMedicoNome}
        onClose={() => setShowBloqueioDialog(false)}
        onBloqueioCreated={() => {
          // Recarregar calendário ou dados
          console.log('Bloqueio criado!');
        }}
      />
    </>
  );
}
```

### 2️⃣ Integrar com Calendário

Modificar `src/pages/Calendario.tsx`:

```typescript
import { useBloqueios } from '../hooks/useBloqueios';
import { BloqueioIndicator } from '../components/BloqueioIndicator';
import { AgendaCell } from '../components/AgendaCell';

export function Calendario() {
  const { verificarDiaBloqueado } = useBloqueios();

  // ... código existente ...

  const dias = getDiasDoMes();

  return (
    <div className="grid grid-cols-7 gap-3">
      {dias.map((dia) => {
        const dataStr = dia.toISOString().split('T')[0];
        const vagasDoDia = filteredVagas.get(dataStr) || [];
        const bloqueio = verificarDiaBloqueado(filterMedico, dataStr);

        return (
          <div key={dataStr} className="relative">
            {bloqueio && (
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900 rounded-xl opacity-70 z-10 flex items-center justify-center">
                <BloqueioIndicator bloqueio={bloqueio} size="sm" showDetails={false} />
              </div>
            )}

            <AgendaCell
              data={dia}
              vagasDoDia={bloqueio ? [] : vagasDoDia}
              ehMesAtual={ehMesAtual}
              ehHoje={ehHoje}
              esFeriado={!!bloqueio}
            />
          </div>
        );
      })}
    </div>
  );
}
```

### 3️⃣ Impedir Marcações em Períodos Bloqueados

Modificar a lógica de marcação (ex: em `Marcacao.tsx`):

```typescript
import { useBloqueios } from '../hooks/useBloqueios';

export function Marcacao() {
  const { verificarDiaBloqueado } = useBloqueios();
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [medicoSelecionado, setMedicoSelecionado] = useState('');

  const handleMarcacao = async () => {
    // Verificar bloqueio
    const bloqueio = verificarDiaBloqueado(medicoSelecionado, dataSelecionada);
    
    if (bloqueio) {
      setNotification({
        type: 'error',
        message: `Médico indisponível: ${bloqueio.descricao || bloqueio.motivo}`,
      });
      return;
    }

    // Continuar com marcação normal
    await criarMarcacao({
      medico_id: medicoSelecionado,
      data: dataSelecionada,
      // ... outros campos
    });
  };

  return (
    // ... formulário ...
  );
}
```

### 4️⃣ Mostrar Bloqueios na Página de Vagas

Modificar `src/pages/Vagas.tsx` para adicionar botão de bloqueios:

```typescript
import { BloqueioDialog } from '../components/BloqueioDialog';

export function Vagas() {
  const [showBloqueios, setShowBloqueios] = useState(false);
  const [selectedMedicoId, setSelectedMedicoId] = useState('');

  return (
    <>
      <table>
        <tbody>
          {medicos.map((medico) => (
            <tr key={medico.id}>
              <td>{medico.nome}</td>
              <td>
                <button
                  onClick={() => {
                    setSelectedMedicoId(medico.id);
                    setShowBloqueios(true);
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  🔒 Gerenciar Bloqueios
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <BloqueioDialog
        isOpen={showBloqueios}
        medicoId={selectedMedicoId}
        medicoNome={medicos.find(m => m.id === selectedMedicoId)?.nome || ''}
        onClose={() => setShowBloqueios(false)}
      />
    </>
  );
}
```

---

## 🎨 Componentes Mapa

### BloqueioForm
- **Uso**: Formulário para criar/editar bloqueios
- **Props**: medicoId, medicoNome, bloqueioExistente, onSubmit, onCancel
- **Valida**: Datas, motivo, duração máxima (365 dias)

### BloqueiosList
- **Uso**: Lista os bloqueios de um médico
- **Props**: bloqueios, onEdit, onDelete, loading
- **Mostra**: Motivo com emoji, duração, observações

### BloqueioDialog
- **Uso**: Modal completa com CRUD de bloqueios
- **Props**: isOpen, medicoId, medicoNome, onClose
- **Features**: Criar, editar, deletar, listar

### BloqueioIndicator
- **Uso**: Badge mostra status visual de bloqueio
- **Props**: bloqueio, diasRestantes, size
- **Variações**: Indicador, Overlay, Tooltip

---

## 📊 Hook useBloqueios API

```typescript
const {
  // Estado
  bloqueios,                    // BloqueioAgenda[]
  bloqueiosPorMedico,          // Map<medicoId, BloqueioAgenda[]>
  loading,                     // boolean
  error,                       // string | null
  diasBloqueados,              // Map<data-medicoId, DiaBloqueado>

  // CRUD
  criarBloqueio,              // (CreateBloqueioDTO) => Promise<BloqueioAgenda | null>
  atualizarBloqueio,          // (id, UpdateBloqueioDTO) => Promise<BloqueioAgenda | null>
  deletarBloqueio,            // (id) => Promise<boolean>

  // Queries
  carregarBloqueios,          // (dataInicio?, dataFim?) => Promise<void>
  carregarBloqueiosPorMedico, // (medicoId, meses?) => Promise<BloqueioAgenda[]>
  verificarDiaBloqueado,      // (medicoId, data) => BloqueioAgenda | null
  obterDiasBloqueadosIntervalo, // (medicoId, dataInicio, dataFim) => DiaBloqueado[]
  verificarConflito,          // (medicoId, dataInicio, dataFim) => boolean

  // Utils
  limpar,                      // () => void
} = useBloqueios();
```

---

## 🔒 Segurança

### RLS (Row Level Security)

Configurado no Supabase:
- ✅ Qualquer um pode ler bloqueios ativos
- ✅ Apenas admin/staff/médico pode criar
- ✅ Apenas admin/staff/owner pode editar
- ✅ Apenas admin pode deletar

### Validações

```typescript
const validacoes = validarBloqueio({
  medico_id: 'med-123',
  data_inicio: '2026-04-15',
  data_fim: '2026-04-25',
  motivo: 'ferias',
  descricao: 'Férias em Paris',
});

const erro = obterPrimeiroErro(validacoes);
if (erro) {
  console.error(erro); // "Data de fim não pode ser no passado"
}
```

---

## 🎨 Estilos e Cores

### Por Motivo:

| Motivo | Cor | Emoji |
|--------|-----|-------|
| Férias | Amarelo | 🏖️ |
| Licença | Azul | 📋 |
| Afastamento | Laranja | ⚠️ |
| Abono | Verde | ✓ |
| Indisponibilidade | Vermelho | 🚫 |

Customizável em `motivosBloqueio` dentro de `bloqueios.types.ts`

---

## 🧪 Exemplos Avançados

### Verificar Conflitos de Bloqueio

```typescript
const { verificarConflito } = useBloqueios();

const temConflito = verificarConflito(
  'medico-123',
  '2026-04-15',
  '2026-04-20'
);

if (temConflito) {
  console.log('Já existe bloqueio nesse período!');
}
```

### Obter Dias Bloqueados em Intervalo

```typescript
const { obterDiasBloqueadosIntervalo } = useBloqueios();

const diasBloqueados = obterDiasBloqueadosIntervalo(
  'medico-123',
  '2026-04-01',
  '2026-04-30'
);

diasBloqueados.forEach(dia => {
  console.log(`${dia.data}: bloqueado por ${dia.bloqueio.diasRestantes} dias`);
});
```

### Criar Bloqueio com Validação

```typescript
const { criarBloqueio } = useBloqueios();

const novoBloqueio = await criarBloqueio({
  medico_id: 'medico-123',
  data_inicio: '2026-04-15',
  data_fim: '2026-04-25',
  motivo: 'ferias',
  descricao: 'Férias na Europa',
  observacoes: 'Sem acesso a emails',
});

if (novoBloqueio) {
  console.log('Bloqueio criado:', novoBloqueio.id);
}
```

---

## 📊 Schema do Banco

```sql
Table: bloqueios_agenda
├─ id (UUID, PRIMARY KEY)
├─ medico_id (UUID, FOREIGN KEY)
├─ data_inicio (DATE)
├─ data_fim (DATE)
├─ motivo (VARCHAR: ferias|licenca|afastamento|abono|indisponibilidade)
├─ descricao (VARCHAR, 255)
├─ observacoes (TEXT, 500)
├─ ativo (BOOLEAN)
├─ criado_por (UUID)
├─ criado_em (TIMESTAMP)
└─ atualizado_em (TIMESTAMP)

Índices:
├─ idx_bloqueios_medico
├─ idx_bloqueios_periodo
├─ idx_bloqueios_medico_periodo
└─ idx_bloqueios_ativo
```

---

## ✨ Features Prontas

- ✅ CRUD completo de bloqueios
- ✅ Validações robustas
- ✅ Dark mode support
- ✅ RLS no Supabase
- ✅ Soft delete (marca como inativo)
- ✅ Timestamps automáticos
- ✅ Verificação de conflitos
- ✅ Intervalo de dias bloqueados
- ✅ Múltiplos motivos com cores
- ✅ Observações e descrições

---

## 🚀 Próximas Implementações

1. **Notificações**: Alertar pacientes sobre médico bloqueado
2. **Relatórios**: Gerar relatório de bloqueios por período
3. **Recorrência**: Bloqueios que se repetem (ex: todo ano em férias)
4. **Substituição**: Sugerir médico substituto quando bloqueado
5. **Sincronização**: Sincronizar com calendário externo (Google Calendar)
6. **Cancelamento**: Permitir cancelar bloqueio mais cedo
7. **Histórico**: Rastrear alterações em bloqueios

