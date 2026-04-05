import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../components/Notification';

interface Medico {
  id: string;
  nome: string;
}

interface Vaga {
  id: string;
  data: string;
  medico_id: string;
  vagas_totais: number;
  medico?: {
    nome: string;
  };
}

interface FormData {
  data: string;
  medico_id: string;
  vagas_totais: number;
}

export function Vagas() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterData, setFilterData] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    data: '',
    medico_id: '',
    vagas_totais: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vagasRes, medicosRes] = await Promise.all([
        supabase.from('vagas_dia').select('*, medico:medicos(nome)').order('data', { ascending: false }),
        supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome'),
      ]);

      if (vagasRes.data) setVagas(vagasRes.data as unknown as Vaga[]);
      if (medicosRes.data) setMedicos(medicosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase.from('vagas_dia').update(formData).eq('id', editingId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Vagas atualizadas com sucesso!' });
      } else {
        const { error } = await supabase.from('vagas_dia').insert([formData]);
        if (error) {
          if (error.code === '23505') {
            setNotification({
              type: 'error',
              message: 'Já existe uma configuração de vagas para este médico nesta data.',
            });
            return;
          }
          throw error;
        }
        setNotification({ type: 'success', message: 'Vagas configuradas com sucesso!' });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setNotification({ type: 'error', message: 'Erro ao salvar configuração de vagas.' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta configuração de vagas?')) return;

    try {
      await supabase.from('vagas_dia').delete().eq('id', id);
      setNotification({ type: 'success', message: 'Configuração excluída com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setNotification({ type: 'error', message: 'Erro ao excluir configuração.' });
    }
  }

  function handleEdit(vaga: Vaga) {
    setFormData({
      data: vaga.data,
      medico_id: vaga.medico_id,
      vagas_totais: vaga.vagas_totais,
    });
    setEditingId(vaga.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      data: '',
      medico_id: '',
      vagas_totais: 1,
    });
    setEditingId(null);
    setShowForm(false);
  }

  const filteredVagas = vagas.filter((vaga) => {
    const matchData = !filterData || vaga.data === filterData;
    const matchMedico = !filterMedico || vaga.medico_id === filterMedico;
    return matchData && matchMedico;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configuração de Vagas</h1>
          <p className="text-gray-500 mt-1">Definir quantidade de vagas por médico e data</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          Nova Configuração
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Médico</label>
          <select
            value={filterMedico}
            onChange={(e) => setFilterMedico(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos os médicos</option>
            {medicos.map((medico) => (
              <option key={medico.id} value={medico.id}>
                {medico.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Vagas' : 'Nova Configuração'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Médico</label>
                <select
                  value={formData.medico_id}
                  onChange={(e) => setFormData({ ...formData, medico_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Selecione um médico</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      {medico.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Vagas (1-6)
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={formData.vagas_totais}
                  onChange={(e) => setFormData({ ...formData, vagas_totais: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Médico</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vagas Totais</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVagas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma configuração encontrada
                </td>
              </tr>
            ) : (
              filteredVagas.map((vaga) => (
                <tr key={vaga.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(vaga.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{vaga.medico?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                      {vaga.vagas_totais} {vaga.vagas_totais === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vaga)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(vaga.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
