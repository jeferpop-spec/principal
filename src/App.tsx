import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Codigos } from './pages/Codigos';
import { Vagas } from './pages/Vagas';
import { Marcacao } from './pages/Marcacao';
import { Marcacoes } from './pages/Marcacoes';
import { Calendario } from './pages/Calendario';
import { AgendaDia } from './pages/AgendaDia';
import { ConnectionError } from './components/ConnectionError';
import { supabase } from './lib/supabase';
import { Login } from './pages/Login';
import { getCurrentUserProfile, UserRole } from './lib/auth';

type Page = 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario' | 'agendaDia';

/**
 * Dados de pré-preenchimento para marcação rápida vindo da agenda
 */
export interface MarcacaoRapidaData {
  data: string;
  medico_id: string;
  modalidade: string;
  turno: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('agendaDia');
  const [marcacaoRapidaData, setMarcacaoRapidaData] = useState<MarcacaoRapidaData | null>(null);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Verifica ativamente se o Supabase responde as chamadas e gerencia o Login Inicial
  useEffect(() => {
    async function init() {
      try {
        const { error } = await supabase.from('medicos').select('count', { count: 'exact', head: true });
        
        // Se der erro de fetch, falha de rede ou host não encontrado
        if (error && (error.message.includes('fetch failed') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
          setHasConnectionError(true);
          return;
        }

        // Tentar reaver sessão do usuário
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await getCurrentUserProfile();
          if (profile && profile.ativo) {
            setIsAuthenticated(true);
            setUserRole(profile.role);
            
            // Navegação padrão por Cargo
            if (profile.role === 'admin') {
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('agendaDia');
            }
          } else {
            // Força saída se inativo ou recém deletado do DB
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        setHasConnectionError(true);
      } finally {
        setIsCheckingConnection(false);
      }
    }
    
    init();

    // Ouvinte para Logout global caso o token expire
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function handleLoginSuccess(role: string) {
    setIsAuthenticated(true);
    setUserRole(role as UserRole);
    if (role === 'admin') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('agendaDia');
    }
  }

  // Logout manual chamado pelo Layout
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (isCheckingConnection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <p className="text-gray-500 font-medium">Iniciando sistema e checando credenciais...</p>
        </div>
      </div>
    );
  }

  if (hasConnectionError) {
    return <ConnectionError />;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'codigos':
        return <Codigos />;
      case 'vagas':
        return <Vagas />;
      case 'marcacao':
        return <Marcacao precheckedData={marcacaoRapidaData} onClear={() => setMarcacaoRapidaData(null)} />;
      case 'marcacoes':
        return <Marcacoes />;
      case 'calendario':
        return <Calendario onMarcacaoRapida={setMarcacaoRapidaData} onNavigate={setCurrentPage} />;
      case 'agendaDia':
        return <AgendaDia onMarcacaoRapida={setMarcacaoRapidaData} onNavigate={setCurrentPage} />;
      default:
        // Fallback p/ bloqueio caso alguém altere state manualmente
        return userRole === 'admin' ? <Dashboard /> : <AgendaDia onMarcacaoRapida={setMarcacaoRapidaData} onNavigate={setCurrentPage} />;
    }
  }

  return (
    <Layout 
      currentPage={currentPage}
      userRole={userRole}
      onLogout={handleLogout}
      onNavigate={(page) => {
        setCurrentPage(page);
        // Limpar dados de marcação rápida se navegar para fora da marcação
        if (page !== 'marcacao') {
          setMarcacaoRapidaData(null);
        }
      }}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
