import { useEffect, useState } from 'react';
import { Trash2, Search, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../components/Notification';

interface Marcacao {
  id: string;
  data: string;
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
  status: string;
  medico?: {
    nome: string;
  };
  created_at: string;
}

export function Marcacoes() {
  const [marcacoes, setMarcacoes] = useState<Marcacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterData, setFilterData] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [medicos, setMedicos] = useState<{ id: string; nome: string }[]>([]);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);

  useEffect(() => {
    loadMarcacoes();
    loadMedicos();
  }, []);

  async function loadMarcacoes() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('marcacoes')
        .select('*, medico:medicos(nome)')
        .order('data', { ascending: false });

      if (data) {
        setMarcacoes(data as unknown as Marcacao[]);
      }
    } catch (error) {
      console.error('Erro ao carregar marcações:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar marcações',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadMedicos() {
    try {
      const { data } = await supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome');
      if (data) setMedicos(data);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  }

  async function handleDelete(id: string, data: string, medico_nome: string) {
    if (!confirm(`Deseja realmente cancelar a marcação de ${medico_nome} em ${new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('marcacoes').delete().eq('id', id);

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Marcação cancelada com sucesso!',
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      loadMarcacoes();
    } catch (error) {
      console.error('Erro ao deletar marcação:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao cancelar marcação. Tente novamente.',
      });
    }
  }

  const filteredMarcacoes = marcacoes.filter((m) => {
    const matchData = !filterData || m.data === filterData;
    const matchMedico = !filterMedico || m.medico_id === filterMedico;
    const matchStatus = !filterStatus || m.status === filterStatus;
    return matchData && matchMedico && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Carregando marcações...</p>
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Marcações</h1>
        <p className="text-gray-500 mt-1">Visualizar, filtrar e cancelar marcações</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Data</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
              <option value="">Todos</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total de Marcações</label>
            <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{filteredMarcacoes.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Médico</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Modalidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Especialidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMarcacoes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma marcação encontrada
                </td>
              </tr>
            ) : (
              filteredMarcacoes.map((marcacao) => (
                <tr key={marcacao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(marcacao.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{marcacao.medico?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{marcacao.modalidade}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{marcacao.especialidade}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        marcacao.status === 'agendado'
                          ? 'bg-blue-100 text-blue-800'
                          : marcacao.status === 'confirmado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {marcacao.status.charAt(0).toUpperCase() + marcacao.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(marcacao.id, marcacao.data, marcacao.medico?.nome || 'Paciente')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancelar marcação"
                    >
                      <Trash2 size={16} />
                    </button>
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
