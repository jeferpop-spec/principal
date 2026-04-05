/**
 * Hook customizado para gerenciar bloqueios de agenda
 * Fornece operações CRUD e consultas sobre bloqueios
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { BloqueioAgenda, CreateBloqueioDTO, UpdateBloqueioDTO, DiaBloqueado } from '../lib/bloqueios.types';

interface UseBloqueiosReturn {
  bloqueios: BloqueioAgenda[];
  bloqueiosPorMedico: Map<string, BloqueioAgenda[]>;
  loading: boolean;
  error: string | null;
  diasBloqueados: Map<string, DiaBloqueado>; // Map<data-medicId, DiaBloqueado>

  // Operações CRUD
  criarBloqueio: (bloqueio: CreateBloqueioDTO) => Promise<BloqueioAgenda | null>;
  atualizarBloqueio: (id: string, atualizacoes: UpdateBloqueioDTO) => Promise<BloqueioAgenda | null>;
  deletarBloqueio: (id: string) => Promise<boolean>;

  // Consultas
  carregarBloqueios: (dataInicio?: string, dataFim?: string) => Promise<void>;
  carregarBloqueiosPorMedico: (medicoId: string, meses?: number) => Promise<BloqueioAgenda[]>;
  verificarDiaBloqueado: (medicoId: string, data: string) => BloqueioAgenda | null;
  obterDiasBloqueadosIntervalo: (medicoId: string, dataInicio: string, dataFim: string) => DiaBloqueado[];
  verificarConflito: (medicoId: string, dataInicio: string, dataFim: string, excludeBloqueioId?: string) => boolean;

  // Utilitários
  limpar: () => void;
}

const MESES_PADRAO = 12;

export function useBloqueios(): UseBloqueiosReturn {
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [bloqueiosPorMedico, setBloqueiosPorMedico] = useState<Map<string, BloqueioAgenda[]>>(new Map());
  const [diasBloqueados, setDiasBloqueados] = useState<Map<string, DiaBloqueado>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega bloqueios do Supabase em um período específico
   */
  const carregarBloqueios = useCallback(
    async (dataInicio?: string, dataFim?: string) => {
      setLoading(true);
      setError(null);
      try {
        // Se não especificado, usa 12 meses a partir de hoje
        const start = dataInicio || new Date().toISOString().split('T')[0];
        const hoje = new Date(start);
        const daqui12Meses = new Date(hoje);
        daqui12Meses.setMonth(daqui12Meses.getMonth() + MESES_PADRAO);
        const end = dataFim || daqui12Meses.toISOString().split('T')[0];

        const { data, error: err } = await supabase
          .from('bloqueios_agenda')
          .select('*')
          .eq('ativo', true)
          .gte('data_fim', start)
          .lte('data_inicio', end)
          .order('data_inicio', { ascending: true });

        if (err) throw err;

        const bloqueiosCarregados = (data || []) as BloqueioAgenda[];
        setBloqueios(bloqueiosCarregados);

        // Organizar por médico
        const porMedico = new Map<string, BloqueioAgenda[]>();
        bloqueiosCarregados.forEach((bloqueio) => {
          if (!porMedico.has(bloqueio.medico_id)) {
            porMedico.set(bloqueio.medico_id, []);
          }
          porMedico.get(bloqueio.medico_id)?.push(bloqueio);
        });
        setBloqueiosPorMedico(porMedico);

        // Pré-computar dias bloqueados
        const diasMap = new Map<string, DiaBloqueado>();
        bloqueiosCarregados.forEach((bloqueio) => {
          const dataAtual = new Date(bloqueio.data_inicio + 'T00:00:00');
          const dataFimBloquio = new Date(bloqueio.data_fim + 'T00:00:00');

          while (dataAtual <= dataFimBloquio) {
            const dataStr = dataAtual.toISOString().split('T')[0];
            const key = `${dataStr}-${bloqueio.medico_id}`;
            const diasRestantes = Math.ceil(
              (dataFimBloquio.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24)
            );

            diasMap.set(key, {
              data: dataStr,
              medico_id: bloqueio.medico_id,
              bloqueio,
              diasRestantes,
            });

            dataAtual.setDate(dataAtual.getDate() + 1);
          }
        });
        setDiasBloqueados(diasMap);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar bloqueios';
        setError(message);
        console.error('Erro em carregarBloqueios:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Carrega bloqueios de um médico específico
   */
  const carregarBloqueiosPorMedico = useCallback(
    async (medicoId: string, meses: number = MESES_PADRAO) => {
      setLoading(true);
      setError(null);
      try {
        const hoje = new Date();
        const dataInicio = hoje.toISOString().split('T')[0];
        
        const daqui = new Date(hoje);
        daqui.setMonth(daqui.getMonth() + meses);
        const dataFim = daqui.toISOString().split('T')[0];

        const { data, error: err } = await supabase
          .from('bloqueios_agenda')
          .select('*')
          .eq('medico_id', medicoId)
          .eq('ativo', true)
          .gte('data_fim', dataInicio)
          .lte('data_inicio', dataFim)
          .order('data_inicio', { ascending: true });

        if (err) throw err;

        const bloqueiosCarregados = (data || []) as BloqueioAgenda[];
        return bloqueiosCarregados;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar bloqueios do médico';
        setError(message);
        console.error('Erro em carregarBloqueiosPorMedico:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Cria um novo bloqueio
   */
  const criarBloqueio = useCallback(
    async (bloqueioData: CreateBloqueioDTO): Promise<BloqueioAgenda | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('bloqueios_agenda')
          .insert([bloqueioData] as Database['public']['Tables']['bloqueios_agenda']['Insert'][])
          .select()
          .single();

        if (err) throw err;

        const novoBloqueio = data as BloqueioAgenda;
        setBloqueios((prev) => [novoBloqueio, ...prev]);

        // Atualizar mapa por médico
        setBloqueiosPorMedico((prev) => {
          const novo = new Map(prev);
          const lista = novo.get(bloqueioData.medico_id) || [];
          novo.set(bloqueioData.medico_id, [novoBloqueio, ...lista]);
          return novo;
        });

        // Recarregar dias bloqueados
        await carregarBloqueios();

        return novoBloqueio;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar bloqueio';
        setError(message);
        console.error('Erro em criarBloqueio:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [carregarBloqueios]
  );

  /**
   * Atualiza um bloqueio existente
   */
  const atualizarBloqueio = useCallback(
    async (id: string, atualizacoes: UpdateBloqueioDTO): Promise<BloqueioAgenda | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('bloqueios_agenda')
          .update(atualizacoes as Database['public']['Tables']['bloqueios_agenda']['Update'])
          .eq('id', id)
          .select()
          .single();

        if (err) throw err;

        const bloqueioAtualizado = data as BloqueioAgenda;

        setBloqueios((prev) =>
          prev.map((b) => (b.id === id ? bloqueioAtualizado : b))
        );

        // Recarregar dias bloqueados
        await carregarBloqueios();

        return bloqueioAtualizado;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar bloqueio';
        setError(message);
        console.error('Erro em atualizarBloqueio:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [carregarBloqueios]
  );

  /**
   * Deleta um bloqueio (soft delete - apenas marca como inativo)
   */
  const deletarBloqueio = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from('bloqueios_agenda')
          .update({ ativo: false } as Database['public']['Tables']['bloqueios_agenda']['Update'])
          .eq('id', id);

        if (err) throw err;

        setBloqueios((prev) => prev.filter((b) => b.id !== id));

        // Recarregar dias bloqueados
        await carregarBloqueios();

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao deletar bloqueio';
        setError(message);
        console.error('Erro em deletarBloqueio:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [carregarBloqueios]
  );

  /**
   * Verifica se um dia específico está bloqueado para um médico
   */
  const verificarDiaBloqueado = useCallback(
    (medicoId: string, data: string): BloqueioAgenda | null => {
      const key = `${data}-${medicoId}`;
      const diaBloqueado = diasBloqueados.get(key);
      return diaBloqueado ? diaBloqueado.bloqueio : null;
    },
    [diasBloqueados]
  );

  /**
   * Obtém todos os dias bloqueados de um médico em um intervalo
   */
  const obterDiasBloqueadosIntervalo = useCallback(
    (medicoId: string, dataInicio: string, dataFim: string): DiaBloqueado[] => {
      const dias: DiaBloqueado[] = [];
      const dataAtual = new Date(dataInicio + 'T00:00:00');
      const dataFinalObj = new Date(dataFim + 'T00:00:00');

      while (dataAtual <= dataFinalObj) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        const key = `${dataStr}-${medicoId}`;
        const diaBloqueado = diasBloqueados.get(key);

        if (diaBloqueado) {
          dias.push(diaBloqueado);
        }

        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      return dias;
    },
    [diasBloqueados]
  );

  /**
   * Verifica se há conflito de bloqueio em um período
   */
  const verificarConflito = useCallback(
    (medicoId: string, dataInicio: string, dataFim: string, excludeBloqueioId?: string): boolean => {
      const bloqueiosMedico = bloqueiosPorMedico.get(medicoId) || [];

      return bloqueiosMedico.some((bloqueio) => {
        if (excludeBloqueioId && bloqueio.id === excludeBloqueioId) {
          return false;
        }

        // Verificar sobreposição
        const start = new Date(dataInicio + 'T00:00:00');
        const end = new Date(dataFim + 'T00:00:00');
        const bloqueioStart = new Date(bloqueio.data_inicio + 'T00:00:00');
        const bloqueioEnd = new Date(bloqueio.data_fim + 'T00:00:00');

        return !(end < bloqueioStart || start > bloqueioEnd);
      });
    },
    [bloqueiosPorMedico]
  );

  /**
   * Limpa todos os dados
   */
  const limpar = useCallback(() => {
    setBloqueios([]);
    setBloqueiosPorMedico(new Map());
    setDiasBloqueados(new Map());
    setError(null);
  }, []);

  // Carregar bloqueios na montagem
  useEffect(() => {
    carregarBloqueios();
  }, [carregarBloqueios]);

  return {
    bloqueios,
    bloqueiosPorMedico,
    loading,
    error,
    diasBloqueados,
    criarBloqueio,
    atualizarBloqueio,
    deletarBloqueio,
    carregarBloqueios,
    carregarBloqueiosPorMedico,
    verificarDiaBloqueado,
    obterDiasBloqueadosIntervalo,
    verificarConflito,
    limpar,
  };
}
