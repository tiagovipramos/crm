'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail } from 'lucide-react';
import { useProtecarStore } from '@/store/useProtecarStore';

export default function LoginPage() {
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login, isAuthenticated } = useProtecarStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/crm');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const sucesso = await login(email, senha);
      
      if (sucesso) {
        router.push('/crm');
      }
    } catch (error: any) {
      // Exibir a mensagem de erro do backend
      setErro(error.message || 'Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const preencherDemo = (consultorEmail: string) => {
    setEmail(consultorEmail);
    setSenha('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E54] to-[#128C7E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <Shield className="w-12 h-12 text-[#128C7E]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VIP CRM</h1>
          <p className="text-green-100">Sistema de Gestão de Vendas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Bem-vindo de volta
          </h2>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#128C7E] focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#128C7E] focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Contas de Demonstração */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">
              Contas de demonstração:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => preencherDemo('carlos@protecar.com')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition"
              >
                <div className="font-medium text-gray-800">Carlos Silva</div>
                <div className="text-gray-500">carlos@protecar.com</div>
              </button>
              <button
                type="button"
                onClick={() => preencherDemo('ana@protecar.com')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition"
              >
                <div className="font-medium text-gray-800">Ana Paula</div>
                <div className="text-gray-500">ana@protecar.com</div>
              </button>
              <button
                type="button"
                onClick={() => preencherDemo('roberto@protecar.com')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition"
              >
                <div className="font-medium text-gray-800">Roberto Lima</div>
                <div className="text-gray-500">roberto@protecar.com</div>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Senha para todas as contas: <span className="font-mono font-bold">123456</span>
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-6 text-white text-sm">
          <p>© 2025 VIP CRM. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
