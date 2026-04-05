import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../components/Notification';

interface Medico {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Codigo {
  id: string;
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
  ativo: boolean;
  medico?: {
    nome: string;
  };
}

interface FormData {
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
  ativo: boolean;
}

export function Codigos() {
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    medico_id: '',
    modalidade: '',
    especialidade: '',
    codigo_aghu: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [codigosRes, medicosRes] = await Promise.all([
        supabase.from('codigos_aghu').select('*, medico:medicos(nome)').order('created_at', { ascending: false }),
        supabase.from('medicos').select('*').eq('ativo', true).order('nome'),
      ]);

      if (codigosRes.data) setCodigos(codigosRes.data as unknown as Codigo[]);
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
        await supabase.from('codigos_aghu').update(formData).eq('id', editingId);
        setNotification({ type: 'success', message: 'Código atualizado com sucesso!' });
      } else {
        await supabase.from('codigos_aghu').insert([formData]);
        setNotification({ type: 'success', message: 'Código cadastrado com sucesso!' });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setNotification({ type: 'error', message: 'Erro ao salvar código. Tente novamente.' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este código?')) return;

    try {
      await supabase.from('codigos_aghu').delete().eq('id', id);
      setNotification({ type: 'success', message: 'Código excluído com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setNotification({ type: 'error', message: 'Erro ao excluir código. Tente novamente.' });
    }
  }

  function handleEdit(codigo: Codigo) {
    setFormData({
      medico_id: codigo.medico_id,
      modalidade: codigo.modalidade,
      especialidade: codigo.especialidade,
      codigo_aghu: codigo.codigo_aghu,
      ativo: codigo.ativo,
    });
    setEditingId(codigo.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      medico_id: '',
      modalidade: '',
      especialidade: '',
      codigo_aghu: '',
      ativo: true,
    });
    setEditingId(null);
    setShowForm(false);
  }

  const filteredCodigos = codigos.filter((codigo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      codigo.medico?.nome.toLowerCase().includes(searchLower) ||
      codigo.modalidade.toLowerCase().includes(searchLower) ||
      codigo.especialidade.toLowerCase().includes(searchLower) ||
      codigo.codigo_aghu.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Carregando códigos...</p>
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
          <h1 className="text-3xl font-bold text-gray-800">Códigos AGHU</h1>
          <p className="text-gray-500 mt-1">Gerenciar códigos vinculados a médicos e especialidades</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          Novo Código
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por médico, modalidade, especialidade ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Código' : 'Novo Código'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                <input
                  type="text"
                  value={formData.modalidade}
                  onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade / Exame</label>
                <input
                  type="text"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código AGHU</label>
                <input
                  type="text"
                  value={formData.codigo_aghu}
                  onChange={(e) => setFormData({ ...formData, codigo_aghu: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Código ativo
                </label>
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
                  {editingId ? 'Atualizar' : 'Cadastrar'}
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Médico</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Modalidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Especialidade</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Código AGHU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCodigos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhum código encontrado
                </td>
              </tr>
            ) : (
              filteredCodigos.map((codigo) => (
                <tr key={codigo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{codigo.medico?.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{codigo.modalidade}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{codigo.especialidade}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-800">{codigo.codigo_aghu}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        codigo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {codigo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(codigo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(codigo.id)}
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
