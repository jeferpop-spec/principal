import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification, NotificationType } from '../components/Notification';

interface VagaDia {
  data: string;
  medico_id: string;
  medico_nome: string;
  vagas_totais: number;
  vagas_preenchidas: number;
}

type NotificationState = {
  type: NotificationType;
  message: string;
} | null;

export function Calendario() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [vagasPorDia, setVagasPorDia] = useState<Map<string, VagaDia[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterMedico, setFilterMedico] = useState('');
  const [medicos, setMedicos] = useState<{ id: string; nome: string }[]>([]);
  const [notification, setNotification] = useState<NotificationState>(null);

  useEffect(() => {
    loadMedicos();
    loadCalendario();
  }, [mesAtual]);

  async function loadMedicos() {
    try {
      const { data } = await supabase.from('medicos').select('id, nome').eq('ativo', true).order('nome');
      if (data) setMedicos(data);
    } catch (error) {
      console.error('Erro ao carregar médicos:', error);
    }
  }

  async function loadCalendario() {
    setLoading(true);
    try {
      const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      const ultimoDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);

      const dataInicio = primeiroDia.toISOString().split('T')[0];
      const dataFim = ultimoDia.toISOString().split('T')[0];

      const { data: vagas } = await supabase
        .from('vagas_dia')
        .select('*, medico:medicos(nome)')
        .gte('data', dataInicio)
        .lte('data', dataFim);

      const { data: marcacoes } = await supabase
        .from('marcacoes')
        .select('data, medico_id, status')
        .gte('data', dataInicio)
        .lte('data', dataFim);

      const marcacoesPorMedicoPorDia = new Map<string, number>();
      marcacoes?.forEach((m) => {
        if (m.status !== 'cancelado') {
          const key = `${m.data}-${m.medico_id}`;
          marcacoesPorMedicoPorDia.set(key, (marcacoesPorMedicoPorDia.get(key) || 0) + 1);
        }
      });

      const vagasMap = new Map<string, VagaDia[]>();

      vagas?.forEach((vaga: any) => {
        const key = `${vaga.data}-${vaga.medico_id}`;
        const preenchidas = marcacoesPorMedicoPorDia.get(key) || 0;

        const vagaDia: VagaDia = {
          data: vaga.data,
          medico_id: vaga.medico_id,
          medico_nome: vaga.medico.nome,
          vagas_totais: vaga.vagas_totais,
          vagas_preenchidas: preenchidas,
        };

        if (!vagasMap.has(vaga.data)) {
          vagasMap.set(vaga.data, []);
        }
        vagasMap.get(vaga.data)?.push(vagaDia);
      });

      setVagasPorDia(vagasMap);
    } catch (error) {
      console.error('Erro ao carregar calendário:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao carregar calendário',
      });
    } finally {
      setLoading(false);
    }
  }

  function getDiasDoMes() {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const dias: Date[] = [];
    const primeiroDiaSemana = primeiroDia.getDay();

    for (let i = 0; i < primeiroDiaSemana; i++) {
      const diaAnterior = new Date(ano, mes, -i);
      dias.unshift(diaAnterior);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }

    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push(new Date(ano, mes + 1, i));
    }

    return dias;
  }

  function mesAnterior() {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  }

  function mesSeguinte() {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  }

  function mesAtualNome() {
    return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  const dias = getDiasDoMes();
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const filteredVagas = filterMedico
    ? Array.from(vagasPorDia).reduce((acc, [date, vagas]) => {
        const filtered = vagas.filter((v) => v.medico_id === filterMedico);
        if (filtered.length > 0) {
          acc.set(date, filtered);
        }
        return acc;
      }, new Map<string, VagaDia[]>())
    : vagasPorDia;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p>Carregando calendário...</p>
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
        <h1 className="text-3xl font-bold text-gray-800">Calendário de Vagas</h1>
        <p className="text-gray-500 mt-1">Visualização profissional de vagas disponíveis e preenchidas</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between flex-1">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200 hover:border-orange-300"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 capitalize text-center flex-1">
                {mesAtualNome()}
              </h2>
              <button
                onClick={mesSeguinte}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200 hover:border-orange-300"
              >
                <ChevronRight size={24} className="text-gray-600" />
              </button>
            </div>

            <select
              value={filterMedico}
              onChange={(e) => setFilterMedico(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-700"
            >
              <option value="">Todos os médicos</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-3 mb-4">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="text-center font-bold text-gray-600 py-3 text-sm md:text-base bg-gray-50 rounded-lg"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3 auto-rows-max">
            {dias.map((dia, index) => {
              const dataStr = dia.toISOString().split('T')[0];
              const vagasDoDia = filteredVagas.get(dataStr) || [];
              const ehMesAtual = dia.getMonth() === mesAtual.getMonth();
              const ehHoje = dataStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={index}
                  className={`min-h-40 rounded-xl border-2 p-3 transition-all ${
                    ehMesAtual
                      ? ehHoje
                        ? 'bg-orange-50 border-orange-300 shadow-lg'
                        : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-md'
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}
                >
                  <div className={`text-lg font-bold mb-3 ${ehMesAtual ? 'text-gray-800' : 'text-gray-400'}`}>
                    {dia.getDate()}
                  </div>

                  {ehHoje && <div className="text-xs font-semibold text-orange-600 mb-2">Hoje</div>}

                  {vagasDoDia.length > 0 && ehMesAtual && (
                    <div className="space-y-3">
                      {vagasDoDia.map((vaga) => (
                        <div key={vaga.medico_id} className="text-xs">
                          <div className="font-semibold text-gray-700 mb-2 leading-tight h-8 flex items-center">
                            <span className="truncate" title={vaga.medico_nome}>
                              {vaga.medico_nome}
                            </span>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {Array.from({ length: vaga.vagas_totais }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-5 h-5 rounded-md border-2 transition-all transform hover:scale-110 ${
                                  i < vaga.vagas_preenchidas
                                    ? 'bg-orange-500 border-orange-600 shadow-sm'
                                    : 'bg-white border-gray-300 hover:border-orange-300'
                                }`}
                                title={
                                  i < vaga.vagas_preenchidas ? 'Vaga preenchida' : 'Vaga disponível'
                                }
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {vaga.vagas_preenchidas} / {vaga.vagas_totais}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {vagasDoDia.length === 0 && ehMesAtual && (
                    <div className="text-xs text-gray-400 italic">Sem vagas</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded-md"></div>
                <div>
                  <p className="font-medium text-gray-700">Vaga disponível</p>
                  <p className="text-xs text-gray-500">Clique na aba Marcação para reservar</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-orange-500 border-2 border-orange-600 rounded-md"></div>
                <div>
                  <p className="font-medium text-gray-700">Vaga preenchida</p>
                  <p className="text-xs text-gray-500">Marcação realizada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
