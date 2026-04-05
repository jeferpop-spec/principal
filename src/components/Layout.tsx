import { ReactNode } from 'react';
import { LayoutDashboard, FileText, Calendar, CalendarDays, ClipboardList, ListChecks } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario';
  onNavigate: (page: 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario') => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'codigos' as const, label: 'Códigos', icon: FileText },
    { id: 'vagas' as const, label: 'Vagas', icon: CalendarDays },
    { id: 'marcacao' as const, label: 'Marcação', icon: ClipboardList },
    { id: 'marcacoes' as const, label: 'Marcações', icon: ListChecks },
    { id: 'calendario' as const, label: 'Calendário', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-r md:border-b-0 border-gray-200 md:fixed md:h-full md:overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Sistema de Vagas
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de Atendimentos Médicos</p>
        </div>

        <nav className="p-4 space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-shrink-0 md:flex-shrink flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap md:whitespace-normal ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm md:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
