/**
 * Utilitários para cálculo de estado da célula de agenda
 * Baseado no modelo de agenda real de hospital (papel)
 */

import { BloqueioAgenda } from './bloqueios.types';

/**
 * Estados possíveis de uma célula de agenda
 */
export type CellState = 'disponivel' | 'parcial' | 'lotada' | 'bloqueada' | 'feriado';

/**
 * Informações de estado da célula
 */
export interface CellStateInfo {
  state: CellState;
  bgColor: string; // Classes Tailwind para cor de fundo
  borderColor: string; // Classes Tailwind para cor da borda
  occupied: number;
  total: number;
  isFull: boolean;
  isEmpty: boolean;
  isBlocked: boolean;
}

/**
 * Calcula o estado de uma célula de agenda
 * @param vagas_totais - Total de vagas disponíveis
 * @param vagas_preenchidas - Número de vagas preenchidas
 * @param bloqueio - Bloqueio ativo, se houver
 * @param esFeriado - Se é feriado
 * @returns Informações de estado da célula
 */
export function calcularEstadoCelula(
  vagas_totais: number,
  vagas_preenchidas: number,
  bloqueio?: BloqueioAgenda,
  esFeriado?: boolean
): CellStateInfo {
  // Se for feriado
  if (esFeriado) {
    return {
      state: 'feriado',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      occupied: 0,
      total: vagas_totais,
      isFull: false,
      isEmpty: false,
      isBlocked: true,
    };
  }

  // Se tiver bloqueio
  if (bloqueio) {
    return {
      state: 'bloqueada',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-400',
      occupied: 0,
      total: vagas_totais,
      isFull: false,
      isEmpty: false,
      isBlocked: true,
    };
  }

  // Cálculo de estado baseado em ocupação
  const percentualOcupacao = vagas_totais > 0 ? (vagas_preenchidas / vagas_totais) * 100 : 0;
  const isFull = vagas_preenchidas >= vagas_totais;
  const isEmpty = vagas_preenchidas === 0;

  let state: CellState;
  let bgColor: string;
  let borderColor: string;

  if (isFull) {
    state = 'lotada';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-300';
  } else if (percentualOcupacao > 50) {
    state = 'parcial';
    bgColor = 'bg-yellow-50';
    borderColor = 'border-yellow-300';
  } else {
    state = 'disponivel';
    bgColor = 'bg-white';
    borderColor = 'border-gray-200';
  }

  return {
    state,
    bgColor,
    borderColor,
    occupied: vagas_preenchidas,
    total: vagas_totais,
    isFull,
    isEmpty,
    isBlocked: false,
  };
}

/**
 * Retorna descrição legível do estado
 */
export function descreverEstado(state: CellState): string {
  const descricoes: Record<CellState, string> = {
    disponivel: 'Disponível',
    parcial: 'Parcialmente ocupada',
    lotada: 'Lotada',
    bloqueada: 'Bloqueada',
    feriado: 'Feriado',
  };
  return descricoes[state];
}

/**
 * Retorna emoji para o estado
 */
export function emojiEstado(state: CellState): string {
  const emojis: Record<CellState, string> = {
    disponivel: '✓',
    parcial: '◐',
    lotada: '●',
    bloqueada: '⛔',
    feriado: '🔴',
  };
  return emojis[state];
}