/**
 * Tipos e interfaces para gerenciamento de bloqueios de agenda
 */

export type MotivoBloqueso = 'ferias' | 'licenca' | 'afastamento' | 'abono' | 'indisponibilidade' | 'feriado';

/**
 * Mapa de motivos com descrições em português
 */
export const motivosBloqueio: Record<MotivoBloqueso, { label: string; color: string; icon: string }> = {
  ferias: {
    label: 'Férias',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: '🏖️',
  },
  licenca: {
    label: 'Licença',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '📋',
  },
  afastamento: {
    label: 'Afastamento',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    icon: '⚠️',
  },
  abono: {
    label: 'Abono',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: '✓',
  },
  indisponibilidade: {
    label: 'Indisponibilidade',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: '🚫',
  },
  feriado: {
    label: 'Feriado',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: '🎉',
  },
};

export interface BloqueioAgenda {
  id: string;
  medico_id: string | null;
  data_inicio: string;
  data_fim: string;
  motivo: MotivoBloqueso;
  descricao?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  criado_por?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateBloqueioDTO {
  medico_id?: string | null;
  data_inicio: string;
  data_fim: string;
  motivo: MotivoBloqueso;
  descricao?: string | null;
  observacoes?: string | null;
}

export interface UpdateBloqueioDTO extends Partial<CreateBloqueioDTO> {
  ativo?: boolean;
}

/**
 * Estado de um dia na agenda em relação aos bloqueios
 */
export interface DiaBloqueado {
  data: string;
  medico_id: string | null;
  bloqueio: BloqueioAgenda;
  diasRestantes: number; // Dias até final do bloqueio
}
