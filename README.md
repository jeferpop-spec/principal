# Sistema de Gestão de Vagas e Marcações Médicas

Sistema web profissional, responsivo e totalmente funcional para gestão de vagas e marcações de exames/atendimentos médicos. Desenvolvido com React, Tailwind CSS e Supabase.

**Versão Refinada com Visual Moderno e Melhorias de UX**

## Funcionalidades

### 1. Dashboard (Aprimorado)
- Visão geral com cards animados de resumo
- Total de médicos cadastrados
- Total de códigos ativos
- Vagas do dia (totais e preenchidas)
- Taxa de ocupação em tempo real
- Painel de dicas e navegação rápida
- Gradientes e efeitos visuais modernos

### 2. Códigos AGHU
- Cadastro de códigos vinculados a médico, modalidade e especialidade
- CRUD completo (criar, editar, excluir)
- Pesquisa em tempo real por médico, modalidade, especialidade ou código
- Status ativo/inativo
- Notificações elegantes de sucesso/erro

### 3. Configuração de Vagas
- Definir quantidade de vagas por médico e data (1 a 6 vagas)
- Validação de duplicidade (um médico não pode ter duas configurações na mesma data)
- Filtros por data e médico
- Edição e exclusão de configurações
- Notificações inteligentes

### 4. Marcação (Sistema Inteligente)
- Formulário inteligente com filtros em cascata:
  - Ao selecionar o médico, mostra apenas modalidades dele
  - Ao selecionar modalidade, mostra apenas especialidades relacionadas
  - Código AGHU é preenchido automaticamente
- Validação de vagas disponíveis em tempo real
- Bloqueio de marcações quando não há vagas
- Avisos amigáveis quando não há configuração de vagas
- Status visual de disponibilidade de vagas

### 5. Calendário Visual (Profissional)
- Visualização mensal tipo folha de calendário profissional
- **Novo**: Filtro por médico para visualizar vagas de um profissional específico
- Navegação entre meses com layout responsivo
- Quadrinhos dinâmicos (1 a 6) representando vagas
- Quadrinhos brancos = vagas disponíveis
- Quadrinhos laranja = vagas preenchidas
- Indicador visual de taxa de ocupação (ex: 2/4)
- Destaque visual do dia atual
- Atualização automática ao cadastrar marcações
- Legenda explicativa com dicas

## Tecnologias

- **Frontend**: React 18 + TypeScript
- **Estilo**: Tailwind CSS
- **Backend/Banco**: Supabase (PostgreSQL)
- **Build**: Vite
- **Ícones**: Lucide React

## Estrutura do Banco de Dados

### Tabelas:

1. **medicos**
   - id, nome, ativo, created_at

2. **codigos_aghu**
   - id, medico_id, modalidade, especialidade, codigo_aghu, ativo, created_at

3. **vagas_dia**
   - id, data, medico_id, vagas_totais (1-6), created_at
   - UNIQUE constraint em (data, medico_id)

4. **marcacoes**
   - id, data, medico_id, modalidade, especialidade, codigo_aghu, status, created_at

## Instalação e Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

O arquivo `.env` já está configurado com as credenciais do Supabase. O banco de dados já foi criado com todas as tabelas e dados de exemplo.

### 3. Rodar o projeto localmente

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

### 4. Build para produção

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`

## Dados de Exemplo

O sistema já vem com dados de exemplo pré-carregados:

### Médicos:
- Dr. Vinicius Silva
- Dra. Sergio Costa
- Dra. Maria Santos
- Dr. João Oliveira

### Códigos AGHU:
- Cardiologia, Eletrocardiograma, Ortopedia, Raio-X, Pediatria

### Vagas configuradas:
- Hoje e próximos dias com vagas variando de 2 a 6

### Marcações:
- Algumas marcações de exemplo já cadastradas

## Como Usar

### Passo 1: Cadastrar Códigos
1. Acesse a aba "Códigos"
2. Clique em "Novo Código"
3. Selecione o médico
4. Preencha modalidade, especialidade e código AGHU
5. Salve

### Passo 2: Configurar Vagas
1. Acesse a aba "Vagas"
2. Clique em "Nova Configuração"
3. Selecione a data e médico
4. Defina a quantidade de vagas (1 a 6)
5. Salve

### Passo 3: Realizar Marcação
1. Acesse a aba "Marcação"
2. Selecione a data e médico
3. O sistema mostrará quantas vagas estão disponíveis
4. Selecione modalidade e especialidade
5. O código AGHU será preenchido automaticamente
6. Confirme a marcação (só permitido se houver vagas)

### Passo 4: Visualizar Calendário
1. Acesse a aba "Calendário"
2. Navegue pelos meses usando as setas
3. Veja os quadrinhos representando vagas disponíveis e preenchidas
4. Use a legenda para entender as cores

## Melhorias Implementadas

### Design e Visual
- ✨ Calendário redesenhado com aparência profissional de folha de calendário
- ✨ Cards do dashboard com animações e efeitos hover
- ✨ Gradientes sutis e sombras modernas
- ✨ Arredondamento aumentado (rounded-xl) para visual mais sofisticado
- ✨ Indicadores visuais de progresso (spinners elegantes)

### Responsividade
- 📱 Navegação lateral responsiva (converte para horizontal em mobile)
- 📱 Grids adaptáveis para diferentes tamanhos de tela
- 📱 Tabelas otimizadas com overflow em mobile
- 📱 Calendário totalmente responsivo

### Notificações
- 🔔 Componente Notification reutilizável
- 🔔 Suporte a 4 tipos de mensagens: success, error, info, warning
- 🔔 Auto-dismiss com duração configurável
- 🔔 Animações de entrada/saída elegantes
- 🔔 Posicionamento em canto inferior direito

### Filtros Avançados
- 🔍 Filtro de médico no calendário
- 🔍 Filtros inteligentes em cascata na marcação
- 🔍 Busca em tempo real nos códigos

### Dados de Demonstração
- 📊 Dados mockados para 15 dias
- 📊 Múltiplas marcações para visualizar ocupação
- 📊 Vagas variadas para teste completo

## Estrutura de Pastas

```
src/
├── components/
│   ├── Layout.tsx          # Layout responsivo com navegação
│   └── Notification.tsx    # Sistema de notificações
├── pages/
│   ├── Dashboard.tsx       # Dashboard aprimorado
│   ├── Codigos.tsx         # Gerenciar códigos AGHU
│   ├── Vagas.tsx           # Configurar vagas
│   ├── Marcacao.tsx        # Realizar marcações
│   └── Calendario.tsx      # Calendário visual profissional
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   └── database.types.ts   # Tipos TypeScript do banco
├── App.tsx                 # Componente principal
└── main.tsx               # Entrada da aplicação
```

## Regras de Negócio Implementadas

- ✅ Um médico só pode ter uma configuração de vagas por data
- ✅ Quantidade de vagas limitada entre 1 e 6
- ✅ Marcações só permitidas se houver vagas disponíveis
- ✅ Filtros em cascata baseados nos códigos cadastrados
- ✅ Código AGHU preenchido automaticamente
- ✅ Calendário atualiza em tempo real
- ✅ Validação de duplicidade com feedback ao usuário
- ✅ Mensagens amigáveis e contextualizadas
- ✅ Notificações em tempo real para todas as ações

## Características de UX/UI Profissional

### Design
- 🎨 Design limpo e minimalista
- 🎨 Paleta de cores profissional (laranja como cor principal)
- 🎨 Tipografia legível e consistente
- 🎨 Espaçamento harmônico com sistema 8px

### Interatividade
- 🎯 Navegação intuitiva e fluida
- 🎯 Feedback visual em todas as ações
- 🎯 Transições suaves (200-300ms)
- 🎯 Estados hover e focus bem definidos
- 🎯 Bloqueio de ações quando necessário

### Acessibilidade
- ♿ Contraste de cores adequado (WCAG)
- ♿ Botões com tamanho mínimo (44px)
- ♿ Feedback visual para usuários
- ♿ Navegação por teclado suportada

### Performance
- ⚡ Build otimizado com Vite
- ⚡ CSS com Tailwind (apenas classes usadas)
- ⚡ Componentes otimizados
- ⚡ Carregamento rápido (< 400ms)

## Suporte

Sistema desenvolvido para uso interno de unidades de saúde. Para dúvidas ou problemas, consulte a documentação técnica ou entre em contato com o desenvolvedor.

## Licença

Este projeto é de uso interno. Todos os direitos reservados.
