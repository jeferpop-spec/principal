/**
 * AgendaCell - Componente para exibir uma célula do calendário de agenda
 * Modelo real: agenda em papel de hospital do setor de imagem
 * 
 * Cada célula representa um dia e os médicos disponíveis naquele dia
 * Mostra vagas visualmente com quadrinhos (como marcas na folha de papel)
 */

import { VagaIndicator, VagaStatus } from './VagaIndicator';
import { BloqueioIndicator } from './BloqueioIndicator';
import { BloqueioAgenda } from '../lib/bloqueios.types';
import { calcularEstadoCelula } from '../lib/agenda.utils';
import { MarcacaoRapidaData } from '../App';

export interface AgendaCellData {
  data: string; // ISO format: YYYY-MM-DD
  medicoNome: string;
  medico_id: string;
  modalidade?: string;
  vagas_totais: number;
  vagas_preenchidas: number;
  vagaStatus?: VagaStatus; // Para casos especiais como feriado
}

interface AgendaCellProps {
  data: Date;
  vagasDoDia: AgendaCellData[];
  ehMesAtual: boolean;
  ehHoje: boolean;
  ehFimDeSemana?: boolean;
  esFeriado?: boolean;
  bloqueiosPorMedico?: Map<string, BloqueioAgenda>;
  onMarcacaoRapida?: (data: MarcacaoRapidaData) => void;
  onNavigar?: (page: 'marcacao') => void;
}

/**
 * Retorna a cor de fundo da célula baseado no estado do dia
 */
function getBackgroundColor(ehHoje: boolean, ehMesAtual: boolean, esFeriado: boolean): string {
  if (esFeriado) {
    return 'bg-red-50 border-red-300';
  }
  if (ehHoje) {
    return 'bg-blue-50 border-blue-400 shadow-md';
  }
  if (ehMesAtual) {
    return 'bg-white border-gray-300';
  }
  return 'bg-gray-50 border-gray-200 text-gray-400';
}

/**
 * Retorna a cor do número do dia baseado no estado
 */
function getDateNumberColor(ehMesAtual: boolean, esFeriado: boolean, ehFimDeSemana: boolean): string {
  if (esFeriado) {
    return 'text-red-700 font-bold';
  }
  if (ehMesAtual) {
    if (ehFimDeSemana) {
      return 'text-gray-700 font-bold';
    }
    return 'text-gray-800 font-bold';
  }
  return 'text-gray-400';
}

export function AgendaCell({
  data,
  vagasDoDia,
  ehMesAtual,
  ehHoje,
  ehFimDeSemana = false,
  esFeriado = false,
  bloqueiosPorMedico = new Map(),
  onMarcacaoRapida,
  onNavigar,
}: AgendaCellProps) {
  const dataStr = data.toISOString().split('T')[0];
  const diaDaSemana = data.getDay();
  const isWeekend = diaDaSemana === 0 || diaDaSemana === 6;

  const bgColor = getBackgroundColor(ehHoje, ehMesAtual, esFeriado);
  const dateColor = getDateNumberColor(ehMesAtual, esFeriado, ehFimDeSemana || isWeekend);

  /**
   * Trata clique em uma vaga para marcação rápida
   */
  function handleClickVaga(vaga: AgendaCellData) {
    // Não permite clique se estiver bloqueado ou feriado
    const bloqueio = bloqueiosPorMedico.get(vaga.medico_id);
    if (bloqueio || esFeriado) {
      return;
    }

    // Verifica se pode clicar (disponível ou parcialmente ocupado)
    const ehLotado = vaga.vagas_preenchidas >= vaga.vagas_totais;

    if (ehLotado) {
      return; // Não permite clique se lotado
    }

    // Prepara dados e navega
    if (onMarcacaoRapida && onNavigar) {
      onMarcacaoRapida({
        data: vaga.data,
        medico_id: vaga.medico_id,
        modalidade: vaga.modalidade || '',
      });
      onNavigar('marcacao');
    }
  }

  /**
   * Determina se uma vaga pode ser clicada
   */
  function podeClicar(vaga: AgendaCellData): boolean {
    const bloqueio = bloqueiosPorMedico.get(vaga.medico_id);
    if (bloqueio || esFeriado) return false;

    const ehLotado = vaga.vagas_preenchidas >= vaga.vagas_totais;
    return !ehLotado && onMarcacaoRapida !== undefined && onNavigar !== undefined;
  }

  return (
    <div
      className={`min-h-48 rounded-lg border-2 p-3 transition-all ${bgColor}`}
      data-date={dataStr}
    >
      {/* Cabeçalho: Data e Indicadores */}
      <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
        <div className={`text-2xl font-bold ${dateColor}`}>{data.getDate()}</div>

        <div className="flex gap-1.5">
          {ehHoje && (
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold" title="Hoje">
              •
            </span>
          )}
          {esFeriado && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-red-500 text-white rounded text-xs font-semibold" title="Feriado">
              Feriado
            </span>
          )}
          {isWeekend && !esFeriado && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-300 text-gray-700 rounded text-xs font-semibold" title="Fim de semana">
              Fim de semana
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo: Médicos e suas vagas */}
      {ehMesAtual && vagasDoDia.length > 0 && (
        <div className="space-y-3">
          {vagasDoDia.map((vaga) => {
            const bloqueio = bloqueiosPorMedico.get(vaga.medico_id);
            const estadoCelula = calcularEstadoCelula(
              vaga.vagas_totais,
              vaga.vagas_preenchidas,
              bloqueio,
              esFeriado
            );

            return (
              <div
                key={`${vaga.medico_id}-${vaga.data}`}
                onClick={() => handleClickVaga(vaga)}
                className={`p-3 rounded-lg border-2 transition-all ${estadoCelula.bgColor} ${estadoCelula.borderColor} ${
                  podeClicar(vaga)
                    ? 'cursor-pointer hover:shadow-md hover:border-orange-400 active:shadow-inner'
                    : 'cursor-not-allowed opacity-75'
                }`}
                role={podeClicar(vaga) ? 'button' : 'region'}
                tabIndex={podeClicar(vaga) ? 0 : undefined}
                onKeyDown={(e) => {
                  if (podeClicar(vaga) && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleClickVaga(vaga);
                  }
                }}
                title={
                  podeClicar(vaga)
                    ? `Clique para marcar com ${vaga.medicoNome}`
                    : estadoCelula.isBlocked
                      ? 'Bloqueado - não é possível marcar'
                      : 'Lotado - não há vagas disponíveis'
                }
              >
                {/* Cabeçalho: Nome do médico */}
                <div className="font-bold text-gray-800 text-sm mb-1 truncate" title={vaga.medicoNome}>
                  {vaga.medicoNome}
                </div>

                {/* Modalidade */}
                {vaga.modalidade && (
                  <div className="text-xs text-gray-600 font-medium mb-2">
                    {vaga.modalidade}
                  </div>
                )}

                {/* Indicador de Vagas ou Bloqueio */}
                <div className="mt-2">
                  {bloqueio ? (
                    /* Mostrar indicador de bloqueio */
                    <BloqueioIndicator
                      bloqueio={bloqueio}
                      size="sm"
                      showDetails={false}
                    />
                  ) : (
                    /* Mostrar quadrinhos de vagas */
                    <VagaIndicator
                      total={vaga.vagas_totais}
                      preenchidas={vaga.vagas_preenchidas}
                      status="livre"
                      size="sm"
                      showLabel={true}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensagem quando não há vagas */}
      {ehMesAtual && vagasDoDia.length === 0 && !esFeriado && (
        <div className="text-xs text-gray-500 flex items-center justify-center h-12">
          Sem vagas agendadas
        </div>
      )}

      {/* Mensagem para feriado */}
      {esFeriado && (
        <div className="text-sm text-red-600 font-bold flex items-center justify-center h-12">
          🔴 FERIADO
        </div>
      )}

      {/* Mensagem para dias fora do mês */}
      {!ehMesAtual && (
        <div className="text-xs text-gray-400 flex items-center justify-center h-12">
          Outro mês
        </div>
      )}
    </div>
  );
}
