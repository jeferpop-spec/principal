import { AlertCircle, Database, ServerCrash } from 'lucide-react';

export function ConnectionError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl w-full border border-red-100">
        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ServerCrash className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-700 text-center">
            Sem Conexão com o Banco de Dados
          </h1>
          <p className="text-red-600 text-center mt-2 max-w-lg">
            Sua aplicação não consegue se comunicar com o Supabase. Os dados não vão carregar enquanto isso não for resolvido.
          </p>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Por que isso está acontecendo?
            </h2>
            <ul className="mt-3 space-y-2 text-gray-600 list-disc list-inside">
              <li>O arquivo <strong>.env</strong> não existe ou está contendo valores falsos ("placeholders").</li>
              <li>O seu Projeto no Supabase foi <strong>pausado por inatividade</strong> (Free Tier).</li>
              <li>Sua rede está bloqueando a comunicação com os servidores do Supabase.</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-blue-500" />
              Como resolver agora (Passo a Passo)
            </h2>
            <ol className="space-y-3 text-gray-600 list-decimal list-inside">
              <li>
                Acesse o painel do seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Supabase</a>.
              </li>
              <li>
                Verifique se o projeto não está marcando como <strong>"Paused"</strong>. Se estiver, clique para restaurar.
              </li>
              <li>
                Vá em <strong>Settings &gt; API</strong>.
              </li>
              <li>
                Abra o arquivo <code>.env</code> na raiz do projeto e cole suas credenciais reais:
                <pre className="mt-2 bg-gray-800 text-green-400 p-3 rounded-md text-sm overflow-x-auto">
{`VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
                </pre>
              </li>
              <li>Pare o terminal (<code>Ctrl+C</code>) e rode <code>npm run dev</code> novamente.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
