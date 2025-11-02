'use client';

import { Gift, Sparkles, Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LootBoxProgressProps {
  leadsParaProximaCaixa: number;
  leadsNecessarios: number;
  podeAbrir: boolean;
  onAbrir: () => void;
}

export default function LootBoxProgress({
  leadsParaProximaCaixa,
  leadsNecessarios,
  podeAbrir,
  onAbrir
}: LootBoxProgressProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const progresso = (leadsParaProximaCaixa / leadsNecessarios) * 100;
  const faltam = leadsNecessarios - leadsParaProximaCaixa;

  useEffect(() => {
    if (podeAbrir) {
      setPulseAnimation(true);
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [podeAbrir]);

  const getMensagemMotivacional = () => {
    if (podeAbrir) {
      return '🎉 CAIXA PRONTA! Toque para abrir!';
    }
    if (leadsParaProximaCaixa >= 7) {
      return `Quase lá! Faltam apenas ${faltam} ${faltam === 1 ? 'indicação' : 'indicações'}!`;
    }
    if (leadsParaProximaCaixa >= 5) {
      return `Você está no meio do caminho! Continue assim!`;
    }
    return `Continue indicando! Faltam ${faltam} para o prêmio!`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl shadow-2xl p-6 mb-6 relative overflow-hidden">
      {/* Efeito de brilho animado de fundo */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
      </div>

      {/* Estrelinhas decorativas */}
      <div className="absolute top-4 right-4 text-yellow-300 animate-bounce">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="absolute bottom-4 left-4 text-yellow-200 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute top-1/2 left-8 text-yellow-300 animate-ping opacity-75">
        <div className="w-2 h-2 bg-yellow-300 rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black text-xl flex items-center gap-2">
            <Gift className={`w-6 h-6 ${podeAbrir ? 'animate-bounce' : ''}`} />
            Caixa Misteriosa
          </h3>
          {podeAbrir ? (
            <Unlock className="w-6 h-6 text-yellow-300 animate-pulse" />
          ) : (
            <Lock className="w-6 h-6 text-white/50" />
          )}
        </div>

        {/* Contador Principal */}
        <div className="flex items-center justify-center mb-4">
          <div 
            className={`relative transition-all duration-500 ${
              podeAbrir ? 'scale-110' : 'scale-100'
            }`}
          >
            {/* Caixa misteriosa animada */}
            <div 
              className={`w-32 h-32 rounded-3xl flex items-center justify-center relative ${
                podeAbrir 
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl shadow-orange-500/50 animate-pulse' 
                  : 'bg-white/20 backdrop-blur-sm'
              }`}
            >
              {podeAbrir && (
                <div className="absolute inset-0 rounded-3xl border-4 border-yellow-300 animate-ping opacity-75" />
              )}
              <Gift className={`w-16 h-16 text-white ${podeAbrir ? 'animate-bounce' : ''}`} />
            </div>

            {/* Badge de contador */}
            <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-2xl ${
              podeAbrir 
                ? 'bg-green-500 text-white animate-bounce' 
                : 'bg-white text-purple-600'
            }`}>
              {leadsParaProximaCaixa}
            </div>

            {/* Indicador de "PRONTO" */}
            {podeAbrir && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg animate-bounce whitespace-nowrap">
                ✨ PRONTO!
              </div>
            )}
          </div>
        </div>

        {/* Progresso textual */}
        <div className="text-center mb-4">
          <p className="text-white/90 font-bold text-lg mb-1">
            {leadsParaProximaCaixa} de {leadsNecessarios} indicações
          </p>
          <p className={`text-sm font-semibold ${
            podeAbrir ? 'text-yellow-300 animate-pulse' : 'text-white/70'
          }`}>
            {getMensagemMotivacional()}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm mb-4">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              podeAbrir 
                ? 'bg-gradient-to-r from-green-400 via-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
            }`}
            style={{ width: `${Math.min(progresso, 100)}%` }}
          >
            {/* Efeito de brilho na barra */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Botão de ação */}
        {podeAbrir && (
          <button
            onClick={onAbrir}
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all animate-pulse"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-6 h-6" />
              ABRIR CAIXA AGORA! 🎁
            </div>
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
