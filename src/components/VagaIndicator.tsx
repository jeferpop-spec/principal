/**
 * VagaIndicator - Componente para mostrar status de vagas de forma visual
 * Modelo: marcas em folha de papel de hospital (quadrinhos)
 * 
 * Simula o sistema real onde:
 * □ = vaga disponível
 * ■ = vaga ocupada
 * 
 * Permite entender rapidamente a ocupação do dia
 */

export type VagaStatus = 'livre' | 'ocupada' | 'bloqueada' | 'feriado';

interface VagaIndicatorProps {
  total: number;
  preenchidas: number;
  status?: VagaStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Map de símbolos para cada status
 */
const statusSymbols: Record<VagaStatus, string> = {
  livre: '□',
  ocupada: '■',
  bloqueada: '⛔',
  feriado: '🔴',
};

/**
 * Retorna as classes de cor baseado no status individual da vaga
 */
function getBoxStatusClasses(boxStatus: VagaStatus): string {
  const baseClasses = 'rounded border-1.5 transition-all flex items-center justify-center font-bold';

  switch (boxStatus) {
    case 'ocupada':
      return `${baseClasses} bg-orange-500 border-orange-600 text-white shadow-sm`;
    case 'bloqueada':
      return `${baseClasses} bg-red-100 border-red-300 text-red-700`;
    case 'feriado':
      return `${baseClasses} bg-red-500 border-red-600 text-white`;
    case 'livre':
    default:
      return `${baseClasses} bg-white border-gray-400 text-gray-600`;
  }
}

/**
 * Retorna o tamanho da caixa baseado no tamanho solicitado
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-5 h-5 text-xs';
    case 'lg':
      return 'w-8 h-8 text-base';
    case 'md':
    default:
      return 'w-6 h-6 text-sm';
  }
}

export function VagaIndicator({
  total,
  preenchidas,
  status = 'livre',
  size = 'md',
  showLabel = true,
}: VagaIndicatorProps) {
  // Se houver bloqueada ou feriado, mostra todos os quadrinhos com esse status
  const isBloqueadaOuFeriado = status === 'bloqueada' || status === 'feriado';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Grid de vagas - simula papel com "riscos" */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          // Determina o status de cada caixa individual
          let boxStatus: VagaStatus = 'livre';

          if (isBloqueadaOuFeriado) {
            boxStatus = status;
          } else if (i < preenchidas) {
            boxStatus = 'ocupada';
          }

          const boxClasses = getBoxStatusClasses(boxStatus);
          const sizeClasses = getSizeClasses(size);

          return (
            <div
              key={i}
              className={`${boxClasses} ${sizeClasses}`}
              title={
                isBloqueadaOuFeriado
                  ? status === 'feriado'
                    ? 'Feriado'
                    : 'Bloqueado'
                  : i < preenchidas
                    ? `Vaga ${i + 1}: Ocupada`
                    : `Vaga ${i + 1}: Disponível`
              }
            >
              {statusSymbols[boxStatus]}
            </div>
          );
        })}
      </div>

      {/* Label com contagem - mostra proporção visualmente */}
      {showLabel && !isBloqueadaOuFeriado && (
        <div className="text-xs text-gray-700 font-semibold">
          {preenchidas}/{total}
          {(() => {
            if (preenchidas === 0) return ' - Todos livres';
            if (preenchidas === total) return ' - Lotada';
            if (preenchidas < total) return ' - Disponível';
            return '';
          })()}
        </div>
      )}

      {/* Label para status especiais */}
      {showLabel && isBloqueadaOuFeriado && (
        <div className="text-xs font-bold">
          {status === 'feriado' ? (
            <span className="text-red-600">🔴 FERIADO</span>
          ) : (
            <span className="text-red-700">⛔ BLOQUEADO</span>
          )}
        </div>
      )}
    </div>
  );
}
