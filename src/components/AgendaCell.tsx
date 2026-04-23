/**
 * AgendaCell - Componente para exibir uma célula do calendário de agenda
 * Modelo real: agenda em papel de hospital do setor de imagem
 * 
 * Cada célula representa um dia e os médicos disponíveis naquele dia
 * Mostra vagas visualmente com quadrinhos (como marcas na folha de papel)
 */

import { VagaStatus } from './VagaIndicator';
import { BloqueioAgenda, motivosBloqueio } from '../lib/bloqueios.types';
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
    return 'bg-blue-50 border-blue-400 shadow-sm';
  }
  if (ehMesAtual) {
    return 'bg-white border-slate-200';
  }
  return 'bg-slate-50 border-slate-200 text-slate-400';
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
        turno: vaga.turno || 'manha',
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
      className={`h-full min-h-[260px] md:min-h-[280px] rounded-[2rem] border-[2px] border-[#e3e3e3] p-3 md:p-4 transition-all ${
        ehFimDeSemana || esFeriado || bloqueiosPorMedico.size > 0 ? 'bg-[#e3e3e3]' : 'bg-white'
      }`}
      data-date={dataStr}
    >
      {/* Cabeçalho: Data e Indicadores (Apenas Data alinhada à esquerda sem borda inferior) */}
      <div className="flex items-start justify-between mb-3">
        <div className={`text-xl font-extrabold text-black`}>{data.getDate()}</div>

        <div className="flex flex-wrap items-center gap-1">
          {ehHoje && (
             <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" title="Hoje"></span>
          )}
          {esFeriado && (
             <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest" title="Feriado">FERIADO</span>
          )}
        </div>
      </div>

      {/* Conteúdo: Médicos e suas vagas */}
      {ehMesAtual && vagasDoDia.length > 0 && (
        <div className="space-y-1.5">
          {vagasDoDia.map((vaga) => {
            const bloqueio = bloqueiosPorMedico.get(vaga.medico_id);

            const maxVisibleSlots = 8;
            const slotsDispCount = Math.max(0, Math.min(vaga.vagas_totais - vaga.vagas_preenchidas, maxVisibleSlots));
            const podeClicarObj = podeClicar(vaga);

            return (
              <div
                key={`${vaga.medico_id}-${vaga.data}-${vaga.turno}`}
                onClick={() => handleClickVaga(vaga)}
                className={`flex flex-col bg-white border-[2px] border-[#e3e3e3] rounded-2xl py-1.5 px-2 transition-all ${
                  podeClicarObj
                    ? 'cursor-pointer hover:shadow-md'
                    : 'cursor-default opacity-80'
                }`}
                style={{ minHeight: '56px' }}
                role={podeClicar(vaga) ? 'button' : 'region'}
                tabIndex={podeClicar(vaga) ? 0 : undefined}
                onKeyDown={(e) => {
                  if (podeClicar(vaga) && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleClickVaga(vaga);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2 mb-0.5 min-w-0">
                  <span className="flex-1 min-w-0 text-[8px] md:text-[9px] leading-tight font-extrabold uppercase text-black truncate tracking-wide" title={vaga.medicoNome}>
                    {vaga.medicoNome}
                  </span>
                  <span className={`whitespace-nowrap text-[8px] md:text-[9px] font-black tracking-tighter px-1 rounded-md border border-[#e3e3e3] ${
                      vaga.turno === 'manha'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                    {vaga.turno === 'manha' ? '(M)' : '(T)'}
                  </span>
                </div>
                {vaga.modalidade && (
                  <div className="text-[8px] md:text-[9px] font-semibold text-gray-500 bg-gray-100 rounded px-1 max-w-full mb-0.5 truncate">
                    {vaga.modalidade}
                  </div>
                )}
                
                <div className="flex gap-[3px] mt-0.5 flex-wrap">
                  {/* Slots ocupados */}
                  {Array.from({ length: Math.min(vaga.vagas_preenchidas, maxVisibleSlots) }).map((_, i) => (
                    <div
                      key={`occ-${i}`}
                      className="w-3.5 h-3.5 bg-[#ea580c] border border-[#ea580c] rounded-sm"
                    ></div>
                  ))}

                  {/* Slots disponíveis */}
                  {Array.from({ length: slotsDispCount }).map((_, i) => (
                    <div
                      key={`disp-${i}`}
                      className="w-3.5 h-3.5 bg-white border border-[#e3e3e3] rounded-sm"
                    ></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensagem quando não há vagas */}
      {ehMesAtual && vagasDoDia.length === 0 && !esFeriado && (
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mt-6">
          Sem vagas
        </div>
      )}

      {/* Mensagem para dias fora do mês */}
      {!ehMesAtual && (
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center mt-6">
          ---
        </div>
      )}
    </div>
  );
}
