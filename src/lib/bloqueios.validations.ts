/**
 * Validações para bloqueios de agenda
 */

import { ValidationResult } from './validations';

export const validacoesBloqueio = {
  dataInicio: {
    required: (data: string): ValidationResult => {
      if (!data) return { isValid: false, message: 'Data de início é obrigatória' };
      return { isValid: true };
    },
    notPast: (data: string): ValidationResult => {
      const selectedDate = new Date(data + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { isValid: false, message: 'Data de início não pode ser no passado' };
      }
      return { isValid: true };
    },
  },

  dataFim: {
    required: (data: string): ValidationResult => {
      if (!data) return { isValid: false, message: 'Data de fim é obrigatória' };
      return { isValid: true };
    },
    notPast: (data: string): ValidationResult => {
      const selectedDate = new Date(data + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { isValid: false, message: 'Data de fim não pode ser no passado' };
      }
      return { isValid: true };
    },
    afterStart: (dataFim: string, dataInicio: string): ValidationResult => {
      const start = new Date(dataInicio + 'T00:00:00');
      const end = new Date(dataFim + 'T00:00:00');

      if (end < start) {
        return { isValid: false, message: 'Data de fim deve ser após a data de início' };
      }
      return { isValid: true };
    },
    notTooFar: (dataFim: string, dataMaxima: number = 365): ValidationResult => {
      const start = new Date();
      const end = new Date(dataFim + 'T00:00:00');
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > dataMaxima) {
        return {
          isValid: false,
          message: `Bloqueio não pode exceder ${dataMaxima} dias`,
        };
      }
      return { isValid: true };
    },
  },

  motivo: {
    required: (motivo: string): ValidationResult => {
      if (!motivo) return { isValid: false, message: 'Motivo é obrigatório' };
      return { isValid: true };
    },
    valid: (motivo: string): ValidationResult => {
      const motivosValidos = ['ferias', 'licenca', 'afastamento', 'abono', 'indisponibilidade'];
      if (!motivosValidos.includes(motivo)) {
        return { isValid: false, message: 'Motivo inválido' };
      }
      return { isValid: true };
    },
  },

  descricao: {
    maxLength: (descricao: string, length: number = 255): ValidationResult => {
      if (descricao && descricao.length > length) {
        return { isValid: false, message: `Descrição deve ter até ${length} caracteres` };
      }
      return { isValid: true };
    },
  },

  observacoes: {
    maxLength: (observacoes: string, length: number = 500): ValidationResult => {
      if (observacoes && observacoes.length > length) {
        return { isValid: false, message: `Observações deve ter até ${length} caracteres` };
      }
      return { isValid: true };
    },
  },

  medico: {
    required: (medicoId: string): ValidationResult => {
      if (!medicoId) return { isValid: false, message: 'Médico é obrigatório' };
      return { isValid: true };
    },
  },
};

/**
 * Valida um bloqueio completo
 */
export function validarBloqueio(data: {
  medico_id: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  descricao?: string;
  observacoes?: string;
}): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(validacoesBloqueio.medico.required(data.medico_id));
  results.push(validacoesBloqueio.dataInicio.required(data.data_inicio));
  results.push(validacoesBloqueio.dataInicio.notPast(data.data_inicio));
  results.push(validacoesBloqueio.dataFim.required(data.data_fim));
  results.push(validacoesBloqueio.dataFim.notPast(data.data_fim));
  results.push(validacoesBloqueio.dataFim.afterStart(data.data_fim, data.data_inicio));
  results.push(validacoesBloqueio.dataFim.notTooFar(data.data_fim, 365));
  results.push(validacoesBloqueio.motivo.required(data.motivo));
  results.push(validacoesBloqueio.motivo.valid(data.motivo));

  if (data.descricao) {
    results.push(validacoesBloqueio.descricao.maxLength(data.descricao, 255));
  }

  if (data.observacoes) {
    results.push(validacoesBloqueio.observacoes.maxLength(data.observacoes, 500));
  }

  return results;
}

/**
 * Retorna primeiro erro encontrado ou null
 */
export function obterPrimeiroErro(validacoes: ValidationResult[]): string | null {
  for (const validacao of validacoes) {
    if (!validacao.isValid && validacao.message) {
      return validacao.message;
    }
  }
  return null;
}
