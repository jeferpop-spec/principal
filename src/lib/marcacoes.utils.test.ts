import { describe, it, expect } from 'vitest';
import { statusOcupaVaga, contarMarcacoesOcupamVaga } from './marcacoes.utils';

describe('marcacoes.utils', () => {
  it('deve considerar apenas os status que ocupam vaga', () => {
    expect(statusOcupaVaga('marcado')).toBe(true);
    expect(statusOcupaVaga('faltou')).toBe(true);
    expect(statusOcupaVaga('realizado')).toBe(true);
    expect(statusOcupaVaga('cancelado')).toBe(false);
    expect(statusOcupaVaga('agendado')).toBe(true);
    expect(statusOcupaVaga('')).toBe(false);
  });

  it('deve contar apenas marcações que ocupam vaga', () => {
    const marcacoes = [
      { status: 'marcado' },
      { status: 'faltou' },
      { status: 'realizado' },
      { status: 'cancelado' },
      { status: 'agendado' },
    ];

    expect(contarMarcacoesOcupamVaga(marcacoes)).toBe(4);
  });
});
