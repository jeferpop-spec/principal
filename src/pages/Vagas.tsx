import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Notification, NotificationType } from '../components/Notification';

interface Medico {
  id: string;
  nome: string;
}

interface Vaga {
  id: string;
  data: string;
  medico_id: string;
  turno: string;
  vagas_totais: number;
  medico?: {
    nome: string;
  };
}

interface FormData {
  data: string;
  medico_id: string;
  turno: string;
  vagas_totais: number;
}

interface BloqueioListado {
  id: string;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  medico_id: string | null;
  medico?: { nome: string };
}
export function Vagas() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterData, setFilterData] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);

  const [bloqueios, setBloqueios] = useState<BloqueioListado[]>([]);
  const [activeListTab, setActiveListTab] = useState<'vagas' | 'bloqueios'>('vagas');

  const [activeTab, setActiveTab] = useState<'vaga' | 'bloqueio'>('vaga');
  const [bloqueioForm, setBloqueioForm] = useState({
    medico_id: '',
    data_inicio: '',
    data_fim: '',
    motivo: 'feriado',
  });

  const [formData, setFormData] = useState<FormData>({
    data: '',
    medico_id: '',
    turno: 'manha',
    vagas_totais: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vagasRes, medicosRes, bloqueiosRes] = await Promise.all([
        supabase.from('vagas_dia').select('*, medico:medicos(nome)').order('data', { ascending: false }),
        supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome'),
        supabase.from('bloqueios_agenda').select('*, medico:medicos(nome)').eq('ativo', true).order('data_inicio', { ascending: false }),
      ]);

      if (vagasRes.data) setVagas(vagasRes.data as unknown as Vaga[]);
      if (medicosRes.data) setMedicos(medicosRes.data);
      if (bloqueiosRes.data) setBloqueios(bloqueiosRes.data as unknown as BloqueioListado[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (activeTab === 'bloqueio') {
        const payload = {
          medico_id: bloqueioForm.medico_id || null,
          data_inicio: bloqueioForm.data_inicio,
          data_fim: bloqueioForm.data_fim,
          motivo: bloqueioForm.motivo,
        };
        const { error } = await supabase.from('bloqueios_agenda').insert([payload]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Bloqueio inserido com sucesso!' });
      } else {
        if (editingId) {
          const { error } = await supabase.from('vagas_dia').update(formData as Database['public']['Tables']['vagas_dia']['Update']).eq('id', editingId);
          if (error) throw error;
          setNotification({ type: 'success', message: 'Vagas atualizadas com sucesso!' });
        } else {
          const { error } = await supabase.from('vagas_dia').insert([formData] as Database['public']['Tables']['vagas_dia']['Insert'][]);
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
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setNotification({ type: 'error', message: 'Erro ao salvar configuração.' });
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

  async function handleDeleteBloqueio(id: string) {
    if (!confirm('Deseja realmente excluir predefinicação de bloqueio/feriado? A agenda voltará a abrir se houver vagas.')) return;

    try {
      await supabase.from('bloqueios_agenda').update({ ativo: false }).eq('id', id);
      setNotification({ type: 'success', message: 'Bloqueio desativado com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir bloqueio:', error);
      setNotification({ type: 'error', message: 'Erro ao excluir configuração.' });
    }
  }

  function handleEdit(vaga: Vaga) {
    setFormData({
      data: vaga.data,
      medico_id: vaga.medico_id,
      turno: vaga.turno,
      vagas_totais: vaga.vagas_totais,
    });
    setEditingId(vaga.id);
    setActiveTab('vaga');
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      data: '',
      medico_id: '',
      turno: 'manha',
      vagas_totais: 1,
    });
    setBloqueioForm({
      medico_id: '',
      data_inicio: '',
      data_fim: '',
      motivo: 'feriado',
    });
    setEditingId(null);
    setShowForm(false);
  }

  const filteredVagas = vagas.filter((vaga) => {
    const matchData = !filterData || vaga.data === filterData;
    const matchMedico = !filterMedico || vaga.medico_id === filterMedico;
    const matchTurno = !filterTurno || vaga.turno === filterTurno;
    return matchData && matchMedico && matchTurno;
  });

  const filteredBloqueios = bloqueios.filter((bloq) => {
    const matchData = !filterData || (bloq.data_inicio <= filterData && bloq.data_fim >= filterData);
    const matchMedico = !filterMedico || bloq.medico_id === filterMedico || bloq.medico_id === null;
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Turno</label>
          <select
            value={filterTurno}
            onChange={(e) => setFilterTurno(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Ambos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Vagas' : 'Nova Configuração'}</h2>
            
            {!editingId && (
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('vaga')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'vaga' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Criar Vagas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bloqueio')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'bloqueio' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bloquear Agenda / Feriado
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'vaga' ? (
                <>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
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
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Médico (Deixe em branco para Feriado Geral)</label>
                    <select
                      value={bloqueioForm.medico_id}
                      onChange={(e) => setBloqueioForm({ ...bloqueioForm, medico_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">TODOS OS MÉDICOS (Bloqueio Global)</option>
                      {medicos.map((medico) => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={bloqueioForm.data_inicio}
                      onChange={(e) => setBloqueioForm({ ...bloqueioForm, data_inicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={bloqueioForm.data_fim}
                      onChange={(e) => setBloqueioForm({ ...bloqueioForm, data_fim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                    <select
                      value={bloqueioForm.motivo}
                      onChange={(e) => setBloqueioForm({ ...bloqueioForm, motivo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    >
                      <option value="feriado">Feriado Nacional / Geral</option>
                      <option value="ferias">Férias</option>
                      <option value="licenca">Licença</option>
                      <option value="afastamento">Afastamento</option>
                      <option value="abono">Abono</option>
                      <option value="indisponibilidade">Indisponibilidade</option>
                    </select>
                  </div>
                </>
              )}

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

      {/* Tabs Options for the lists */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveListTab('vagas')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeListTab === 'vagas' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Vagas Configuradas
        </button>
        <button
          onClick={() => setActiveListTab('bloqueios')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeListTab === 'bloqueios' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bloqueios Pendentes / Feriados
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {activeListTab === 'vagas' ? (
          <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Médico</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turno</th>
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
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${vaga.turno === 'manha' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {vaga.turno === 'manha' ? 'MANHÃ' : 'TARDE'}
                    </span>
                  </td>
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
        ) : (
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Período</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Médico</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Motivo</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBloqueios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum bloqueio ou feriado encontrado.
                  </td>
                </tr>
              ) : (
                filteredBloqueios.map((bloq) => (
                  <tr key={bloq.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {new Date(bloq.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} 
                      {bloq.data_inicio !== bloq.data_fim && ` até ${new Date(bloq.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {bloq.medico_id ? bloq.medico?.nome : <span className="text-red-600 font-bold">TODOS OS MÉDICOS (GLOBAL)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${bloq.motivo === 'feriado' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                        {bloq.motivo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteBloqueio(bloq.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Desativar Bloqueio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
