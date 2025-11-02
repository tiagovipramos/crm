'use client';

import { Gift, Sparkles, Lock, Unlock, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LootBoxProgressDualProps {
  // Caixa de Indicações
  leadsParaProximaCaixa: number;
  leadsNecessarios: number;
  podeAbrirIndicacoes: boolean;
  onAbrirIndicacoes: () => void;
  
  // Caixa de Vendas
  vendasParaProximaCaixa: number;
  vendasNecessarias: number;
  podeAbrirVendas: boolean;
  onAbrirVendas: () => void;
}

export default function LootBoxProgressDual({
  leadsParaProximaCaixa,
  leadsNecessarios,
  podeAbrirIndicacoes,
  onAbrirIndicacoes,
  vendasParaProximaCaixa,
  vendasNecessarias,
  podeAbrirVendas,
  onAbrirVendas
}: LootBoxProgressDualProps) {
  const progressoIndicacoes = (leadsParaProximaCaixa / leadsNecessarios) * 100;
  const progressoVendas = (vendasParaProximaCaixa / vendasNecessarias) * 100;
  const faltamIndicacoes = leadsNecessarios - leadsParaProximaCaixa;
  const faltamVendas = vendasNecessarias - vendasParaProximaCaixa;

  const getMensagemIndicacoes = () => {
    if (podeAbrirIndicacoes) return '🎉 PRONTA!';
    if (leadsParaProximaCaixa >= 7) return `Faltam ${faltamIndicacoes}!`;
    if (leadsParaProximaCaixa >= 5) return 'No caminho!';
    return `Faltam ${faltamIndicacoes}`;
  };

  const getMensagemVendas = () => {
    if (podeAbrirVendas) return '🎉 PRONTA!';
    if (vendasParaProximaCaixa >= 3) return `Faltam ${faltamVendas}!`;
    return `Faltam ${faltamVendas}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* CAIXA DE INDICAÇÕES */}
      <button
        onClick={podeAbrirIndicacoes ? onAbrirIndicacoes : undefined}
        disabled={!podeAbrirIndicacoes}
        className={`relative rounded-3xl shadow-2xl p-4 overflow-hidden transition-all ${
          podeAbrirIndicacoes ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
        }`}
        style={{
          background: podeAbrirIndicacoes
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)'
            : 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #f97316 100%)'
        }}
      >
        {/* Efeito shimmer */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>

        {/* Estrelinhas */}
        <div className="absolute top-2 right-2 text-yellow-300 animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-white font-black text-sm flex items-center gap-1 justify-center">
              <Gift className={`w-4 h-4 ${podeAbrirIndicacoes ? 'animate-bounce' : ''}`} />
              Caixa Misteriosa
            </h3>
          </div>

          {/* Caixa visual */}
          <div className="flex justify-center mb-3">
            <div className={`relative ${podeAbrirIndicacoes ? 'scale-110' : 'scale-100'} transition-all duration-500`}>
              <div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${
                  podeAbrirIndicacoes 
                    ? 'bg-gradient-to-br from-yellow-400 to-red-500 shadow-xl shadow-orange-500/50 animate-pulse' 
                    : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                {podeAbrirIndicacoes && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-yellow-300 animate-ping opacity-75" />
                )}
                <Gift className={`w-10 h-10 text-white ${podeAbrirIndicacoes ? 'animate-bounce' : ''}`} />
              </div>
              
              {/* Badge cadeado */}
              <div className={`absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-xl ${
                podeAbrirIndicacoes 
                  ? 'bg-green-500 animate-bounce' 
                  : 'bg-white/90'
              }`}>
                {podeAbrirIndicacoes ? (
                  <Unlock className="w-5 h-5 text-white" />
                ) : (
                  <Lock className="w-5 h-5 text-purple-600" />
                )}
              </div>
            </div>
          </div>

          {/* Texto contador + label */}
          <p className="text-white/90 font-black text-lg text-center mb-1">
            {leadsParaProximaCaixa}/{leadsNecessarios} <span className="text-sm font-black">Indicações</span>
          </p>
          {podeAbrirIndicacoes && (
            <p className="text-yellow-300 font-black text-sm text-center mb-3 animate-pulse">
              🎉 PRONTA!
            </p>
          )}

          {/* Barra de progresso */}
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                podeAbrirIndicacoes 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(progressoIndicacoes, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </button>

      {/* CAIXA DE VENDAS */}
      <button
        onClick={podeAbrirVendas ? onAbrirVendas : undefined}
        disabled={!podeAbrirVendas}
        className={`relative rounded-3xl shadow-2xl p-4 overflow-hidden transition-all ${
          podeAbrirVendas ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
        }`}
        style={{
          background: podeAbrirVendas
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%)'
            : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)'
        }}
      >
        {/* Efeito shimmer */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>

        {/* Estrelinhas */}
        <div className="absolute top-2 right-2 text-yellow-300 animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-white font-black text-sm flex items-center gap-1 justify-center">
              <Gift className={`w-4 h-4 ${podeAbrirVendas ? 'animate-bounce' : ''}`} />
              Caixa Misteriosa
            </h3>
          </div>

          {/* Caixa visual */}
          <div className="flex justify-center mb-3">
            <div className={`relative ${podeAbrirVendas ? 'scale-110' : 'scale-100'} transition-all duration-500`}>
              <div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center relative ${
                  podeAbrirVendas 
                    ? 'bg-gradient-to-br from-yellow-400 to-red-500 shadow-xl shadow-orange-500/50 animate-pulse' 
                    : 'bg-white/20 backdrop-blur-sm'
                }`}
              >
                {podeAbrirVendas && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-yellow-300 animate-ping opacity-75" />
                )}
                <Gift className={`w-10 h-10 text-white ${podeAbrirVendas ? 'animate-bounce' : ''}`} />
              </div>
              
              {/* Badge cadeado */}
              <div className={`absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-xl ${
                podeAbrirVendas 
                  ? 'bg-green-500 animate-bounce' 
                  : 'bg-white/90'
              }`}>
                {podeAbrirVendas ? (
                  <Unlock className="w-5 h-5 text-white" />
                ) : (
                  <Lock className="w-5 h-5 text-cyan-600" />
                )}
              </div>
            </div>
          </div>

          {/* Texto contador + label */}
          <p className="text-white/90 font-black text-lg text-center mb-1">
            {vendasParaProximaCaixa}/{vendasNecessarias} <span className="text-sm font-black">Vendas</span>
          </p>
          {podeAbrirVendas && (
            <p className="text-yellow-300 font-black text-sm text-center mb-3 animate-pulse">
              🎉 PRONTA!
            </p>
          )}

          {/* Barra de progresso */}
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                podeAbrirVendas 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(progressoVendas, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </button>

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
