# Exemplos de Extensão - Componentes de Calendário

## 1️⃣ Implementação de Feriados

### Passo 1: Schema do Banco de Dados

```sql
-- Tabela de feriados
CREATE TABLE feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'nacional', -- 'nacional', 'municipal', 'hospital'
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para consultas rápidas
CREATE INDEX idx_feriados_data ON feriados(data);
```

### Passo 2: Atualizar Calendario.tsx

```typescript
// Adicionar estado para feriados
const [feriadosPorData, setFeriadosPorData] = useState<Set<string>>(new Set());

// Função para carregar feriados
async function loadFeriados(dataInicio: string, dataFim: string) {
  try {
    const { data } = await supabase
      .from('feriados')
      .select('data, nome, descricao')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .eq('ativo', true);

    if (data) {
      const feriadoSet = new Set(data.map(f => f.data));
      setFeriadosPorData(feriadoSet);
    }
  } catch (error) {
    console.error('Erro ao carregar feriados:', error);
  }
}

// Chamar em loadCalendario()
useEffect(() => {
  loadMedicos();
  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);

  const dataInicio = primeiroDia.toISOString().split('T')[0];
  const dataFim = ultimoDia.toISOString().split('T')[0];

  loadFeriados(dataInicio, dataFim);
  loadCalendario();
}, [mesAtual]);

// Usar na renderização
{dias.map((dia, index) => {
  const dataStr = dia.toISOString().split('T')[0];
  const esFeriado = feriadosPorData.has(dataStr);

  return (
    <AgendaCell
      // ... outras props
      esFeriado={esFeriado}
    />
  );
})}
```

---

## 2️⃣ Implementação de Bloqueios de Horários

### Passo 1: Schema do Banco de Dados

```sql
-- Adicionar coluna à tabela vagas_dia
ALTER TABLE vagas_dia 
ADD COLUMN bloqueado BOOLEAN DEFAULT FALSE,
ADD COLUMN motivo_bloqueio VARCHAR(255),
ADD COLUMN bloqueado_em TIMESTAMP;

-- Tabela alternativa: bloqueios_agenda (mais flexível)
CREATE TABLE bloqueios_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES medicos(id),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  descricao VARCHAR(255),
  tipo VARCHAR(50) DEFAULT 'indisponibilidade', -- 'indisponibilidade', 'manutencao', 'evento'
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bloqueios_medico_data ON bloqueios_agenda(medico_id, data_inicio, data_fim);
```

### Passo 2: Atualizar VagaIndicator.tsx

```typescript
export type VagaStatus = 'livre' | 'ocupada' | 'bloqueada' | 'feriado' | 'manutencao';

const statusSymbols: Record<VagaStatus, string> = {
  livre: '□',
  ocupada: '■',
  bloqueada: '⛔',
  feriado: '🔴',
  manutencao: '🔧',
};

function getStatusClasses(status: VagaStatus): string {
  const baseClasses = 'rounded-md border-2 transition-all transform hover:scale-110 flex items-center justify-center font-semibold';

  switch (status) {
    case 'manutencao':
      return `${baseClasses} bg-yellow-100 border-yellow-400 text-yellow-700`;
    // ... outros casos
  }
}
```

### Passo 3: Atualizar Calendario.tsx

```typescript
// Função para carregar bloqueios
async function loadBloqueios(dataInicio: string, dataFim: string, medicId?: string) {
  try {
    let query = supabase
      .from('bloqueios_agenda')
      .select('medico_id, data_inicio, data_fim, tipo')
      .lte('data_inicio', dataFim)
      .gte('data_fim', dataInicio)
      .eq('ativo', true);

    if (medicId) {
      query = query.eq('medico_id', medicId);
    }

    const { data } = await query;
    
    // Converter para estrutura por (medico_id, data)
    const bloqueiosMap = new Map<string, VagaStatus>();
    
    data?.forEach((bloqueio: any) => {
      const dataAtual = new Date(bloqueio.data_inicio);
      const dataFimObj = new Date(bloqueio.data_fim);

      while (dataAtual <= dataFimObj) {
        const key = `${bloqueio.medico_id}-${dataAtual.toISOString().split('T')[0]}`;
        const status = bloqueio.tipo === 'manutencao' ? 'manutencao' : 'bloqueada';
        bloqueiosMap.set(key, status);
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    });

    return bloqueiosMap;
  } catch (error) {
    console.error('Erro ao carregar bloqueios:', error);
    return new Map();
  }
}

// Usar na renderização
const bloqueiosMap = await loadBloqueios(dataInicio, dataFim);

// Para cada vaga
const blockedKey = `${vaga.medico_id}-${vaga.data}`;
const vagaStatus: VagaStatus = bloqueiosMap.get(blockedKey) || 'ocupada';

<VagaIndicator
  total={vaga.vagas_totais}
  preenchidas={vaga.vagas_preenchidas}
  status={vagaStatus}
/>
```

---

## 3️⃣ Modo Dark (Tema Escuro)

### Atualizar VagaIndicator.tsx

```typescript
function getStatusClasses(status: VagaStatus): string {
  const baseClasses = 'rounded-md border-2 transition-all transform hover:scale-110 flex items-center justify-center font-semibold';

  switch (status) {
    case 'ocupada':
      return `${baseClasses} bg-orange-500 dark:bg-orange-600 border-orange-600 dark:border-orange-700 text-white shadow-sm`;
    case 'bloqueada':
      return `${baseClasses} bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-700 dark:text-red-200`;
    case 'feriado':
      return `${baseClasses} bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700 text-white`;
    case 'livre':
    default:
      return `${baseClasses} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 text-gray-600 dark:text-gray-300`;
  }
}
```

### Atualizar AgendaCell.tsx

```typescript
function getBackgroundColor(ehHoje: boolean, ehMesAtual: boolean, esFeriado: boolean): string {
  if (esFeriado) {
    return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700';
  }
  if (ehHoje) {
    return 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 shadow-lg hover:shadow-xl';
  }
  if (ehMesAtual) {
    return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-md';
  }
  return 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400';
}
```

---

## 4️⃣ Interatividade - Modal de Marcação

### Adicionar ao AgendaCell.tsx

```typescript
interface AgendaCellProps {
  // ... outras props
  onVagaClick?: (vaga: AgendaCellData) => void;
  onDateClick?: (data: string) => void;
}

export function AgendaCell({
  // ... outros props
  onVagaClick,
  onDateClick,
}: AgendaCellProps) {
  return (
    <div
      className={`min-h-44 rounded-xl border-2 p-4 transition-all cursor-pointer ${bgColor}`}
      onClick={() => onDateClick?.(dataStr)}
    >
      {/* ... */}
      {vagasDoDia.map((vaga) => (
        <div
          key={`${vaga.medico_id}-${vaga.data}`}
          onClick={() => onVagaClick?.(vaga)}
          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

### Usar no Calendario.tsx

```typescript
const [selectedVaga, setSelectedVaga] = useState<AgendaCellData | null>(null);
const [showMarcacaoModal, setShowMarcacaoModal] = useState(false);

<AgendaCell
  // ... outras props
  onVagaClick={(vaga) => {
    setSelectedVaga(vaga);
    setShowMarcacaoModal(true);
  }}
/>

{showMarcacaoModal && selectedVaga && (
  <MarcacaoModal
    vaga={selectedVaga}
    onClose={() => {
      setShowMarcacaoModal(false);
      setSelectedVaga(null);
    }}
    onSuccess={() => {
      loadCalendario(); // Recarregar calendário
      setShowMarcacaoModal(false);
    }}
  />
)}
```

---

## 5️⃣ Exportação de PDF/Relatório

### Função Utilitária

```typescript
// src/lib/calendar-export.ts

export async function exportCalendarioToPDF(
  mes: Date,
  vagasPorDia: Map<string, VagaDia[]>
) {
  // Usar biblioteca como jsPDF ou React-PDF
  // Gerar PDF com grid do calendário
}

export function exportCalendarioToCSV(
  mes: Date,
  vagasPorDia: Map<string, VagaDia[]>
) {
  // Gerar CSV com agendamento
}
```

### Adicionar Botão ao Calendario

```typescript
<button
  onClick={() => exportCalendarioToPDF(mesAtual, vagasPorDia)}
  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
>
  📥 Download PDF
</button>
```

---

## 6️⃣ Filtros Avançados

### Estado e Handlers

```typescript
const [filtros, setFiltros] = useState({
  medico: '',
  modalidade: '',
  statusVagas: 'todas', // 'todas', 'disponiveis', 'preenchidas'
  mostrarFeriados: true,
});

function aplicarFiltros() {
  let resultado = vagasPorDia;

  // Filtrar por médico
  if (filtros.medico) {
    resultado = new Map(
      Array.from(resultado).map(([data, vagas]) => [
        data,
        vagas.filter(v => v.medico_id === filtros.medico),
      ])
    );
  }

  // Filtrar por modalidade
  if (filtros.modalidade) {
    resultado = new Map(
      Array.from(resultado).map(([data, vagas]) => [
        data,
        vagas.filter(v => v.modalidade === filtros.modalidade),
      ])
    );
  }

  // Filtrar por status de vagas
  if (filtros.statusVagas === 'disponiveis') {
    resultado = new Map(
      Array.from(resultado).map(([data, vagas]) => [
        data,
        vagas.filter(v => v.vagas_preenchidas < v.vagas_totais),
      ])
    );
  } else if (filtros.statusVagas === 'preenchidas') {
    resultado = new Map(
      Array.from(resultado).map(([data, vagas]) => [
        data,
        vagas.filter(v => v.vagas_preenchidas === v.vagas_totais),
      ])
    );
  }

  return resultado;
}
```

---

## 📦 Todas as Extensões em Um Lugar

Para usar todos esses recursos juntos, organize assim:

```typescript
interface CalendarioState {
  mesAtual: Date;
  vagasPorDia: Map<string, VagaDia[]>;
  feriadosPorData: Set<string>;
  bloqueiosMap: Map<string, VagaStatus>;
  filtros: FiltrosState;
  selectedVaga: VagaCellData | null;
  showMarcacaoModal: boolean;
}
```

---

## 🎓 Dicas de Implementação

1. **Performance**: Use `useMemo` para cálculos de filtros
2. **Acessibilidade**: Adicione `aria-labels` em todos os componentes
3. **Testes**: Crie testes para VagaIndicator com diferentes props
4. **Documentação**: Mantenha o CALENDAR_COMPONENTS_GUIDE.md atualizado
5. **Versionamento**: Marque versões ao adicionar features novas

