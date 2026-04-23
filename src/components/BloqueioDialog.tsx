/**
 * BloqueioDialog - Modal para gerenciar bloqueios de um médico
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Loader } from 'lucide-react';
import { BloqueioAgenda, CreateBloqueioDTO } from '../lib/bloqueios.types';
import { useBloqueios } from '../hooks/useBloqueios';
import { BloqueioForm } from './BloqueioForm';
import { BloqueiosList } from './BloqueiosList';

interface BloqueioDialogProps {
  isOpen: boolean;
  medicoId: string;
  medicoNome: string;
  onClose: () => void;
  onBloqueioCreated?: () => void; // Callback quando bloqueio é criado
}

export function BloqueioDialog({
  isOpen,
  medicoId,
  medicoNome,
  onClose,
  onBloqueioCreated,
}: BloqueioDialogProps) {
  const { criarBloqueio, atualizarBloqueio, deletarBloqueio, carregarBloqueiosPorMedico, loading } =
    useBloqueios();

  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBloqueio, setEditingBloqueio] = useState<BloqueioAgenda | null>(null);
  const [loadingBloqueios, setLoadingBloqueios] = useState(false);

  const loadBloqueios = useCallback(async () => {
    setLoadingBloqueios(true);
    try {
      const dados = await carregarBloqueiosPorMedico(medicoId, 24);
      setBloqueios(dados);
    } finally {
      setLoadingBloqueios(false);
    }
  }, [carregarBloqueiosPorMedico, medicoId]);

  // Carregar bloqueios quando dialog abre
  useEffect(() => {
    if (isOpen && medicoId) {
      loadBloqueios();
    }
  }, [isOpen, medicoId, loadBloqueios]);

  const handleSubmitForm = async (data: CreateBloqueioDTO) => {
    try {
      if (editingBloqueio) {
        // Atualizar
        const resultado = await atualizarBloqueio(editingBloqueio.id, data);
        if (resultado) {
          setBloqueios((prev) =>
            prev.map((b) => (b.id === editingBloqueio.id ? resultado : b))
          );
          setEditingBloqueio(null);
          setShowForm(false);
        }
      } else {
        // Criar
        const novoBloqueio = await criarBloqueio(data);
        if (novoBloqueio) {
          setBloqueios((prev) => [novoBloqueio, ...prev]);
          setShowForm(false);
          onBloqueioCreated?.();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar bloqueio:', error);
    }
  };

  const handleEditBloqueio = (bloqueio: BloqueioAgenda) => {
    setEditingBloqueio(bloqueio);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBloqueio(null);
  };

  const handleDeleteBloqueio = async (id: string) => {
    const sucesso = await deletarBloqueio(id);
    if (sucesso) {
      setBloqueios((prev) => prev.filter((b) => b.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gerenciar Bloqueios
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{medicoNome}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Form ou Lista */}
            {showForm ? (
              <BloqueioForm
                medicoId={medicoId}
                medicoNome={medicoNome}
                bloqueioExistente={editingBloqueio || undefined}
                onSubmit={handleSubmitForm}
                onCancel={handleCancelForm}
                loading={loading}
              />
            ) : (
              <>
                {/* Botão Novo Bloqueio */}
                <button
                  onClick={() => setShowForm(true)}
                  disabled={loading || loadingBloqueios}
                  className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus size={20} />
                  Novo Bloqueio
                </button>

                {/* Lista de Bloqueios */}
                {loadingBloqueios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="animate-spin text-blue-500" size={32} />
                  </div>
                ) : (
                  <BloqueiosList
                    bloqueios={bloqueios}
                    onEdit={handleEditBloqueio}
                    onDelete={handleDeleteBloqueio}
                    loading={loading}
                    empty={
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-3">
                          Nenhum bloqueio cadastrado
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Clique em "Novo Bloqueio" para criar um
                        </p>
                      </div>
                    }
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 sticky bottom-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
