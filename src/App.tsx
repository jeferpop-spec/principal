import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Codigos } from './pages/Codigos';
import { Vagas } from './pages/Vagas';
import { Marcacao } from './pages/Marcacao';
import { Marcacoes } from './pages/Marcacoes';
import { Calendario } from './pages/Calendario';

type Page = 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'codigos':
        return <Codigos />;
      case 'vagas':
        return <Vagas />;
      case 'marcacao':
        return <Marcacao />;
      case 'marcacoes':
        return <Marcacoes />;
      case 'calendario':
        return <Calendario />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
