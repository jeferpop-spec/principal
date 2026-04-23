import { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: (role: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usando novo sufixo para criar contas novas e auto-confirmadas
      const email = `${username.trim().toLowerCase()}@medico.com`;
      
      // Supabase exige 6 caracteres. Pad silencioso para viabilizar senhas curtas sugeridas.
      const securePassword = password.padEnd(6, '0');

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: securePassword,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Usuário ou senha incorretos.');
        }
        throw authError;
      }

      if (data.session) {
        const profile = await getCurrentUserProfile();
        if (!profile || !profile.ativo) {
          await supabase.auth.signOut();
          throw new Error('Usuário desativado ou sem permissão.');
        }
        
        onLoginSuccess(profile.role);
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <h2 className="mt-6 text-center text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
          SAGI-UDI
          <span className="block text-2xl mt-2 text-[#909194] tracking-tight">
            (Sistema de Agendamento de Imagem)
          </span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesse o Sistema de Gestão de Agendas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50 text-gray-900 border"
                  placeholder="Seu nome de usuário"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50 text-gray-900 border"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
