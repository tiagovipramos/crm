import { create } from 'zustand';

// Mock data inline (para evitar dependência de arquivos JSON)
const usersData: any[] = [];
const leadsData: any[] = [];
const chatsData: any[] = [];
const funisData: any[] = [{
  id: 'funil-1',
  nome: 'Funil de Vendas Principal',
  etapas: [
    { id: 'novo', nome: 'Novo Lead', cor: '#3B82F6', ordem: 1 },
    { id: 'primeiro_contato', nome: 'Primeiro Contato', cor: '#8B5CF6', ordem: 2 },
    { id: 'proposta_enviada', nome: 'Proposta Enviada', cor: '#F59E0B', ordem: 3 },
    { id: 'convertido', nome: 'Convertido', cor: '#10B981', ordem: 4 },
    { id: 'perdido', nome: 'Perdido', cor: '#6B7280', ordem: 5 }
  ],
  ativo: true,
  default: true
}];

export type UserRole = 'admin' | 'gerente' | 'supervisor' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  supervisores?: string[];
  vendedores?: string[];
  gerenteId?: string;
  supervisorId?: string;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  placa: string;
  veiculo: string;
  fipe: string;
  mensalidade: string;
  status: string;
  vendedorId: string;
  supervisorId: string;
  createdAt: string;
  lastContact: string;
  closedAt?: string;
}

export interface Message {
  id: string;
  remetente: 'lead' | 'vendedor';
  texto: string;
  timestamp: string;
  lido: boolean;
}

export interface Chat {
  id: string;
  leadId: string;
  vendedorId: string;
  mensagens: Message[];
  typing: boolean;
  unreadCount: number;
}

export interface FunnelStage {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

export interface Funnel {
  id: string;
  nome: string;
  etapas: FunnelStage[];
  ativo: boolean;
  default: boolean;
}

interface CRMStore {
  // Estado atual
  currentUser: User;
  users: User[];
  leads: Lead[];
  chats: Chat[];
  funnels: Funnel[];
  selectedChat: Chat | null;
  
  // Ações
  setCurrentUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  selectChat: (chatId: string) => void;
  sendMessage: (chatId: string, texto: string) => void;
  updateLeadStatus: (leadId: string, newStatus: string) => void;
  getLeadsByVendedor: (vendedorId: string) => Lead[];
  getLeadsBySupervisor: (supervisorId: string) => Lead[];
  getChatsByVendedor: (vendedorId: string) => Chat[];
  getUsersByRole: (role: UserRole) => User[];
  getVendedoresBySupervisor: (supervisorId: string) => User[];
}

export const useCRMStore = create<CRMStore>((set, get) => ({
  // Estado inicial
  currentUser: {
    id: '1',
    name: 'Usuário',
    email: 'user@protecar.com',
    role: 'vendedor',
    avatar: ''
  } as User,
  users: usersData as User[],
  leads: leadsData as Lead[],
  chats: chatsData as Chat[],
  funnels: funisData as Funnel[],
  selectedChat: null,

  // Trocar usuário atual
  setCurrentUser: (userId: string) => {
    const user = get().users.find(u => u.id === userId);
    if (user) {
      set({ currentUser: user, selectedChat: null });
    }
  },

  // Trocar papel/nível (mock)
  switchRole: (role: UserRole) => {
    const users = get().users;
    const userByRole = users.find(u => u.role === role);
    if (userByRole) {
      set({ currentUser: userByRole, selectedChat: null });
    }
  },

  // Selecionar chat
  selectChat: (chatId: string) => {
    const chat = get().chats.find(c => c.id === chatId);
    if (chat) {
      // Marcar mensagens como lidas
      const updatedChat = {
        ...chat,
        unreadCount: 0,
        mensagens: chat.mensagens.map(m => ({ ...m, lido: true }))
      };
      
      set(state => ({
        selectedChat: updatedChat,
        chats: state.chats.map(c => c.id === chatId ? updatedChat : c)
      }));
    }
  },

  // Enviar mensagem (mockado)
  sendMessage: (chatId: string, texto: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      remetente: 'vendedor',
      texto,
      timestamp: new Date().toISOString(),
      lido: true
    };

    set(state => {
      const updatedChats = state.chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            mensagens: [...chat.mensagens, newMessage]
          };
        }
        return chat;
      });

      const updatedSelectedChat = state.selectedChat?.id === chatId
        ? { ...state.selectedChat, mensagens: [...state.selectedChat.mensagens, newMessage] }
        : state.selectedChat;

      return {
        chats: updatedChats,
        selectedChat: updatedSelectedChat
      };
    });
  },

  // Atualizar status do lead
  updateLeadStatus: (leadId: string, newStatus: string) => {
    set(state => ({
      leads: state.leads.map(lead =>
        lead.id === leadId
          ? { ...lead, status: newStatus, lastContact: new Date().toISOString() }
          : lead
      )
    }));
  },

  // Obter leads por vendedor
  getLeadsByVendedor: (vendedorId: string) => {
    return get().leads.filter(lead => lead.vendedorId === vendedorId);
  },

  // Obter leads por supervisor
  getLeadsBySupervisor: (supervisorId: string) => {
    return get().leads.filter(lead => lead.supervisorId === supervisorId);
  },

  // Obter chats por vendedor
  getChatsByVendedor: (vendedorId: string) => {
    return get().chats.filter(chat => chat.vendedorId === vendedorId);
  },

  // Obter usuários por papel
  getUsersByRole: (role: UserRole) => {
    return get().users.filter(user => user.role === role);
  },

  // Obter vendedores por supervisor
  getVendedoresBySupervisor: (supervisorId: string) => {
    return get().users.filter(user => user.supervisorId === supervisorId);
  },
}));
