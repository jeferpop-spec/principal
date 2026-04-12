/**
 * Utilitários para gerenciar marcações e ocupação de vagas
 */

/**
 * Status de marcação que ocupam vaga
 */
export const STATUS_OCUPAM_VAGA = ['agendado', 'marcado', 'faltou', 'realizado'] as const;

/**
 * Status de marcação que não ocupam vaga
 */
export const STATUS_NAO_OCUPAM_VAGA = ['cancelado'] as const;

/**
 * Verifica se um status de marcação ocupa vaga
 * @param status - Status da marcação
 * @returns true se ocupa vaga, false caso contrário
 */
export function statusOcupaVaga(status: string): boolean {
  return STATUS_OCUPAM_VAGA.includes(status as any);
}

/**
 * Conta o número de marcações que ocupam vaga em uma lista
 * @param marcacoes - Lista de marcações com status
 * @returns Número de marcações que ocupam vaga
 */
export function contarMarcacoesOcupamVaga(marcacoes: { status: string }[]): number {
  return marcacoes.filter(m => statusOcupaVaga(m.status)).length;
}

/**
 * Filtra marcações que ocupam vaga
 * @param marcacoes - Lista de marcações
 * @returns Lista filtrada de marcações que ocupam vaga
 */
export function filtrarMarcacoesOcupamVaga<T extends { status: string }>(marcacoes: T[]): T[] {
  return marcacoes.filter(m => statusOcupaVaga(m.status));
}

/**
 * Agrupa marcações por médico e data e turno, contando apenas as que ocupam vaga
 * @param marcacoes - Lista de marcações
 * @returns Map com chave "data-medico_id-turno" e valor sendo o count de marcações que ocupam vaga
 */
export function agruparMarcacoesPorDiaMedico(marcacoes: { data: string; medico_id: string; status: string; turno: string }[]): Map<string, number> {
  const resultado = new Map<string, number>();

  marcacoes.forEach(m => {
    if (statusOcupaVaga(m.status)) {
      const key = `${m.data}-${m.medico_id}-${m.turno}`;
      resultado.set(key, (resultado.get(key) || 0) + 1);
    }
  });

  return resultado;
}