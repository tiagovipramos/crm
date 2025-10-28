'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Trash, Send } from 'lucide-react';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, duracao: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onSendAudio, onCancel }: AudioRecorderProps) {
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const iniciadoRef = useRef(false);

  useEffect(() => {
    // Proteção contra React Strict Mode
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;
    
    iniciarGravacao();
    
    return () => {
      // Limpar recursos ao desmontar
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setGravando(true);

      // Iniciar contador
      intervaloRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      onCancel();
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setGravando(false);
      
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    }
  };

  const cancelarGravacao = () => {
    if (gravando) {
      pararGravacao();
    }
    onCancel();
  };

  const enviarAudio = () => {
    if (audioBlob) {
      onSendAudio(audioBlob, tempoGravacao);
    }
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-white rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {gravando ? (
            <>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 font-medium">{formatarTempo(tempoGravacao)}</span>
              <span className="text-gray-500 text-sm ml-2">Gravando áudio...</span>
            </>
          ) : audioBlob ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-500 font-medium">{formatarTempo(tempoGravacao)}</span>
              <span className="text-gray-500 text-sm ml-2">Áudio gravado</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">Preparando gravação...</span>
          )}
        </div>
        
        {gravando && (
          <button
            onClick={pararGravacao}
            className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition"
            title="Parar gravação"
          >
            <StopCircle className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <button
        onClick={cancelarGravacao}
        className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition flex-shrink-0"
        title="Cancelar"
      >
        <Trash className="w-5 h-5 text-white" />
      </button>

      {!gravando && audioBlob && (
        <button
          onClick={enviarAudio}
          className="p-3 bg-[#128C7E] hover:bg-[#075E54] rounded-full transition flex-shrink-0"
          title="Enviar áudio"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
