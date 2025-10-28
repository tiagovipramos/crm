'use client';

import { useEffect, useRef, useState } from 'react';

interface NotificacaoConfig {
  titulo: string;
  mensagem: string;
  icone?: string;
  som?: boolean;
}

export function useNotificacoes() {
  const [permissaoNotificacao, setPermissaoNotificacao] = useState<NotificationPermission>('default');
  
  // Carregar preferência salva do localStorage ao inicializar
  const [somAtivado, setSomAtivado] = useState(() => {
    if (typeof window !== 'undefined') {
      const somSalvo = localStorage.getItem('notificacao_som');
      return somSalvo !== null ? somSalvo === 'true' : true;
    }
    return true;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Verifica permissão atual
    if ('Notification' in window) {
      setPermissaoNotificacao(Notification.permission);
    }

    // Cria elemento de áudio para som de notificação
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      // Som de notificação (usando data URI para som simples)
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTYIHGqp7OaeRAoCUKHh8bxoHwU7kdny1H4sBSV3yO+qZSAFN5PY8M+AMAk1jcr0xH4yBzOR1/LLeC0GKHrK8NSHOwk3jcn0xX8yCDKO1PLLei8HJ3rJ8NiKOgg3jsj0yn0zCDKP1vHKfTEHJnzI8NSJPAg4jsj0y380CDGR1fLKeDAHJ3zI8NmLOgg5jsj0zH81CTGR1fHLfTEHKH3H8NmOPQg5jsf1zX40CTCTiPHLfTEHKH/H8NqPPgg5jcj1zn81CTGR1fHMfTEHKn/H8NuQPgg5jcj2zn81CTGS1PHMfjAHKYHG8NyQPwg5jcj3zn41CDGS1PHNfzAHKYHG8N2RPgg5jcn4zn41CTGS1PHOfjAHKYHH8N2SPgg5jMn5zn41CTGS1PDOfjAHKYHH8N6TPgg5jMn5z342CTGS1PDPfjAHKYHH8N6TPwg5jMn6z342CTGS1PDPfjAHKYHH8N+UPwg5jMn6z382CTGS1PDQfjAHKYHH8OCUPwg5jMn60H42CTGS1PDQfjEHKYDI8OCVPwg5jMr60H42CTGS1PDRfjEHKYDI8OGVPwg5jMr70H42CTGS1PHRfjEHKYDI8OGWPwg5i8r70X42CTGS1PHSfjEHKYDI8OKWPwg5i8r70n42CTGR1PHSfjEHKX/J8OKXPwg5i8r70n42CTFSjPHTfjEHKX/J8OOXPwg5i8r70382CTFR1PHUfjEHKX/J8OOYPwg5i8r80X82CTFRjPHUfjEHKX/J8OSYPwg5isr80n82CTFR1PHVfjEHKX/J8OSZPwg5isr81H82CTFRjPHVfjEHKX/J8OWZPwg5icr81X82CTFR1PHWfjEHKX/J8OWaPwg5icr81382CTFRjPHWfjEHKX/J8OaaPwg5icr82H82CTFRjPHXfjEHKX/J8OeaPwg5icv82H82CTFR1PHXfjEHKX/K8OebPwg5icv82X82CTFR1PHYfjAHKYDK8OibPwg5icv82n82CTFR1PHYfjAHKYDK8OmcPwg5icv82382CTFR1PHZfjAHKYDK8OqcPwg5icv93H82CTFR1PHZfjAHKYDK8OudPwg5icv93H82CTFR1PHafjAHKYDK8OudPwg5icv93n82CTFR1PHafjAHKYDK8OyePwg5icv93n82CTFR1PHbfjAHKYDK8OyePwg5icv94H82CTFRjPHcfjAHKYDK8O2fPwg5icv94H82CTFR1PHcfjAHKYDK8O2fPwg5icv94H82CTFR1PHdfjAHKYDK8O6gPwg5icv94H82CTFR1PHdfjAHKYDK8O6gPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFR1PHdfjAHKYDK8PCgPwg5icv94H82CTFRjPHcfjAHKYDK8O+hPwg5icv94H82CTFRjPHcfjAHKYDK8O+hPwg5icv94H82CTFRjPHcfjAHKYDK8O+hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg5icv94H82CTFR1PHcfjAHKYDK8O6hPwg=';
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Salva preferência de som sempre que mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificacao_som', somAtivado.toString());
    }
  }, [somAtivado]);

  const solicitarPermissao = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setPermissaoNotificacao(permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  };

  const tocarSom = () => {
    if (somAtivado && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Erro ao tocar som:', err));
    }
  };

  const mostrarNotificacao = ({ titulo, mensagem, icone, som = true }: NotificacaoConfig) => {
    // Verifica se está em uma aba ativa
    if (document.hidden && permissaoNotificacao === 'granted') {
      const notification = new Notification(titulo, {
        body: mensagem,
        icon: icone || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'protecar-crm',
        requireInteraction: false,
        silent: !som
      });

      // Toca som se configurado
      if (som) {
        tocarSom();
      }

      // Fecha a notificação após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Foca na janela quando clicar na notificação
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } else if (som && !document.hidden) {
      // Se está na aba ativa, só toca o som
      tocarSom();
    }

    return null;
  };

  return {
    permissaoNotificacao,
    solicitarPermissao,
    mostrarNotificacao,
    somAtivado,
    setSomAtivado,
    tocarSom
  };
}
