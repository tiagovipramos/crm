import { useState, useCallback, useEffect, useRef } from 'react';

interface CelebrationData {
  amount: number;
  message: string;
}

export function useCelebration() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar áudio
  useEffect(() => {
    // Criar o áudio da caixa registradora
    audioRef.current = new Audio();
    // URL do som de caixa registradora (será criado em base64)
    audioRef.current.src = createCashRegisterSound();
    audioRef.current.volume = 0.5;

    // Carregar preferência de som do localStorage
    const savedPreference = localStorage.getItem('celebration_sound_enabled');
    if (savedPreference !== null) {
      setSoundEnabled(JSON.parse(savedPreference));
    }
  }, []);

  // Salvar preferência de som
  useEffect(() => {
    localStorage.setItem('celebration_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const celebrate = useCallback((amount: number, message: string) => {
    setCelebrationData({ amount, message });
    setShowCelebration(true);

    // Tocar som se habilitado
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Não foi possível tocar o som:', err);
      });
    }

    // Mostrar notificação do navegador se permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Você ganhou comissão!', {
        body: `+R$ ${amount.toFixed(2)} - ${message}`,
        icon: '/icon-192.png', // Se você tiver um ícone
        badge: '/icon-96.png',
        tag: 'comissao',
        requireInteraction: false,
      });
    }
  }, [soundEnabled]);

  const hideCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    showCelebration,
    celebrationData,
    celebrate,
    hideCelebration,
    soundEnabled,
    toggleSound,
    requestNotificationPermission,
  };
}

// Função para criar o som de caixa registradora sintetizado
function createCashRegisterSound(): string {
  // AudioContext para gerar som
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.6; // 600ms
  const numSamples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  // Gerar som de "cha-ching" (caixa registradora)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Múltiplas frequências para criar o som característico
    const freq1 = 800 * Math.exp(-t * 5); // Componente descendente
    const freq2 = 1200 * Math.exp(-t * 3);
    const freq3 = 1600 * Math.exp(-t * 7);
    
    // Envelope de amplitude (ataque rápido, decay gradual)
    const envelope = Math.exp(-t * 4);
    
    // Combinar as ondas
    channel[i] = (
      Math.sin(2 * Math.PI * freq1 * t) * 0.3 +
      Math.sin(2 * Math.PI * freq2 * t) * 0.25 +
      Math.sin(2 * Math.PI * freq3 * t) * 0.2 +
      (Math.random() * 0.1 - 0.05) // Ruído para realismo
    ) * envelope;
  }

  // Converter buffer para WAV base64
  return bufferToWavDataUrl(buffer);
}

// Converter AudioBuffer para WAV data URL
function bufferToWavDataUrl(buffer: AudioBuffer): string {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Escrever dados de áudio
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  // Converter para base64
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
