/**
 * BloqueioForm - Componente para criar ou editar bloqueios
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { MotivoBloqueso, motivosBloqueio, BloqueioAgenda } from '../lib/bloqueios.types';
import { validarBloqueio, obterPrimeiroErro } from '../lib/bloqueios.validations';

interface BloqueioFormProps {
  medicoId: string;
  medicoNome: string;
  bloqueioExistente?: BloqueioAgenda;
  onSubmit: (data: {
    medico_id: string;
    data_inicio: string;
    data_fim: string;
    motivo: MotivoBloqueso;
    descricao?: string;
    observacoes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function BloqueioForm({
  medicoId,
  medicoNome,
  bloqueioExistente,
  onSubmit,
  onCancel,
  loading = false,
}: BloqueioFormProps) {
  const [formData, setFormData] = useState({
    data_inicio: bloqueioExistente?.data_inicio || '',
    data_fim: bloqueioExistente?.data_fim || '',
    motivo: (bloqueioExistente?.motivo || 'indisponibilidade') as MotivoBloqueso,
    descricao: bloqueioExistente?.descricao || '',
    observacoes: bloqueioExistente?.observacoes || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar
      const validacoes = validarBloqueio({
        medico_id: medicoId,
        ...formData,
      });

      const primeiroErro = obterPrimeiroErro(validacoes);
      if (primeiroErro) {
        setError(primeiroErro);
        setIsSubmitting(false);
        return;
      }

      // Enviar
      await onSubmit({
        medico_id: medicoId,
        ...formData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar bloqueio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const diasBloqueio = formData.data_inicio && formData.data_fim
    ? Math.ceil(
        (new Date(formData.data_fim + 'T00:00:00').getTime() -
          new Date(formData.data_inicio + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {bloqueioExistente ? 'Editar Bloqueio' : 'Novo Bloqueio'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* Médico (somente leitura) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Médico
        </label>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
          {medicoNome}
        </div>
      </div>

      {/* Data Início */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Data de Início *
        </label>
        <input
          type="date"
          value={formData.data_inicio}
          onChange={(e) => handleChange('data_inicio', e.target.value)}
          disabled={loading || isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        />
      </div>

      {/* Data Fim */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Data de Fim *
        </label>
        <input
          type="date"
          value={formData.data_fim}
          onChange={(e) => handleChange('data_fim', e.target.value)}
          disabled={loading || isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        />
        {diasBloqueio > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {diasBloqueio} dia{diasBloqueio > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Motivo *
        </label>
        <select
          value={formData.motivo}
          onChange={(e) => handleChange('motivo', e.target.value)}
          disabled={loading || isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        >
          {Object.entries(motivosBloqueio).map(([key, { label, icon }]) => (
            <option key={key} value={key}>
              {icon} {label}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição
        </label>
        <input
          type="text"
          value={formData.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="ex: Férias em Itália"
          disabled={loading || isSubmitting}
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.descricao.length}/255
        </p>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observações
        </label>
        <textarea
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          placeholder="Notas adicionais..."
          disabled={loading || isSubmitting}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.observacoes.length}/500
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Salvando...' : bloqueioExistente ? 'Atualizar' : 'Criar Bloqueio'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || isSubmitting}
          className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
