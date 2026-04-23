import { ReactNode } from 'react';
import { LayoutDashboard, FileText, Calendar, CalendarDays, ClipboardList, ListChecks, Clock, LogOut } from 'lucide-react';
import { UserRole } from '../lib/auth';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario' | 'agendaDia';
  userRole?: UserRole | null;
  onLogout?: () => void;
  onNavigate: (page: 'dashboard' | 'codigos' | 'vagas' | 'marcacao' | 'marcacoes' | 'calendario' | 'agendaDia') => void;
}

export function Layout({ children, currentPage, userRole, onLogout, onNavigate }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, requiresAdmin: true },
    { id: 'agendaDia' as const, label: 'Agenda do Dia', icon: Clock, requiresAdmin: false },
    { id: 'calendario' as const, label: 'Calendário', icon: Calendar, requiresAdmin: false },
    { id: 'codigos' as const, label: 'Códigos', icon: FileText, requiresAdmin: true },
    { id: 'vagas' as const, label: 'Vagas', icon: CalendarDays, requiresAdmin: true },
    { id: 'marcacao' as const, label: 'Marcação', icon: ClipboardList, requiresAdmin: false },
    { id: 'marcacoes' as const, label: 'Ger. Marcações', icon: ListChecks, requiresAdmin: false },
  ];

  // Filtra itens com base na role
  const visibleItems = menuItems.filter(item => {
    if (item.requiresAdmin && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-b md:border-r md:border-b-0 border-gray-200 md:fixed md:h-full md:flex md:flex-col md:justify-between transition-all overflow-y-auto">
        <div>
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Sistema de Vagas
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestão de Atendimentos</p>
          </div>

          <nav className="p-4 space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex-shrink-0 md:flex-shrink flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap md:whitespace-normal md:w-full select-none ${
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
        </div>

        {onLogout && (
          <div className="p-4 border-t border-gray-200 mt-auto hidden md:block">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-red-600 hover:bg-red-50 select-none"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair do Sistema</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Logout (Aparece embaixo do header no mobile) */}
      {onLogout && (
        <div className="md:hidden flex justify-end px-4 py-2 bg-white border-b border-gray-200">
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 text-sm text-red-600 font-medium active:bg-red-100">
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
