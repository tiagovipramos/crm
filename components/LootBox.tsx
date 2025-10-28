'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Share2, Instagram, Facebook, MessageCircle, Sparkles, Lock, Unlock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LootBoxProps {
  leadsParaProximaCaixa: number;
  leadsNecessarios: number;
  podeAbrir: boolean;
  onAbrir: () => Promise<{
    premio: {
      id?: number;
      valor: number;
      tipo: string;
      emoji: string;
      cor: string;
    };
  }>;
  onCompartilhar: (lootboxId: number) => Promise<void>;
  onClose: () => void;
}

export default function LootBox({
  leadsParaProximaCaixa,
  leadsNecessarios,
  podeAbrir,
  onAbrir,
  onCompartilhar,
  onClose,
}: LootBoxProps) {
  const [abrindo, setAbrindo] = useState(false);
  const [premio, setPremio] = useState<any>(null);
  const [mostrarPremio, setMostrarPremio] = useState(false);
  const [lootboxId, setLootboxId] = useState<number | null>(null);

  const progresso = (leadsParaProximaCaixa / leadsNecessarios) * 100;

  const handleAbrir = async () => {
    if (!podeAbrir || abrindo) return;

    setAbrindo(true);

    // Som de abertura (usando AudioContext)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }

    // Aguardar animação
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const resultado = await onAbrir();
      setPremio(resultado.premio);
      setLootboxId(resultado.premio.id || Date.now());

      // Confetti épico baseado no tipo de prêmio
      const confettiConfig = getConfettiConfig(resultado.premio.tipo);
      confetti(confettiConfig);

      // Mostrar prêmio
      setMostrarPremio(true);
      setAbrindo(false);
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      setAbrindo(false);
      alert('Erro ao abrir caixa. Tente novamente.');
    }
  };

  const getConfettiConfig = (tipo: string) => {
    const configs: any = {
      comum: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      },
      raro: {
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
        startVelocity: 45
      },
      epico: {
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
        startVelocity: 55,
        gravity: 0.8
      },
      lendario: {
        particleCount: 300,
        spread: 160,
        origin: { y: 0.4 },
        colors: ['#EF4444', '#F87171', '#FCA5A5', '#FFD700'],
        startVelocity: 65,
        gravity: 0.6,
        scalar: 1.5
      }
    };

    return configs[tipo] || configs.comum;
  };

  const compartilhar = async (plataforma: string) => {
    if (!premio || !lootboxId) return;

    const mensagem = `🎁 Acabei de ganhar R$ ${premio.valor.toFixed(2)} na Caixa Misteriosa ${premio.emoji}! Indique e ganhe prêmios também! 💰✨`;

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
      instagram: 'instagram://story-camera',
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(mensagem)}`,
      tiktok: 'https://www.tiktok.com/upload'
    };

    try {
      await onCompartilhar(lootboxId);
      
      if (urls[plataforma]) {
        window.open(urls[plataforma], '_blank');
      }

      // Copiar para área de transferência também
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(mensagem);
        alert('✅ Mensagem copiada! Cole nas suas redes sociais! 📱');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center animate-fadeIn p-4">
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <h2 className="text-3xl font-black text-white mb-2">
            🎁 Caixa Misteriosa
          </h2>
          <p className="text-purple-200 text-sm">
            A cada 10 indicações = 1 prêmio surpresa!
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {!mostrarPremio ? (
            <>
              {/* Progresso */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">Progresso</span>
                  <span className="text-purple-300 font-bold text-sm">
                    {leadsParaProximaCaixa}/{leadsNecessarios}
                  </span>
                </div>
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 transition-all duration-500 ease-out relative"
                    style={{ width: `${Math.min(progresso, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Caixa */}
              <div className="relative mb-6 flex items-center justify-center py-8">
                {abrindo ? (
                  <div className="relative">
                    <div className="w-40 h-40 animate-bounce">
                      <Gift className="w-full h-full text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
                    </div>
                    <div className="absolute inset-0 animate-spin-slow">
                      <Sparkles className="w-full h-full text-yellow-300 opacity-50" />
                    </div>
                  </div>
                ) : (
                  <div className={`relative ${podeAbrir ? 'animate-float' : ''}`}>
                    <div className="w-40 h-40">
                      <Gift
                        className={`w-full h-full transition-all duration-300 ${
                          podeAbrir
                            ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-110'
                            : 'text-gray-500'
                        }`}
                      />
                    </div>
                    {podeAbrir && (
                      <div className="absolute -inset-4 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
                    )}
                    
                    {/* Cadeado - Centralizado */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      {podeAbrir ? (
                        <div className="relative">
                          <Unlock className="w-16 h-16 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.9)] animate-bounce" />
                          <div className="absolute inset-0 bg-green-400/40 rounded-full blur-xl animate-pulse"></div>
                        </div>
                      ) : (
                        <Lock className="w-16 h-16 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Abrir */}
              <button
                onClick={handleAbrir}
                disabled={!podeAbrir || abrindo}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${
                  podeAbrir && !abrindo
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 hover:scale-105 active:scale-95 animate-pulse-slow'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {abrindo ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 animate-spin" />
                    Abrindo...
                  </span>
                ) : podeAbrir ? (
                  '🎁 ABRIR CAIXA AGORA! 🎁'
                ) : (
                  `Faltam ${leadsNecessarios - leadsParaProximaCaixa} indicações`
                )}
              </button>
            </>
          ) : (
            <>
              {/* Mostrar Prêmio */}
              <div className="text-center mb-6 animate-scaleIn">
                <div className="mb-4">
                  <div
                    className="text-8xl mb-4 animate-bounce inline-block"
                    style={{ filter: `drop-shadow(0 0 20px ${premio.cor})` }}
                  >
                    {premio.emoji}
                  </div>
                </div>
                <h3 className="text-white font-black text-2xl mb-2">
                  Parabéns! 🎉
                </h3>
                <p className="text-purple-200 mb-4">Você ganhou:</p>
                <div
                  className="text-6xl font-black mb-2 animate-pulse"
                  style={{ color: premio.cor }}
                >
                  R$ {premio.valor.toFixed(2)}
                </div>
                <div className="inline-block px-4 py-2 bg-white/10 rounded-full">
                  <span className="text-white font-bold text-sm uppercase">
                    {premio.tipo === 'lendario' ? '⭐ LENDÁRIO ⭐' :
                     premio.tipo === 'epico' ? '🔥 ÉPICO 🔥' :
                     premio.tipo === 'raro' ? '💎 RARO 💎' : '✨ COMUM ✨'}
                  </span>
                </div>
              </div>

              {/* Botões de Compartilhamento */}
              <div className="space-y-3">
                <p className="text-white font-bold text-center mb-4 flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Compartilhe e inspire outros!
                </p>

                <button
                  onClick={() => compartilhar('whatsapp')}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="w-6 h-6" />
                  WhatsApp
                </button>

                <button
                  onClick={() => compartilhar('instagram')}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <Instagram className="w-6 h-6" />
                  Instagram Stories
                </button>

                <button
                  onClick={() => compartilhar('facebook')}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <Facebook className="w-6 h-6" />
                  Facebook
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all mt-4"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px);
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
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
