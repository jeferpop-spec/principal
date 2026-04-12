import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Notification, NotificationType } from '../components/Notification';
import { STATUS_OCUPAM_VAGA } from '../lib/marcacoes.utils';
import { MarcacaoRapidaData } from '../App';

interface Medico {
  id: string;
  nome: string;
}

interface FormData {
  data: string;
  medico_id: string;
  turno: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
}

interface CodigoInfo {
  medico_id: string;
  modalidade: string;
  especialidade: string;
  codigo_aghu: string;
}

interface MarcacaoProps {
  precheckedData?: MarcacaoRapidaData | null;
  onClear?: () => void;
}

export function Marcacao({ precheckedData, onClear }: MarcacaoProps) {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [codigoSugerido, setCodigoSugerido] = useState('');
  const [vagasDisponiveis, setVagasDisponiveis] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: NotificationType; text: string } | null>(null);
  const [allCodigos, setAllCodigos] = useState<CodigoInfo[]>([]);

  const [formData, setFormData] = useState<FormData>({
    data: '',
    medico_id: '',
    turno: 'manha',
    modalidade: '',
    especialidade: '',
    codigo_aghu: '',
  });

  useEffect(() => {
    loadMedicos();
    loadAllCodigos();
  }, []);

  /**
   * Pré-preenche formulário quando vem de marcação rápida da agenda
   */
  useEffect(() => {
    if (precheckedData) {
      setFormData((prev) => ({
        ...prev,
        data: precheckedData.data,
        medico_id: precheckedData.medico_id,
        turno: precheckedData.turno || 'manha',
        modalidade: precheckedData.modalidade,
        especialidade: '', // Será preenchido automaticamente pelo changehandler
        codigo_aghu: '',
      }));
    }
  }, [precheckedData]);

  useEffect(() => {
    if (formData.medico_id) {
      updateModalidades();
    } else {
      setModalidades([]);
      setEspecialidades([]);
      setCodigoSugerido('');
      setFormData((prev) => ({ ...prev, modalidade: '', especialidade: '', codigo_aghu: '' }));
    }
  }, [formData.medico_id, allCodigos]);

  useEffect(() => {
    if (formData.modalidade && formData.medico_id) {
      updateEspecialidades();
    } else {
      setEspecialidades([]);
      setCodigoSugerido('');
      setFormData((prev) => ({ ...prev, especialidade: '', codigo_aghu: '' }));
    }
  }, [formData.modalidade, allCodigos]);

  useEffect(() => {
    if (formData.especialidade && formData.modalidade && formData.medico_id) {
      updateCodigoAghu();
    } else {
      setCodigoSugerido('');
      setFormData((prev) => ({ ...prev, codigo_aghu: '' }));
    }
  }, [formData.especialidade, allCodigos]);

  useEffect(() => {
    if (formData.data && formData.medico_id && formData.turno) {
      checkVagasDisponiveis();
    } else {
      setVagasDisponiveis(null);
    }
  }, [formData.data, formData.medico_id, formData.turno]);

  async function loadMedicos() {
    try {
      const { data } = await supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome');
      if (data) setMedicos(data);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  }

  async function loadAllCodigos() {
    try {
      const { data, error } = await supabase.from('codigos_aghu').select('medico_id, modalidade, exame, codigo_aghu').eq('ativo', true);
      if (error) throw error;
      if (data) {
        const mappedData = data.map((c: any) => ({
          medico_id: c.medico_id,
          modalidade: c.modalidade,
          especialidade: c.exame,
          codigo_aghu: c.codigo_aghu
        }));
        setAllCodigos(mappedData as CodigoInfo[]);
      }
    } catch (error) {
      console.error('Erro ao carregar códigos:', error);
    }
  }

  function updateModalidades() {
    const modalidadesUniques = [...new Set(allCodigos.filter((c) => c.medico_id === formData.medico_id).map((c) => c.modalidade))];
    setModalidades(modalidadesUniques.sort());
  }

  function updateEspecialidades() {
    const especialidadesUniques = [
      ...new Set(
        allCodigos
          .filter((c) => c.medico_id === formData.medico_id && c.modalidade === formData.modalidade)
          .map((c) => c.especialidade)
      ),
    ];
    setEspecialidades(especialidadesUniques.sort());
  }

  function updateCodigoAghu() {
    const codigo = allCodigos.find(
      (c) =>
        c.medico_id === formData.medico_id &&
        c.modalidade === formData.modalidade &&
        c.especialidade === formData.especialidade
    );

    if (codigo) {
      setCodigoSugerido(codigo.codigo_aghu);
      setFormData((prev) => ({ ...prev, codigo_aghu: codigo.codigo_aghu }));
    } else {
      setCodigoSugerido('');
      setFormData((prev) => ({ ...prev, codigo_aghu: '' }));
    }
  }

  async function checkVagasDisponiveis() {
    try {
      const { data: vagaConfig } = await supabase
        .from('vagas_dia')
        .select('vagas_totais')
        .eq('data', formData.data)
        .eq('medico_id', formData.medico_id)
        .eq('turno', formData.turno)
        .maybeSingle() as { data: { vagas_totais: number } | null };

      if (!vagaConfig) {
        setVagasDisponiveis(null);
        return;
      }

      const { count } = await supabase
        .from('marcacoes')
        .select('id', { count: 'exact' })
        .eq('data', formData.data)
        .eq('medico_id', formData.medico_id)
        .eq('turno', formData.turno)
        .in('status', STATUS_OCUPAM_VAGA as unknown as string[]);

      const ocupadas = count || 0;
      const disponiveis = vagaConfig.vagas_totais - ocupadas;
      setVagasDisponiveis(Math.max(0, disponiveis));
    } catch (error) {
      console.error('Erro ao verificar vagas:', error);
      setVagasDisponiveis(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotification(null);

    if (!formData.data || !formData.medico_id || !formData.modalidade || !formData.especialidade) {
      setNotification({
        type: 'error',
        text: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (vagasDisponiveis === null) {
      setNotification({
        type: 'error',
        text: 'Não há configuração de vagas para este médico nesta data.',
      });
      return;
    }

    if (vagasDisponiveis <= 0) {
      setNotification({
        type: 'error',
        text: 'Não há vagas disponíveis para este médico nesta data.',
      });
      return;
    }

    try {
      const { error: insertError } = await supabase.from('marcacoes').insert([formData] as Database['public']['Tables']['marcacoes']['Insert'][]);

      if (insertError) {
        if (insertError.code === '23505') {
          setNotification({
            type: 'warning',
            text: 'Esta marcação já existe.',
          });
          return;
        }
        throw insertError;
      }

      setNotification({
        type: 'success',
        text: 'Marcação realizada com sucesso!',
      });

      setFormData({
        data: '',
        medico_id: '',
        turno: 'manha',
        modalidade: '',
        especialidade: '',
        codigo_aghu: '',
      });
      setVagasDisponiveis(null);

      // Limpar dados de marcação rápida se vieram da agenda
      if (onClear) {
        onClear();
      }

      setTimeout(() => {
        loadAllCodigos();
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar marcação:', error);
      setNotification({
        type: 'error',
        text: 'Erro ao realizar marcação. Tente novamente.',
      });
    }
  }

  return (
    <div>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.text}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Nova Marcação</h1>
        <p className="text-gray-500 mt-1">Registrar atendimento com seleção inteligente</p>
        
        {precheckedData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ✓ <strong>Marcação rápida:</strong> Dados pré-preenchidos da agenda
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
            <select
              value={formData.medico_id}
              onChange={(e) =>
                setFormData({ ...formData, medico_id: e.target.value, modalidade: '', especialidade: '', codigo_aghu: '' })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
            <select
              value={formData.turno}
              onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>

          {formData.medico_id && formData.data && vagasDisponiveis !== null && (
            <div
              className={`p-4 rounded-lg ${
                vagasDisponiveis > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {vagasDisponiveis > 0 ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="font-medium">
                  {vagasDisponiveis > 0
                    ? `${vagasDisponiveis} ${vagasDisponiveis === 1 ? 'vaga disponível' : 'vagas disponíveis'}`
                    : 'Sem vagas disponíveis'}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
            <select
              value={formData.modalidade}
              onChange={(e) => setFormData({ ...formData, modalidade: e.target.value, especialidade: '', codigo_aghu: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={!formData.medico_id}
              required
            >
              <option value="">Selecione uma modalidade</option>
              {modalidades.map((modalidade) => (
                <option key={modalidade} value={modalidade}>
                  {modalidade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade / Exame</label>
            <select
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={!formData.modalidade}
              required
            >
              <option value="">Selecione uma especialidade</option>
              {especialidades.map((especialidade) => (
                <option key={especialidade} value={especialidade}>
                  {especialidade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código AGHU</label>
            <input
              type="text"
              value={formData.codigo_aghu}
              onChange={(e) => setFormData({ ...formData, codigo_aghu: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Código será preenchido automaticamente"
              readOnly
              required
            />
            {codigoSugerido && (
              <p className="mt-1 text-sm text-gray-500">Código preenchido automaticamente</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={vagasDisponiveis === null || vagasDisponiveis <= 0}
            >
              Confirmar Marcação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
