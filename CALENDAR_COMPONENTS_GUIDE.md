# Guia de Componentes de Calendário

## 📋 Visão Geral

Este documento descreve os novos componentes visuais de calendário criados para melhorar a experiência de visualização de vagas na unidade de imagem.

## 🎯 Componentes Criados

### 1. **VagaIndicator** (`src/components/VagaIndicator.tsx`)

Componente reutilizável para exibir o status de vagas de forma visual e intuitiva.

#### Props

```typescript
interface VagaIndicatorProps {
  total: number;              // Total de vagas disponíveis
  preenchidas: number;        // Número de vagas preenchidas
  status?: VagaStatus;        // Status: 'livre' | 'ocupada' | 'bloqueada' | 'feriado'
  size?: 'sm' | 'md' | 'lg';  // Tamanho dos boxes: pequeno, médio ou grande
  showLabel?: boolean;        // Mostrar label com contagem (padrão: true)
}
```

#### Status e Símbolos

| Status    | Símbolo | Cor                    | Caso de Uso                    |
|-----------|---------|------------------------|--------------------------------|
| livre     | □       | Branco c/ borda cinza  | Vaga disponível para marcação  |
| ocupada   | ■       | Laranja com sombra     | Vaga preenchida                |
| bloqueada | ⛔      | Vermelho claro         | Horário indisponível/fechado   |
| feriado   | 🔴      | Vermelho vibrante      | Dia com atendimento suspenso   |

#### Exemplos de Uso

```typescript
// Exemplo 1: Mostrar vagas com 2 de 5 preenchidas
<VagaIndicator 
  total={5} 
  preenchidas={2} 
  size="md" 
  showLabel={true}
/>

// Exemplo 2: Mostrar dia bloqueado (todos os boxes com ⛔)
<VagaIndicator 
  total={3} 
  preenchidas={0}
  status="bloqueada"
  size="sm"
  showLabel={false}
/>

// Exemplo 3: Mostrar feriado (todos os boxes com 🔴)
<VagaIndicator 
  total={4} 
  preenchidas={0}
  status="feriado"
  size="lg"
  showLabel={true}
/>
```

---

### 2. **AgendaCell** (`src/components/AgendaCell.tsx`)

Componente que representa uma célula do calendário com design inspirado em agendas em papel de hospital.

#### Props

```typescript
interface AgendaCellProps {
  data: Date;                           // Data da célula
  vagasDoDia: AgendaCellData[];        // Array de vagas do dia
  ehMesAtual: boolean;                  // Se é do mês atual
  ehHoje: boolean;                      // Se é o dia de hoje
  ehFimDeSemana?: boolean;              // Se é fim de semana
  esFeriado?: boolean;                  // Se é feriado
}

interface AgendaCellData {
  data: string;                    // ISO format: YYYY-MM-DD
  medicoNome: string;              // Nome do médico
  medico_id: string;               // ID único do médico
  modalidade?: string;             // Tipo de exame (ex: Ultrassom, RX)
  vagas_totais: number;            // Total de vagas
  vagas_preenchidas: number;       // Vagas preenchidas
  vagaStatus?: VagaStatus;         // Status especial (feriado, bloqueado)
}
```

#### Características Visuais

- **Dia de hoje**: Fundo azul claro com indicador visual (ponto azul)
- **Fim de semana**: Badge cinza discreta
- **Feriado**: Fundo vermelho claro com label
- **Dias fora do mês**: Fundo cinza desbotado
- **Cada médico/modalidade**: Separado por linha visual
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

#### Exemplo de Uso

```typescript
<AgendaCell
  data={new Date(2026, 4, 5)}
  vagasDoDia={[
    {
      data: '2026-05-05',
      medicoNome: 'Dr. João Silva',
      medico_id: 'med-001',
      modalidade: 'Ultrassom',
      vagas_totais: 5,
      vagas_preenchidas: 3,
    },
    {
      data: '2026-05-05',
      medicoNome: 'Dra. Maria Santos',
      medico_id: 'med-002',
      modalidade: 'Radiografia',
      vagas_totais: 4,
      vagas_preenchidas: 4,
    }
  ]}
  ehMesAtual={true}
  ehHoje={false}
  ehFimDeSemana={false}
  esFeriado={false}
/>
```

---

## 🔄 Integração na Página Calendario

A página `Calendario.tsx` foi atualizada para:

1. **Importar os componentes**:
   ```typescript
   import { AgendaCell, AgendaCellData } from '../components/AgendaCell';
   ```

2. **Buscar dados de modalidade**:
   - Carrega `codigos_aghu` para obter a modalidade de cada médico
   - Cria um mapa de `medico_id → modalidade` para associação rápida

3. **Estrutura de dados redefinida**:
   ```typescript
   interface VagaDia extends AgendaCellData {
     medico_id: string;
   }
   ```

4. **Renderização com AgendaCell**:
   ```typescript
   {dias.map((dia, index) => (
     <AgendaCell
       key={index}
       data={dia}
       vagasDoDia={filteredVagas.get(dataStr) || []}
       ehMesAtual={ehMesAtual}
       ehHoje={ehHoje}
       ehFimDeSemana={ehFimDeSemana}
       esFeriado={false}
     />
   ))}
   ```

---

## 🚀 Próximos Passos (Funcionalidades Adicionais)

### 1. Suporte a Feriados

Para implementar suporte completo a feriados:

```typescript
// 1. Criar tabela no Supabase
CREATE TABLE feriados (
  id UUID PRIMARY KEY,
  data DATE NOT NULL UNIQUE,
  descricao VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Carregar feriados no Calendario
async function loadFeriados(dataInicio: string, dataFim: string) {
  const { data } = await supabase
    .from('feriados')
    .select('data, descricao')
    .gte('data', dataInicio)
    .lte('data', dataFim);
  
  return new Set(data?.map(f => f.data) || []);
}

// 3. Usar no componente
const feriadosPorData = await loadFeriados(dataInicio, dataFim);
const esFeriado = feriadosPorData.has(dataStr);

<AgendaCell
  // ... outras props
  esFeriado={esFeriado}
/>
```

### 2. Estados Bloqueados

Para marcar horários bloqueados:

```typescript
// 1. Adicionar coluna em vagas_dia
ALTER TABLE vagas_dia ADD COLUMN bloqueado BOOLEAN DEFAULT FALSE;

// 2. Ajustar VagaIndicator
const vagaStatus: VagaStatus = vaga.bloqueado ? 'bloqueada' : 'ocupada';

<VagaIndicator
  total={vaga.vagas_totais}
  preenchidas={vaga.vagas_preenchidas}
  status={vagaStatus}
/>
```

### 3. Eventos de Click nas Células

```typescript
export function AgendaCell({
  // ... props
  onCellClick?: (data: string, medico_id: string) => void;
}) {
  const handleClick = () => {
    onCellClick?.(data.toISOString().split('T')[0], vaga.medico_id);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer ...">
      {/* ... */}
    </div>
  );
}

// No Calendario:
<AgendaCell
  // ... outras props
  onCellClick={(data, medicId) => {
    // Navegar para ou abrir modalidade de marcação
  }}
/>
```

### 4. Tema Escuro

Os componentes usam classes do Tailwind que podem ser customizadas com `dark:` prefixes:

```typescript
// Em VagaIndicator
<div className="text-xs text-gray-600 font-medium dark:text-gray-300">
  {preenchidas} / {total}
</div>
```

---

## 🎨 Customização com Tailwind

### Cores Principais

- **Vagas Livres**: `border-gray-300` + `hover:border-orange-300`
- **Vagas Ocupadas**: `bg-orange-500` + `border-orange-600`
- **Bloqueadas**: `bg-red-100` + `border-red-300`
- **Feriados**: `bg-red-500`
- **Hoje**: `bg-blue-50` + `border-blue-300`

### Responsividade

- **Desktop**: Grid 7 colunas com gap-3
- **Tablet**: Mesmo grid mas com textos ajustados
- **Mobile**: Mantém o grid mas reduz padding

---

## 🔧 Estrutura de Arquivos

```
src/
├── components/
│   ├── VagaIndicator.tsx      # Novo
│   ├── AgendaCell.tsx          # Novo
│   ├── Layout.tsx
│   ├── Notification.tsx
│   └── ...
├── pages/
│   ├── Calendario.tsx          # Atualizado
│   └── ...
└── ...
```

---

## 📊 Fluxo de Dados

```
Calendario.tsx
├── loadMedicos()
│   └── medicos: { id, nome }[]
│
├── loadCalendario()
│   ├── vagas_dia + medicos JOIN
│   ├── codigos_aghu (para modalidade)
│   ├── marcacoes (para preenchidas)
│   └── vagasPorDia: Map<date, VagaDia[]>
│
└── Render
    ├── getDiasDoMes() → Date[]
    └── AgendaCell (renderizado para cada dia)
        └── VagaIndicator (renderizado para cada médico)
```

---

## ⚠️ Considerações

1. **Performance**: Com muitos médicos por dia, considere paginação horizontal
2. **Acessibilidade**: Os símbolos (□, ■, ⛔, 🔴) têm `title` attributes
3. **Localização**: Textos em português - alterar conforme necessário
4. **Tipos TypeScript**: Todas as props são tipadas para segurança

---

## 📝 Notas de Implementação

- ✅ Componentes criados com TypeScript
- ✅ Totalmente compatível com Tailwind CSS
- ✅ Sem quebra de estrutura do projeto
- ✅ Reutilizáveis em outras páginas
- ✅ Responsivos e acessíveis
- ⏳ Dados de modalidade agora inclusos
- ⏳ Legenda visual melhorada com 4 estados

