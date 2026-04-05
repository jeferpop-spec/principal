/**
 * BloqueiosList - Componente para listar bloqueios de um médico
 */

import { Trash2, Edit2, AlertCircle } from 'lucide-react';
import { BloqueioAgenda, motivosBloqueio } from '../lib/bloqueios.types';

interface BloqueiosListProps {
  bloqueios: BloqueioAgenda[];
  onEdit: (bloqueio: BloqueioAgenda) => void;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  empty?: React.ReactNode;
}

export function BloqueiosList({
  bloqueios,
  onEdit,
  onDelete,
  loading = false,
  empty,
}: BloqueiosListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este bloqueio?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const calcularDias = (dataInicio: string, dataFim: string) => {
    const start = new Date(dataInicio + 'T00:00:00');
    const end = new Date(dataFim + 'T00:00:00');
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const verificarVigente = (dataFim: string) => {
    const fim = new Date(dataFim + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return fim >= hoje;
  };

  if (bloqueios.length === 0) {
    return (
      <div className="text-center py-8">
        {empty || (
          <>
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum bloqueio cadastrado</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bloqueios.map((bloqueio) => {
        const motivo = motivosBloqueio[bloqueio.motivo];
        const dias = calcularDias(bloqueio.data_inicio, bloqueio.data_fim);
        const vigente = verificarVigente(bloqueio.data_fim);

        return (
          <div
            key={bloqueio.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              !vigente
                ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                : `${motivo.color} border-current`
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">{motivo.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {motivo.label}
                  </h4>
                  {bloqueio.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {bloqueio.descricao}
                    </p>
                  )}
                </div>
              </div>

              {/* Badge status */}
              {!vigente && (
                <span className="text-xs font-semibold px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded">
                  Expirado
                </span>
              )}
            </div>

            {/* Datas e duração */}
            <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="font-medium">📅</span>
                <span>
                  {formatarData(bloqueio.data_inicio)} a {formatarData(bloqueio.data_fim)}
                </span>
                <span className="ml-auto text-gray-600 dark:text-gray-400">
                  ({dias} dia{dias > 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Observações */}
            {bloqueio.observacoes && (
              <div className="mb-3 text-sm text-gray-700 dark:text-gray-300 p-2 bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-10 rounded">
                <p className="font-medium mb-1">Observações:</p>
                <p>{bloqueio.observacoes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t border-current border-opacity-20">
              <button
                onClick={() => onEdit(bloqueio)}
                disabled={loading || deletingId === bloqueio.id}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDelete(bloqueio.id)}
                disabled={loading || deletingId !== null}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={16} />
                {deletingId === bloqueio.id ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Import React para React.useState
import * as React from 'react';
