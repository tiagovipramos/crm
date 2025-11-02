'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Sparkles } from 'lucide-react';

interface CelebrationConfettiProps {
  amount: number;
  message?: string;
  onComplete?: () => void;
}

export default function CelebrationConfetti({ amount, message, onComplete }: CelebrationConfettiProps) {
  const [confettiPieces] = useState(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Backdrop pulsante */}
      <div className="absolute inset-0 bg-green-500/20 animate-pulse"></div>

      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-confettiFall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      {/* Valor Principal - Explosão */}
      <div className="relative animate-explosionBounce">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
        
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl shadow-2xl p-8 border-4 border-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-spin-slow">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <p className="text-white font-black text-5xl">
                  +R$ {amount.toFixed(2)}
                </p>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              {message && (
                <p className="text-green-100 font-bold text-lg">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Círculos expansivos */}
        <div className="absolute inset-0 rounded-3xl border-4 border-green-400 animate-ping"></div>
        <div className="absolute inset-0 rounded-3xl border-4 border-yellow-400 animate-ping" style={{ animationDelay: '0.2s' }}></div>
      </div>

      {/* Estrelas orbitando */}
      {[...Array(8)].map((_, i) => (
        <Sparkles
          key={i}
          className="absolute w-8 h-8 text-yellow-400 animate-orbit"
          style={{
            animationDelay: `${i * 0.2}s`,
            left: '50%',
            top: '50%',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes explosionBounce {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          70% {
            transform: scale(0.9) rotate(-5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes orbit {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(150px) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(150px) rotate(-360deg);
          }
        }

        .animate-confettiFall {
          animation: confettiFall linear forwards;
        }

        .animate-explosionBounce {
          animation: explosionBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-orbit {
          animation: orbit 3s linear infinite;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
