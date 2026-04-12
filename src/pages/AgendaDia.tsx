import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../components/Notification';
import { VagaIndicator } from '../components/VagaIndicator';
import { useBloqueios } from '../hooks/useBloqueios';
import { motivosBloqueio } from '../lib/bloqueios.types';
import { agruparMarcacoesPorDiaMedico } from '../lib/marcacoes.utils';
import { calcularEstadoCelula } from '../lib/agenda.utils';
import { MarcacaoRapidaData } from '../App';

interface AgendaDiaProps {
  onMarcacaoRapida?: (data: MarcacaoRapidaData) => void;
  onNavigate?: (page: 'marcacao') => void;
}

interface VagaDia {
  data: string;
  medico_id: string;
  medicoNome: string;
  modalidade?: string;
  turno: string;
  vagas_totais: number;
  vagas_preenchidas: number;
}

interface ResumoDia {
  totalVagas: number;
  totalOcupadas: number;
  totalDisponiveis: number;
  totalMedicos: number;
  totalBloqueios: number;
}

type NotificationState = {
  type: NotificationType;
  message: string;
} | null;

export function AgendaDia({ onMarcacaoRapida, onNavigate }: AgendaDiaProps) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [vagasDoDia, setVagasDoDia] = useState<VagaDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModalidade, setFilterModalidade] = useState('');
  const [filterMedico, setFilterMedico] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [medicos, setMedicos] = useState<{ id: string; nome: string }[]>([]);
  const [resumoDia, setResumoDia] = useState<ResumoDia>({
    totalVagas: 0,
    totalOcupadas: 0,
    totalDisponiveis: 0,
    totalMedicos: 0,
    totalBloqueios: 0,
  });
  const [notification, setNotification] = useState<NotificationState>(null);

  const { carregarBloqueios, verificarDiaBloqueado } = useBloqueios();

  useEffect(() => {
    loadMedicos();
    loadAgendaDia();
  }, [dataSelecionada]);

  async function loadMedicos() {
    try {
      const { data } = await supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome');
      if (data) setMedicos(data);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  }

  async function loadAgendaDia() {
    setLoading(true);
    try {
      const dataStr = dataSelecionada.toISOString().split('T')[0];

      // Carregar bloqueios do dia
      await carregarBloqueios(dataStr, dataStr);

      // Fetch vagas do dia
      const { data: vagas } = await supabase
        .from('vagas_dia')
        .select('*, medico:medicos(nome)')
        .eq('data', dataStr);

      const todasModalidades = new Set<string>();

      // Fetch marcações do dia
      const { data: marcacoes } = await supabase
        .from('marcacoes')
        .select('data, medico_id, status, turno')
        .eq('data', dataStr);

      // Agrupar marcações por médico (apenas as que ocupam vaga)
      const marcacoesPorMedico = agruparMarcacoesPorDiaMedico(marcacoes || []);

      const vagasDia: VagaDia[] = [];
      const modalidadesSet = new Set<string>();

      vagas?.forEach((vaga: any) => {
        const key = `${dataStr}-${vaga.medico_id}-${vaga.turno}`;
        const preenchidas = marcacoesPorMedico.get(key) || 0;
        const modalidade = vaga.modalidade || '';
        if (modalidade) todasModalidades.add(modalidade);

        vagasDia.push({
          data: vaga.data,
          medico_id: vaga.medico_id,
          medicoNome: vaga.medico.nome,
          modalidade,
          turno: vaga.turno,
          vagas_totais: vaga.vagas_totais,
          vagas_preenchidas: preenchidas,
        });
      });

      // Calcular resumo
      const resumo: ResumoDia = {
        totalVagas: vagasDia.reduce((sum, v) => sum + v.vagas_totais, 0),
        totalOcupadas: vagasDia.reduce((sum, v) => sum + v.vagas_preenchidas, 0),
        totalDisponiveis: 0,
        totalMedicos: vagasDia.length,
        totalBloqueios: 0,
      };
      resumo.totalDisponiveis = resumo.totalVagas - resumo.totalOcupadas;

      // Contar bloqueios (se houver feriado global, as celulas vão pintar de vermelho de qualquer forma)
      vagasDia.forEach((vaga) => {
        const bloqueio = verificarDiaBloqueado(vaga.medico_id, dataStr);
        if (bloqueio) resumo.totalBloqueios++;
      });

      setVagasDoDia(vagasDia);
      const mods = Array.from(todasModalidades).sort();
      setModalidades(mods);
      
      // Auto-seleciona a primeira modalidade para não misturá-las
      setFilterModalidade((prev) => {
        if (!prev && mods.length > 0) return mods[0];
        if (prev && !mods.includes(prev) && mods.length > 0) return mods[0];
        return prev;
      });
      
      setResumoDia(resumo);
    } catch (error) {
      console.error('Erro ao carregar agenda do dia:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar agenda do dia',
      });
    } finally {
      setLoading(false);
    }
  }

  function navegarDia(delta: number) {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + delta);
    setDataSelecionada(novaData);
  }

  function irParaHoje() {
    setDataSelecionada(new Date());
  }

  function handleMarcacaoRapida(vaga: VagaDia) {
    const bloqueio = verificarDiaBloqueado(vaga.medico_id, vaga.data);
    if (bloqueio) return;

    const ehLotado = vaga.vagas_preenchidas >= vaga.vagas_totais;
    if (ehLotado) return;

    if (onMarcacaoRapida && onNavigate) {
      onMarcacaoRapida({
        data: vaga.data,
        medico_id: vaga.medico_id,
        modalidade: vaga.modalidade || '',
        turno: vaga.turno,
      });
      onNavigate('marcacao');
    }
  }

  function podeClicar(vaga: VagaDia): boolean {
    const bloqueio = verificarDiaBloqueado(vaga.medico_id, vaga.data);
    if (bloqueio) return false;

    const ehLotado = vaga.vagas_preenchidas >= vaga.vagas_totais;
    return !ehLotado && onMarcacaoRapida !== undefined && onNavigate !== undefined;
  }

  // Filtrar vagas
  const vagasFiltradas = vagasDoDia.filter((vaga) => {
    const matchModalidade = !filterModalidade || vaga.modalidade === filterModalidade;
    const matchMedico = !filterMedico || vaga.medico_id === filterMedico;
    const matchTurno = !filterTurno || vaga.turno === filterTurno;
    return matchModalidade && matchMedico && matchTurno;
  });

  // Ordenar: disponíveis/parciais primeiro, depois lotadas, depois bloqueadas
  const vagasOrdenadas = vagasFiltradas.sort((a, b) => {
    const bloqueioA = verificarDiaBloqueado(a.medico_id, a.data);
    const bloqueioB = verificarDiaBloqueado(b.medico_id, b.data);

    if (bloqueioA && !bloqueioB) return 1;
    if (!bloqueioA && bloqueioB) return -1;

    const ehFeriadoA = verificarDiaBloqueado('global', a.data)?.motivo === 'feriado';
    const ehFeriadoB = verificarDiaBloqueado('global', b.data)?.motivo === 'feriado';

    const estadoA = calcularEstadoCelula(a.vagas_totais, a.vagas_preenchidas, bloqueioA || undefined, ehFeriadoA);
    const estadoB = calcularEstadoCelula(b.vagas_totais, b.vagas_preenchidas, bloqueioB || undefined, ehFeriadoB);

    // Ordenar por estado: disponivel/parcial primeiro, depois lotada, depois bloqueada
    const ordemEstados = { disponivel: 0, parcial: 1, lotada: 2, bloqueada: 3, feriado: 4 };
    return ordemEstados[estadoA.state] - ordemEstados[estadoB.state];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p>Carregando agenda do dia...</p>
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

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Agenda do Dia</h1>
        <p className="text-gray-500 mt-1">Visão operacional diária da unidade</p>
      </div>

      {/* Seletor de Data */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navegarDia(-1)}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>

            <div className="relative">
              <input
                type="date"
                value={dataSelecionada.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    // Adiciona o T00:00:00 para evitar que a data volte 1 dia por fuso horário.
                    setDataSelecionada(new Date(e.target.value + 'T00:00:00'));
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-700 font-semibold md:w-48 text-center uppercase tracking-wide cursor-pointer"
              />
            </div>

            <button
              onClick={() => navegarDia(1)}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          <button
            onClick={irParaHoje}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{resumoDia.totalVagas}</p>
              <p className="text-sm text-gray-500">Total de Vagas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{resumoDia.totalOcupadas}</p>
              <p className="text-sm text-gray-500">Ocupadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{resumoDia.totalDisponiveis}</p>
              <p className="text-sm text-gray-500">Disponíveis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{resumoDia.totalMedicos}</p>
              <p className="text-sm text-gray-500">Médicos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{resumoDia.totalBloqueios}</p>
              <p className="text-sm text-gray-500">Bloqueados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
            <select
              value={filterModalidade}
              onChange={(e) => setFilterModalidade(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-800 font-bold shadow-sm"
            >
              {modalidades.map((modalidade) => (
                <option key={modalidade} value={modalidade}>
                  {modalidade}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Turno</label>
            <select
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Ambos os turnos</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Médicos/Modalidades */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Agendas do Dia</h2>
          <p className="text-gray-500 mt-1">Clique em uma agenda disponível para marcar</p>
        </div>

        <div className="divide-y divide-gray-200">
          {vagasOrdenadas.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma agenda encontrada para este dia</p>
            </div>
          ) : (
            vagasOrdenadas.map((vaga) => {
              const bloqueio = verificarDiaBloqueado(vaga.medico_id, vaga.data);
              const ehFeriadoGlobal = verificarDiaBloqueado('global', vaga.data)?.motivo === 'feriado';
              const estadoCelula = calcularEstadoCelula(
                vaga.vagas_totais,
                vaga.vagas_preenchidas,
                bloqueio ? bloqueio : undefined,
                ehFeriadoGlobal
              );

              return (
                <div
                  key={`${vaga.medico_id}-${vaga.data}-${vaga.turno}`}
                  onClick={() => handleMarcacaoRapida(vaga)}
                  className={`p-6 transition-all ${
                    podeClicar(vaga)
                      ? 'cursor-pointer hover:bg-gray-50'
                      : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800">{vaga.medicoNome}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${vaga.turno === 'manha' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {vaga.turno === 'manha' ? 'MANHÃ' : 'TARDE'}
                            </span>
                          </div>
                          {vaga.modalidade && (
                            <p className="text-sm text-gray-600 uppercase tracking-wide">{vaga.modalidade}</p>
                          )}
                        </div>

                        {bloqueio || ehFeriadoGlobal ? (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${ehFeriadoGlobal ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                            <span className="text-lg">
                              {ehFeriadoGlobal ? '🎉' : bloqueio?.motivo === 'ferias' ? '🔴' : '⛔'}
                            </span>
                            {ehFeriadoGlobal ? 'FERIADO' : bloqueio?.motivo === 'ferias' ? 'FÉRIAS' : motivosBloqueio[bloqueio!.motivo].label.toUpperCase()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <VagaIndicator
                              total={vaga.vagas_totais}
                              preenchidas={vaga.vagas_preenchidas}
                              status="livre"
                              size="sm"
                              showLabel={false}
                            />
                            <div className="text-lg font-semibold text-gray-700">
                              {vaga.vagas_preenchidas}/{vaga.vagas_totais}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!bloqueio && (
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          estadoCelula.state === 'disponivel'
                            ? 'bg-green-100 text-green-800'
                            : estadoCelula.state === 'parcial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {estadoCelula.state === 'disponivel'
                            ? 'Disponível'
                            : estadoCelula.state === 'parcial'
                            ? 'Parcial'
                            : 'Lotada'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}