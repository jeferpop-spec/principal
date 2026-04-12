import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Codigos } from './pages/Codigos';
import { Vagas } from './pages/Vagas';
import { Marcacao } from './pages/Marcacao';
import { Marcacoes } from './pages/Marcacoes';
import { Calendario } from './pages/Calendario';
import { AgendaDia } from './pages/AgendaDia';

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
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [marcacaoRapidaData, setMarcacaoRapidaData] = useState<MarcacaoRapidaData | null>(null);

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
        return <Dashboard />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={(page) => {
      setCurrentPage(page);
      // Limpar dados de marcação rápida se navegar para fora da marcação
      if (page !== 'marcacao') {
        setMarcacaoRapidaData(null);
      }
    }}>
      {renderPage()}
    </Layout>
  );
}

export default App;
