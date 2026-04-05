export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validations = {
  data: {
    required: (data: string): ValidationResult => {
      if (!data) return { isValid: false, message: 'Data é obrigatória' };
      return { isValid: true };
    },
    future: (data: string): ValidationResult => {
      const selectedDate = new Date(data + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { isValid: false, message: 'Não é possível marcar em datas passadas' };
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

  modalidade: {
    required: (modalidade: string): ValidationResult => {
      if (!modalidade) return { isValid: false, message: 'Modalidade é obrigatória' };
      return { isValid: true };
    },
  },

  especialidade: {
    required: (especialidade: string): ValidationResult => {
      if (!especialidade) return { isValid: false, message: 'Especialidade é obrigatória' };
      return { isValid: true };
    },
  },

  codigo: {
    required: (codigo: string): ValidationResult => {
      if (!codigo) return { isValid: false, message: 'Código AGHU é obrigatório' };
      return { isValid: true };
    },
    format: (codigo: string): ValidationResult => {
      const regex = /^[A-Z0-9\-]+$/;
      if (!regex.test(codigo)) {
        return { isValid: false, message: 'Código AGHU deve conter apenas letras maiúsculas, números e hífens' };
      }
      return { isValid: true };
    },
  },

  vagas: {
    required: (vagas: number): ValidationResult => {
      if (!vagas) return { isValid: false, message: 'Número de vagas é obrigatório' };
      return { isValid: true };
    },
    range: (vagas: number): ValidationResult => {
      if (vagas < 1 || vagas > 6) {
        return { isValid: false, message: 'Vagas devem estar entre 1 e 6' };
      }
      return { isValid: true };
    },
  },

  nome: {
    required: (nome: string): ValidationResult => {
      if (!nome || nome.trim().length === 0) {
        return { isValid: false, message: 'Nome é obrigatório' };
      }
      return { isValid: true };
    },
    minLength: (nome: string, length: number = 3): ValidationResult => {
      if (nome.length < length) {
        return { isValid: false, message: `Nome deve ter pelo menos ${length} caracteres` };
      }
      return { isValid: true };
    },
  },
};

export function validateMarcacao(data: {
  data: string;
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
}): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(validations.data.required(data.data));
  results.push(validations.data.future(data.data));
  results.push(validations.medico.required(data.medico_id));
  results.push(validations.modalidade.required(data.modalidade));
  results.push(validations.especialidade.required(data.especialidade));
  results.push(validations.codigo.required(data.codigo_aghu));

  return results.filter((r) => !r.isValid);
}

export function validateCodigo(data: {
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
}): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(validations.medico.required(data.medico_id));
  results.push(validations.modalidade.required(data.modalidade));
  results.push(validations.especialidade.required(data.especialidade));
  results.push(validations.codigo.required(data.codigo_aghu));
  results.push(validations.codigo.format(data.codigo_aghu));

  return results.filter((r) => !r.isValid);
}

export function validateVagas(data: { data: string; medico_id: string; vagas_totais: number }): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(validations.data.required(data.data));
  results.push(validations.medico.required(data.medico_id));
  results.push(validations.vagas.required(data.vagas_totais));
  results.push(validations.vagas.range(data.vagas_totais));

  return results.filter((r) => !r.isValid);
}

export function validateMedico(data: { nome: string }): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(validations.nome.required(data.nome));
  results.push(validations.nome.minLength(data.nome, 3));

  return results.filter((r) => !r.isValid);
}
