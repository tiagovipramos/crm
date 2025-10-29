import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useIndicadorStore } from '@/store/useIndicadorStore';

export function useIndicadorSocket() {
  const indicador = useIndicadorStore(state => state.indicador);
  const token = useIndicadorStore(state => state.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!indicador || !token) {
      // Desconectar socket se não houver indicador
      if (socketRef.current) {
        console.log('🔌 Desconectando socket (sem indicador/token)');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Conectar ao Socket.IO
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    console.log('🔌 Tentando conectar ao Socket.IO:', WS_URL);
    console.log('🔑 Token:', token ? 'presente' : 'ausente');
    console.log('💰 Indicador ID:', indicador.id);
    
    const socket = io(WS_URL, {
      transports: ['polling', 'websocket'], // Tentar polling primeiro
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      upgrade: true
    });

    socketRef.current = socket;

    // Join na sala do indicador
    socket.on('connect', () => {
      console.log('');
      console.log('================================================');
      console.log('✅ Socket.IO Indicador CONECTADO!');
      console.log('================================================');
      console.log('🆔 ID do Socket:', socket.id);
      console.log('💰 ID do Indicador:', indicador.id);
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('================================================');
      console.log('');
      
      socket.emit('join_indicador', indicador.id);
      console.log('📡 Evento join_indicador emitido para o servidor');
    });

    // Reconexão
    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconectado após', attemptNumber, 'tentativas');
      socket.emit('join_indicador', indicador.id);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Tentando reconectar... Tentativa:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Erro ao reconectar:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar após todas as tentativas');
    });

    // Escutar atualização de saldo (quando lead muda de status)
    socket.on('saldo_atualizado', async (data: any) => {
      console.log('💰 Saldo atualizado via Socket.IO:', data);
      console.log('📊 Dados recebidos:', JSON.stringify(data, null, 2));
      
      // Recarregar dashboard, indicações (sem filtro para pegar todas) e lootbox
      const store = useIndicadorStore.getState();
      console.log('🔄 Iniciando atualização dos dados...');
      
      await Promise.all([
        store.fetchDashboard(),
        store.fetchIndicacoes('todas'), // Buscar todas para garantir atualização
        store.fetchLootBoxStatus()
      ]);
      
      console.log('✅ Todos os dados atualizados em tempo real!');
    });

    // Escutar quando uma indicação muda de status
    socket.on('indicacao_atualizada', async (data: any) => {
      console.log('📊 Indicação atualizada via Socket.IO:', data);
      console.log('📊 Dados recebidos:', JSON.stringify(data, null, 2));
      
      // Recarregar dashboard e indicações
      const store = useIndicadorStore.getState();
      console.log('🔄 Iniciando atualização das indicações...');
      
      await Promise.all([
        store.fetchDashboard(),
        store.fetchIndicacoes('todas') // Buscar todas para garantir atualização
      ]);
      
      console.log('✅ Indicações atualizadas em tempo real!');
    });

    // Escutar quando lootbox está disponível
    socket.on('lootbox_disponivel', async (data: any) => {
      console.log('🎁 Lootbox disponível via Socket.IO:', data);
      
      // Recarregar status da lootbox
      const store = useIndicadorStore.getState();
      await store.fetchLootBoxStatus();
      
      console.log('✅ Status da lootbox atualizado!');
    });

    // Tratar erros
    socket.on('error', (error: any) => {
      console.error('❌ Erro no Socket.IO Indicador:', error);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.IO Indicador desconectado');
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [indicador?.id, token]);

  return socketRef.current;
}
