'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  duracao?: string;
  remetente: 'consultor' | 'lead';
}

export default function AudioPlayer({ audioUrl, duracao, remetente }: AudioPlayerProps) {
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracaoTotal, setDuracaoTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log('🎵 AudioPlayer montado:', { audioUrl, duracao, remetente });
    
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ Elemento audio não encontrado!');
      return;
    }

    const handleLoadedMetadata = () => {
      console.log('✅ Metadados do áudio carregados:', audio.duration);
      setDuracaoTotal(audio.duration);
      setErro(null); // Limpar erro se carregar com sucesso
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement.error?.code;
      const errorMessages: { [key: number]: string } = {
        1: 'Carregamento do áudio foi abortado',
        2: 'Erro de rede ao carregar o áudio',
        3: 'Erro ao decodificar o áudio',
        4: 'Formato de áudio não suportado'
      };
      
      const errorMessage = errorCode ? errorMessages[errorCode] || 'Erro desconhecido' : 'Erro ao carregar áudio';
      
      console.error('❌ Erro ao carregar áudio:', errorMessage);
      console.error('URL do áudio:', audioUrl);
      console.error('Código do erro:', errorCode);
      console.error('Detalhes:', audio.error);
      
      setErro(errorMessage);
    };

    const handleCanPlay = () => {
      console.log('✅ Áudio pronto para reproduzir');
      setErro(null); // Limpar erro se carregar com sucesso
    };

    const handleTimeUpdate = () => {
      setTempoAtual(audio.currentTime);
      // Garantir que não temos NaN
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        const novoProgresso = (audio.currentTime / audio.duration) * 100;
        setProgresso(isNaN(novoProgresso) ? 0 : novoProgresso);
      }
    };

    const handleEnded = () => {
      setTocando(false);
      setProgresso(0);
      setTempoAtual(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Tentar carregar o áudio
    console.log('🔄 Tentando carregar áudio de:', audioUrl);
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (tocando) {
      audio.pause();
    } else {
      audio.play();
    }
    setTocando(!tocando);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration)) return;

    const valorProgresso = parseFloat(e.target.value);
    if (isNaN(valorProgresso)) return;

    const novoTempo = (valorProgresso / 100) * audio.duration;
    audio.currentTime = novoTempo;
    setProgresso(valorProgresso);
  };

  const formatarTempo = (segundos: number) => {
    if (isNaN(segundos)) return '0:00';
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg min-w-[280px] max-w-sm
      ${remetente === 'consultor' ? 'bg-[#D9FDD3]' : 'bg-white'}
    `}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {erro && (
        <div className="text-xs text-red-600 mt-1">
          {erro} - URL: {audioUrl}
        </div>
      )}
      
      <button
        onClick={togglePlay}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition
          ${remetente === 'consultor' 
            ? 'bg-[#128C7E] hover:bg-[#075E54]' 
            : 'bg-[#128C7E] hover:bg-[#075E54]'}
        `}
      >
        {tocando ? (
          <Pause className="w-5 h-5 text-white" />
        ) : (
          <Play className="w-5 h-5 text-white ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {tocando ? formatarTempo(tempoAtual) : (duracao || formatarTempo(duracaoTotal))}
          </span>
        </div>
        
          <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progresso) ? 0 : progresso}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[#128C7E]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#128C7E]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #128C7E ${isNaN(progresso) ? 0 : progresso}%, #d1d5db ${isNaN(progresso) ? 0 : progresso}%)`
          }}
        />
      </div>
    </div>
  );
}
