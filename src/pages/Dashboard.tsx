import { useEffect, useState } from 'react';
import { Users, FileText, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { STATUS_OCUPAM_VAGA } from '../lib/marcacoes.utils';

interface Stats {
  totalMedicos: number;
  codigosAtivos: number;
  vagasMes: number;
  vagasPreenchidas: number;
  taxaOcupacao: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMedicos: 0,
    codigosAtivos: 0,
    vagasMes: 0,
    vagasPreenchidas: 0,
    taxaOcupacao: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const dataHoje = new Date();
      const primeiroDiaMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth() + 1, 0).toISOString().split('T')[0];

      const [medicosRes, codigosRes, vagasRes, marcacoesRes] = await Promise.all([
        supabase.from('medicos').select('id', { count: 'exact' }).eq('ativo', true),
        supabase.from('codigos_aghu').select('id', { count: 'exact' }).eq('ativo', true),
        supabase.from('vagas_dia').select('vagas_totais').gte('data', primeiroDiaMes).lte('data', ultimoDiaMes) as { data: { vagas_totais: number }[] | null },
        supabase.from('marcacoes').select('id', { count: 'exact' }).gte('data', primeiroDiaMes).lte('data', ultimoDiaMes).in('status', STATUS_OCUPAM_VAGA as unknown as string[]),
      ]);

      const totalMedicos = medicosRes.count || 0;
      const codigosAtivos = codigosRes.count || 0;
      const vagasMes = vagasRes.data?.reduce((sum, v) => sum + v.vagas_totais, 0) || 0;
      const vagasPreenchidas = marcacoesRes.count || 0;
      const taxaOcupacao = vagasMes > 0 ? (vagasPreenchidas / vagasMes) * 100 : 0;

      setStats({
        totalMedicos,
        codigosAtivos,
        vagasMes,
        vagasPreenchidas,
        taxaOcupacao,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    {
      title: 'Médicos Cadastrados',
      value: stats.totalMedicos,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Códigos Ativos',
      value: stats.codigosAtivos,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      title: 'Vagas do Mês',
      value: stats.vagasMes,
      icon: Calendar,
      color: 'bg-orange-500',
    },
    {
      title: 'Vagas Preenchidas',
      value: stats.vagasPreenchidas,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${stats.taxaOcupacao.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Visão geral do sistema de vagas e atendimentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div className="text-xs font-semibold text-gray-400">
                  {card.title.includes('Mês') || card.title.includes('Ocupação') || card.title.includes('Preenchidas') ? 'Mês Atual' : 'Hoje'}
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-sm text-gray-600 font-medium">{card.title}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao Sistema</h2>
            <p className="text-gray-500">Plataforma de gestão de vagas e marcações médicas</p>
          </div>
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              Este sistema foi desenvolvido para simplificar o gerenciamento de vagas e marcações de atendimentos médicos.
              Com uma interface intuitiva, você pode organizar sua agenda de forma eficiente e visual.
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-3">Principais funcionalidades:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">▪</span>
                  <span>Cadastre códigos AGHU vinculados a médicos e especialidades</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">▪</span>
                  <span>Configure a quantidade de vagas por médico e data (1 a 6 vagas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">▪</span>
                  <span>Registre marcações com validação automática de disponibilidade</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold mt-1">▪</span>
                  <span>Visualize o calendário com ocupação em tempo real</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Dica do Dia</h3>
            <p className="text-orange-50 text-sm leading-relaxed">
              Use o calendário para ter uma visão geral de todas as vagas. Os quadrinhos laranjas indicam vagas preenchidas
              e os brancos indicam vagas disponíveis.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Navegação Rápida</h3>
            <div className="space-y-3">
              <a
                href="#"
                onClick={() => {}}
                className="block p-3 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <p className="font-medium text-gray-800">Códigos</p>
                <p className="text-xs text-gray-500 mt-1">Gerenciar códigos AGHU</p>
              </a>
              <a
                href="#"
                onClick={() => {}}
                className="block p-3 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <p className="font-medium text-gray-800">Vagas</p>
                <p className="text-xs text-gray-500 mt-1">Configurar vagas do dia</p>
              </a>
              <a
                href="#"
                onClick={() => {}}
                className="block p-3 rounded-lg bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <p className="font-medium text-gray-800">Calendário</p>
                <p className="text-xs text-gray-500 mt-1">Ver vagas visualmente</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
