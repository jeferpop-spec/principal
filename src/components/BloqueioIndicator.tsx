/**
 * BloqueioIndicator - Componente para mostrar um bloqueio visualmente
 * Usado nas células de agenda para indicar dias bloqueados
 */

import { BloqueioAgenda, motivosBloqueio } from '../lib/bloqueios.types';

interface BloqueioIndicatorProps {
  bloqueio: BloqueioAgenda;
  diasRestantes?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function BloqueioIndicator({
  bloqueio,
  diasRestantes,
  size = 'md',
  showDetails = true,
}: BloqueioIndicatorProps) {
  const motivo = motivosBloqueio[bloqueio.motivo];

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-3 py-2';
      case 'md':
      default:
        return 'text-sm px-2.5 py-1.5';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all ${
        motivo.color
      } ${getSizeClasses()}`}
      title={`${bloqueio.motivo} - ${bloqueio.descricao || ''}`}
    >
      <span className="text-lg">{motivo.icon}</span>
      <span>{motivo.label}</span>

      {showDetails && diasRestantes !== undefined && (
        <>
          <span className="opacity-50">•</span>
          <span className="text-xs opacity-75">
            {diasRestantes > 0 ? `+${diasRestantes} dias` : 'Hoje'}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * BloqueioOverlay - Componente para sobrepor em células quando bloqueado
 */
interface BloqueioOverlayProps {
  bloqueio: BloqueioAgenda;
  showDetails?: boolean;
}

export function BloqueioOverlay({ bloqueio, showDetails = true }: BloqueioOverlayProps) {
  const motivo = motivosBloqueio[bloqueio.motivo];

  return (
    <div
      className={`absolute inset-0 rounded-lg flex flex-col items-center justify-center opacity-90 ${motivo.color} backdrop-blur-sm`}
    >
      <div className="text-3xl mb-2">{motivo.icon}</div>
      <div className="text-center">
        <p className="font-bold text-sm">{motivo.label}</p>
        {showDetails && bloqueio.descricao && (
          <p className="text-xs mt-1 opacity-75">{bloqueio.descricao}</p>
        )}
      </div>
    </div>
  );
}

/**
 * BloqueioTooltip - Componente para mostrar detalhes em tooltip
 */
interface BloqueioTooltipProps {
  bloqueio: BloqueioAgenda;
  children: React.ReactNode;
}

export function BloqueioTooltip({ bloqueio, children }: BloqueioTooltipProps) {
  const motivo = motivosBloqueio[bloqueio.motivo];

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarDias = () => {
    const start = new Date(bloqueio.data_inicio + 'T00:00:00');
    const end = new Date(bloqueio.data_fim + 'T00:00:00');
    const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return dias;
  };

  return (
    <div className="group relative inline-block">
      {children}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 whitespace-nowrap">
        <div className="font-bold flex items-center gap-1">
          {motivo.icon}
          {motivo.label}
        </div>
        <div className="mt-1">
          {formatarData(bloqueio.data_inicio)} a {formatarData(bloqueio.data_fim)}
        </div>
        {bloqueio.descricao && (
          <div className="mt-1 max-w-xs text-center">{bloqueio.descricao}</div>
        )}
        <div className="mt-1 text-xs opacity-75">
          {formatarDias()} dias
        </div>
        {bloqueio.observacoes && (
          <div className="mt-1 text-xs border-t border-opacity-30 pt-1">
            {bloqueio.observacoes}
          </div>
        )}
      </div>
    </div>
  );
}
