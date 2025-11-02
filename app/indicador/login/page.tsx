'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIndicadorStore } from '@/store/useIndicadorStore';
import { UserCircle, Lock, LogIn, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginIndicadorPage() {
  const router = useRouter();
  const { login, isLoading, error, setError } = useIndicadorStore();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, senha);
      router.push('/indicador');
    } catch (error: any) {
      // Erro já está sendo tratado na store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Elementos de fundo animados */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-slideDown">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-2xl mb-6 transform hover:scale-110 transition-transform">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Portal do Indicador
          </h1>
          <p className="text-purple-100 text-lg font-medium">
            Indique e ganhe comissões
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all font-medium"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all font-medium"
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Credenciais de Teste */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <p className="text-xs text-blue-800 font-bold mb-2 flex items-center gap-1">
              🧪 Credenciais de Teste
            </p>
            <div className="space-y-1">
              <p className="text-xs text-blue-700 font-mono">
                <span className="font-bold">Email:</span> joao@indicador.com
              </p>
              <p className="text-xs text-blue-700 font-mono">
                <span className="font-bold">Senha:</span> 123456
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-fadeIn">
          <p className="text-white/80 text-sm font-medium">
            © 2025 VIP CRM - Sistema de Indicações
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
