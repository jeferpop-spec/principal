# 🚀 Extensões e Melhorias - Sistema de Bloqueios

Sugestões de funcionalidades adicionais que podem ser implementadas.

---

## 1️⃣ Bloqueios Recorrentes

Bloquear mesmos períodos todos os anos (ex: férias sempre em julho).

### Schema
```sql
CREATE TABLE bloqueios_recorrentes (
  id UUID PRIMARY KEY,
  medico_id UUID NOT NULL REFERENCES medicos(id),
  mes_no_ano INT NOT NULL,  -- 1-12
  dia_inicio INT NOT NULL,   -- 1-31
  dia_fim INT NOT NULL,
  motivo VARCHAR(50),
  nome VARCHAR(255),
  ativo BOOLEAN DEFAULT TRUE
);
```

### Hook
```typescript
async function criarBloqueiosRecorrentes(ano: number) {
  const bloqueiosRec = await supabase
    .from('bloqueios_recorrentes')
    .select('*')
    .eq('ativo', true);

  // Para cada bloqueio recorrente, criar bloqueios_agenda para o ano
  bloqueiosRec.forEach(async (rec) => {
    const dataInicio = new Date(ano, rec.mes_no_ano - 1, rec.dia_inicio);
    const dataFim = new Date(ano, rec.mes_no_ano - 1, rec.dia_fim);

    await criarBloqueio({
      medico_id: rec.medico_id,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      motivo: rec.motivo,
      descricao: rec.nome,
    });
  });
}
```

---

## 2️⃣ Substituição Automática

Sugerir médico substituto quando um está bloqueado.

### Schema
```sql
CREATE TABLE medicos_substitutos (
  id UUID PRIMARY KEY,
  medico_bloqueado_id UUID NOT NULL REFERENCES medicos(id),
  medico_substituto_id UUID NOT NULL REFERENCES medicos(id),
  ativo BOOLEAN DEFAULT TRUE
);
```

### Componente
```typescript
export function BloqueioComSubstituicao({ bloqueio, onSelect }: Props) {
  const [substitutos, setSubstitutos] = useState([]);

  useEffect(() => {
    loadSubstitutos();
  }, [bloqueio]);

  async function loadSubstitutos() {
    const { data } = await supabase
      .from('medicos_substitutos')
      .select('*, medico:medicos_substituto_id(nome)')
      .eq('medico_bloqueado_id', bloqueio.medico_id)
      .eq('ativo', true);

    setSubstitutos(data || []);
  }

  return (
    <div className="bg-blue-50 p-4 rounded">
      <p>🔄 Médicos disponíveis hoje:</p>
      {substitutos.map((sub) => (
        <button
          key={sub.id}
          onClick={() => onSelect(sub.medico_substituto_id)}
          className="block w-full text-left p-2 hover:bg-blue-100"
        >
          {sub.medico.nome}
        </button>
      ))}
    </div>
  );
}
```

---

## 3️⃣ Notificações de Bloqueio

Alertar pacientes sobre médico bloqueado.

### Schema
```sql
CREATE TABLE notificacoes_bloqueio (
  id UUID PRIMARY KEY,
  bloqueio_id UUID REFERENCES bloqueios_agenda(id),
  paciente_id UUID,
  tipo VARCHAR(50), -- 'email', 'sms', 'app'
  enviado_em TIMESTAMP,
  status VARCHAR(50) -- 'pendente', 'enviado', 'falho'
);
```

### Function
```typescript
async function notificarPacientes(bloqueioId: string) {
  // 1. Obter bloqueio
  const bloqueio = await supabase
    .from('bloqueios_agenda')
    .select('*, medico:medicos(nome)')
    .eq('id', bloqueioId)
    .single();

  // 2. Obter marcações do médico nesse período
  const marcacoes = await supabase
    .from('marcacoes')
    .select('*, paciente:pacientes(nome, email, telefone)')
    .eq('medico_id', bloqueio.medico_id)
    .gte('data', bloqueio.data_inicio)
    .lte('data', bloqueio.data_fim)
    .eq('status', 'confirmada');

  // 3. Enviar notificações (via email, SMS, etc)
  for (const marcacao of marcacoes) {
    await enviarNotificacao({
      tipo: 'email',
      destinatario: marcacao.paciente.email,
      assunto: `Sua consulta com ${bloqueio.medico.nome} foi afetada`,
      mesagem: `${bloqueio.medico.nome} está indisponível de ${bloqueio.data_inicio} a ${bloqueio.data_fim}`,
    });
  }
}
```

---

## 4️⃣ Relatório de Bloqueios

Gerar relatório de bloqueios por período.

### Componente
```typescript
export function RelatorioBloqueios() {
  const [relatorio, setRelatorio] = useState<any>(null);
  const [filtro, setFiltro] = useState({
    dataInicio: '',
    dataFim: '',
    motivo: '',
  });

  async function gerarRelatorio() {
    const { data } = await supabase
      .from('bloqueios_agenda')
      .select('*, medico:medicos(nome)')
      .gte('data_inicio', filtro.dataInicio)
      .lte('data_fim', filtro.dataFim)
      .eq('ativo', true)
      ...(filtro.motivo && `.eq('motivo', filtro.motivo)`);

    const formatado = {
      total: data?.length || 0,
      porMotivo: {},
      porMedico: {},
      diasTotais: 0,
    };

    data?.forEach((b) => {
      // Agrupar por motivo
      formatado.porMotivo[b.motivo] = (formatado.porMotivo[b.motivo] || 0) + 1;

      // Agrupar por médico
      formatado.porMedico[b.medico.nome] = (formatado.porMedico[b.medico.nome] || 0) + 1;

      // Contar dias
      const dias = calcularDias(b.data_inicio, b.data_fim);
      formatado.diasTotais += dias;
    });

    setRelatorio(formatado);
  }

  return (
    <div>
      {/* Filtros */}
      {/* Tabelas com dados */}
      <ExportarPDF relatorio={relatorio} />
    </div>
  );
}
```

---

## 5️⃣ Bloqueios em Cascata

Bloquear também consultórios, equipamentos, etc.

### Schema
```sql
CREATE TABLE bloqueios_recursos (
  id UUID PRIMARY KEY,
  bloqueio_id UUID REFERENCES bloqueios_agenda(id),
  tipo_recurso VARCHAR(50), -- 'consultorio', 'equipamento'
  recurso_id UUID,
  motivo_extensao TEXT
);
```

---

## 6️⃣ Integração com Calendário Externo

Sincronizar com Google Calendar, Outlook, etc.

### Conceito
```typescript
async function sincronizarGoogleCalendar(medicoGoogleCalendarId: string) {
  const bloqueios = await supabase
    .from('bloqueios_agenda')
    .select('*')
    .eq('ativo', true);

  for (const bloqueio of bloqueios) {
    // Usar Google Calendar API
    const event = {
      summary: `Indisponível - ${bloqueio.motivo}`,
      description: bloqueio.descricao,
      start: { date: bloqueio.data_inicio },
      end: { date: bloqueio.data_fim },
      transparency: 'transparent', // Mostrar como livre?
    };

    await googleCalendar.events.insert({
      calendarId: medicoGoogleCalendarId,
      resource: event,
    });
  }
}
```

---

## 7️⃣ Bloqueios com Aprovação

Bloquear requer aprovação de gerente/admin.

### Schema
```sql
CREATE TABLE bloqueios_aprovacao (
  id UUID PRIMARY KEY,
  bloqueio_id UUID UNIQUE REFERENCES bloqueios_agenda(id),
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'aprovado', 'rejeitado'
  solicitado_por UUID REFERENCES auth.users(id),
  solicitado_em TIMESTAMP DEFAULT NOW(),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP,
  motivo_rejeicao TEXT
);
```

### Workflow
```typescript
// Apenas criar bloqueio como "rascunho"
async function solicitarBloqueio(dados: CreateBloqueioDTO) {
  // 1. Criar bloqueio com ativo=false
  const bloqueio = await criarBloqueio({ ...dados, ativo: false });

  // 2. Criar solicitação de aprovação
  await supabase.from('bloqueios_aprovacao').insert({
    bloqueio_id: bloqueio.id,
    solicitado_por: userId,
    status: 'pendente',
  });

  // 3. Notificar admin
  await notificarAdmin('Novo bloqueio aguardando aprovação');
}

// Admin aprova
async function aprovarBloqueio(bloqueioId: string) {
  // 1. Ativar bloqueio
  await atualizarBloqueio(bloqueioId, { ativo: true });

  // 2. Registrar aprovação
  await supabase.from('bloqueios_aprovacao').update({
    status: 'aprovado',
    aprovado_por: adminId,
    aprovado_em: new Date(),
  });
}
```

---

## 8️⃣ Bloqueios Parciais

Bloquear apenas certos horários, não o dia inteiro.

### Schema
```sql
CREATE TABLE bloqueios_agenda_v2 (
  -- Campos existentes
  hora_inicio TIME,  -- ex: 09:00
  hora_fim TIME,     -- ex: 12:00
  eh_periodo_completo BOOLEAN DEFAULT TRUE
);
```

---

## 9️⃣ Dashboard de Bloqueios

Visualização gerencial de todos os bloqueios.

```typescript
export function DashboardBloqueios() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Cards com estatísticas */}
      <Card title="Bloqueios Ativos" value={123} />
      <Card title="Dias Bloqueados" value={456} />
      <Card title="Médicos Afetados" value={45} />
      <Card title="Próximo Bloqueio" value="5 dias" />

      {/* Gráficos */}
      <ChartPorMotivo data={bloqueiosPorMotivo} />
      <ChartPorMedico data={bloqueiosPorMedico} />

      {/* Timeline */}
      <TimelineBloqueios />

      {/* Tabela com filtros */}
      <TabelaBloqueios />
    </div>
  );
}
```

---

## 🔟 Importação em Lote

Importar bloqueios de Excel/CSV.

```typescript
async function importarBloqueiosCSV(arquivo: File) {
  // 1. Parse CSV
  const linhas = await lerCSV(arquivo);

  // 2. Validar cada linha
  const bloqueiosValidos = [];
  linhas.forEach((linha) => {
    const validacoes = validarBloqueio(linha);
    if (validacoes.every(v => v.isValid)) {
      bloqueiosValidos.push(linha);
    }
  });

  // 3. Inserir em lote
  const { error } = await supabase
    .from('bloqueios_agenda')
    .insert(bloqueiosValidos);

  if (!error) {
    notificacao.success(`${bloqueiosValidos.length} bloqueios importados!`);
  }
}
```

---

## 🎯 Priorização de Implementação

1. **P1 (Critical)**: 
   - ✅ Bloqueios básicos (já implementado)
   - ⏳ Notificações

2. **P2 (High)**:
   - Substituição automática
   - Bloqueios recorrentes
   - Dashboard

3. **P3 (Medium)**:
   - Relatórios
   - Integração externa
   - Aprovação

4. **P4 (Low)**:
   - Bloqueios parciais
   - Bloqueios em cascata
   - Importação CSV

---

## 💡 Dicas

- Considere performance ao adicionar novas features
- Use índices no Supabase para queries grandes
- Implement soft delete para auditoria
- Cache dados com `useMemo` quando apropriado
- Adicione testes unitários para lógica complicada

---

## 📞 Próximas Steps

1. Implementar o sistema básico (já feito ✅)
2. Testar integração com Calendario
3. Adicionar notificações (P1)
4. Implementar dashboard (P2)
5. Melhorias conforme feedback dos usuários

