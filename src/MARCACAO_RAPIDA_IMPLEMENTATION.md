/**
 * MARCAÇÃO RÁPIDA - RESUMO DA IMPLEMENTAÇÃO
 * =========================================
 *
 * O sistema permite que o usuário clique diretamente em uma célula da Agenda Visual
 * para abrir a tela de Marcação com dados pré-preenchidos.
 *
 * ARQUIVOS MODIFICADOS:
 * ====================
 *
 * 1. src/App.tsx
 *    - Adicionado: interface MarcacaoRapidaData com campos: data, medico_id, modalidade
 *    - Adicionado: estado 'marcacaoRapidaData' para armazenar dados pré-selecionados
 *    - Modificado: renderPage() para passar dados e callbacks ao Calendario e Marcacao
 *    - Modificado: onNavigate wrapper para limpar dados ao sair da página de marcação
 *
 * 2. src/pages/Calendario.tsx
 *    - Adicionado: props CalendarioProps com callbacks onMarcacaoRapida e onNavigate
 *    - Modificado: importar MarcacaoRapidaData do App
 *    - Modificado: AgendaCell recebe callbacks como props
 *
 * 3. src/components/AgendaCell.tsx
 *    - Adicionado: props onMarcacaoRapida e onNavigar à interface AgendaCellProps
 *    - Adicionado: importar MarcacaoRapidaData do App
 *    - Adicionado: função handleClickVaga() que valida e chama marcação rápida
 *    - Adicionado: função podeClicar() que verifica se célula pode ser clicada
 *    - Modificado: div do card de vaga para tornar-se clicável
 *    - Adicionado: classes CSS para feedback visual (cursor, hover, active)
 *    - Adicionado: atributos de acessibilidade (role, tabIndex, onKeyDown)
 *    - Adicionado: title dinâmico explicando por que não pode clicar (se aplicável)
 *
 * 4. src/pages/Marcacao.tsx
 *    - Adicionado: interface MarcacaoProps com props precheckedData e onClear
 *    - Modificado: função exportada para aceitar props
 *    - Adicionado: useEffect que pré-preenche formulário quando recebe precheckedData
 *    - Modificado: handleSubmit para chamar onClear() após sucesso
 *    - Adicionado: banner visual informando que é marcação rápida da agenda
 *    - Removido: interface Codigo não utilizada
 *
 * ====================
 * FLUXO DE FUNCIONAMENTO
 * ====================
 *
 * 1. Usuário clica em uma célula disponível/parcialmente ocupada na Agenda
 * 2. AgendaCell valida:
 *    - Se não está bloqueada
 *    - Se não é feriado
 *    - Se não está lotada
 * 3. AgendaCell chama onMarcacaoRapida com dados:
 *    - data (do dia clicado)
 *    - medico_id
 *    - modalidade
 * 4. Dados são armazenados em App.marcacaoRapidaData
 * 5. onNavigar('marcacao') muda para página de Marcação
 * 6. Marcacao.tsx recebe precheckedData e pré-preenche:
 *    - Data
 *    - Médico
 *    - Modalidade
 * 7. Usuário completa:
 *    - Especialidade/Exame
 *    - Código AGHU (preenchido automaticamente)
 * 8. Ao salvar com sucesso:
 *    - onClear() é chamado para limpar dados
 *    - Estado volta vazio para próxima marcação
 *
 * ====================
 * VALIDAÇÕES IMPLEMENTADAS
 * ====================
 *
 * Célula NÃO é clicável se:
 * ✓ Está bloqueada (bloqueio ativo)
 * ✓ É feriado
 * ✓ Está lotada (100% vagas ocupadas)
 *
 * Célula É clicável se:
 * ✓ Disponível (0-50% ocupado)
 * ✓ Parcialmente ocupada (51-99% ocupado)
 * ✓ Não está bloqueada
 * ✓ Não é feriado
 *
 * ====================
 * EXPERIÊNCIA DO USUÁRIO
 * ====================
 *
 * ✓ Célula clicável tem cursor pointer
 * ✓ Hover suave com sombra e borda laranja
 * ✓ Clique inédito retira feedback visual
 * ✓ Célula não clicável fica opaca (50% opacity)
 * ✓ Tooltip ao hover explica o porquê de não poder clicar
 * ✓ Teclado: Tab para navegar, Enter/Espaço para ativar
 * ✓ Banner azul na marcação mostrando origem (agenda rápida)
 *
 * ====================
 * ATALHO OPERACIONAL CRIADO
 * ====================
 *
 * ANTES: Usuário precisava:
 * 1. Ir para página de Marcação
 * 2. Selecionar Data
 * 3. Selecionar Médico
 * 4. Esperar carregar modalidades
 * 5. Selecionar Modalidade
 * 6. Esperar carregar especialidades
 * 7. Selecionar Especialidade
 * 8. Código preenchido automaticamente
 * 9. Completar dados adicionais
 * 10. Enviar
 *
 * DEPOIS: Usuário:
 * 1. Clica na célula do dia/médico na Agenda
 * 2. Abre Marcação já com Data/Médico/Modalidade preenchidos
 * 3. Seleciona Especialidade
 * 4. Código preenchido automaticamente
 * 5. Completa dados adicionais
 * 6. Envia
 *
 * = 50% menos cliques e seleções
 * = Fluxo mais rápido no balcão
 * = Menos erro de seleção (pré-preenchido)
 *
 * ====================
 * OBSERVAÇÕES IMPORTANTES
 * ====================
 *
 * - Dados pré-preenchidos são salvos no estado App.marcacaoRapidaData
 * - Dados são limpos ao navegar para fora de Marcação
 * - Dados são limpos após submissão bem-sucedida
 * - O componente continua funcionando normalmente sem marcação rápida
 * - Email ou celular não são pré-preenchidos (completados pelo usuário)
 * - Acessibilidade mantida com ARIA roles e keyboard navigation
 *
 */