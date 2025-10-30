'use client';

import { useAdminStore } from '@/store/useAdminStore';
import { Users, Search, Filter, Plus, Lock, Unlock, UserX, UserCheck, Eye, Edit, Shield, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Vendedor, Indicador, UsuarioAdmin } from '@/types/admin';

// Modal para adicionar usuário
function AddUsuarioModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { cadastrarVendedor, cadastrarIndicador, cadastrarAdmin } = useAdminStore();
  const usuarioLogado = useAdminStore((state) => state.usuarioLogado);
  
  // Definir opções permitidas baseado no role
  const getOpcoesPermitidas = () => {
    // Fallback: se não houver usuário logado, mostrar todas as opções
    // Isso pode acontecer se o estado não estiver carregado ainda
    if (!usuarioLogado) {
      console.warn('usuarioLogado não definido ao abrir modal de adicionar usuário');
      return [
        { value: 'admin', label: 'Admin (Acesso Total - /admin)' },
        { value: 'gerente', label: 'Gerente (Gerencia Equipe - /admin)' },
        { value: 'supervisor', label: 'Supervisor (Gerencia Vendedores - /admin)' },
        { value: 'vendedor', label: 'Vendedor (Acesso CRM - /crm)' },
        { value: 'indicador', label: 'Indicador (Acesso Indicações - /indicador)' },
      ];
    }

    if (usuarioLogado.role === 'diretor') {
      // Admin pode criar tudo
      return [
        { value: 'admin', label: 'Admin (Acesso Total - /admin)' },
        { value: 'gerente', label: 'Gerente (Gerencia Equipe - /admin)' },
        { value: 'supervisor', label: 'Supervisor (Gerencia Vendedores - /admin)' },
        { value: 'vendedor', label: 'Vendedor (Acesso CRM - /crm)' },
        { value: 'indicador', label: 'Indicador (Acesso Indicações - /indicador)' },
      ];
    } else if (usuarioLogado.role === 'gerente') {
      // Gerente pode criar: supervisor, vendedor, indicador
      return [
        { value: 'supervisor', label: 'Supervisor (Gerencia Vendedores - /admin)' },
        { value: 'vendedor', label: 'Vendedor (Acesso CRM - /crm)' },
        { value: 'indicador', label: 'Indicador (Acesso Indicações - /indicador)' },
      ];
    } else if (usuarioLogado.role === 'supervisor') {
      // Supervisor pode criar: vendedor, indicador
      return [
        { value: 'vendedor', label: 'Vendedor (Acesso CRM - /crm)' },
        { value: 'indicador', label: 'Indicador (Acesso Indicações - /indicador)' },
      ];
    }

    // Fallback adicional caso o role não seja reconhecido
    return [
      { value: 'vendedor', label: 'Vendedor (Acesso CRM - /crm)' },
      { value: 'indicador', label: 'Indicador (Acesso Indicações - /indicador)' },
    ];
  };

  const opcoesPermitidas = getOpcoesPermitidas();
  
  // Definir valor inicial como a primeira opção disponível
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    cpf: '',
    tipoUsuario: (opcoesPermitidas[0]?.value || 'vendedor') as 'admin' | 'gerente' | 'supervisor' | 'vendedor' | 'indicador',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataAtual = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    try {
      if (formData.tipoUsuario === 'vendedor') {
        await cadastrarVendedor({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          senha: formData.senha,
          whatsappConectado: false,
          dataCadastro: dataAtual,
          ativo: true,
          leadsAtivos: 0,
          conversoes: 0,
          taxaConversao: 0,
          faturamento: 0,
        });
      } else if (formData.tipoUsuario === 'indicador') {
        await cadastrarIndicador({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          cpf: formData.cpf,
          senha: formData.senha,
          dataCadastro: dataAtual,
          ativo: true,
          saldoDisponivel: 0,
          saldoBloqueado: 0,
          saldoPerdido: 0,
          totalPago: 0,
          totalIndicacoes: 0,
          indicacoesRespondidas: 0,
          indicacoesConvertidas: 0,
          taxaConversao: 0,
        });
      } else {
        // admin, gerente ou supervisor
        const roleMap = {
          admin: 'diretor' as const,
          gerente: 'gerente' as const,
          supervisor: 'supervisor' as const,
        };
        
        cadastrarAdmin({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          senha: formData.senha,
          role: roleMap[formData.tipoUsuario as 'admin' | 'gerente' | 'supervisor'],
          nivel: formData.tipoUsuario === 'admin' ? 1 : formData.tipoUsuario === 'gerente' ? 2 : 3,
          dataCadastro: dataAtual,
          ativo: true,
        });
      }
      
      // Aguardar um pouco para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        await onSuccess();
      }
      
      // Fechar modal apenas após sucesso
      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      alert('Erro ao cadastrar usuário. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Adicionar Novo Usuário
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Usuário</label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.tipoUsuario}
              onChange={(e) => setFormData({ ...formData, tipoUsuario: e.target.value as any })}
            >
              {opcoesPermitidas.length === 0 ? (
                <option value="">Erro: Nenhuma opção disponível</option>
              ) : (
                opcoesPermitidas.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          {formData.tipoUsuario === 'indicador' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de confirmação de deleção
function ConfirmarDelecaoModal({ 
  onClose, 
  onConfirm, 
  nome 
}: { 
  onClose: () => void; 
  onConfirm: () => void; 
  nome: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-red-600 mb-4">
          Confirmar Exclusão
        </h3>
        
        <p className="text-slate-700 mb-6">
          Tem certeza que deseja <span className="font-bold text-red-600">APAGAR</span> o usuário <span className="font-bold">"{nome}"</span>? 
          <br /><br />
          Esta ação não pode ser desfeita!
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sim, Apagar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de edição de usuário
function EditarUsuarioModal({ 
  onClose, 
  usuario, 
  tipo,
  onSuccess 
}: { 
  onClose: () => void; 
  usuario: any; 
  tipo: 'vendedor' | 'indicador' | 'admin';
  onSuccess?: () => void;
}) {
  const { editarVendedor, editarIndicador, editarAdmin } = useAdminStore();
  
  const [formData, setFormData] = useState({
    nome: usuario.nome || '',
    email: usuario.email || '',
    telefone: usuario.telefone || '',
    senha: '', // Deixar vazio, só atualiza se o usuário preencher
    cpf: tipo === 'indicador' ? (usuario.cpf || '') : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToUpdate: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
      };

      // Só incluir senha se foi preenchida
      if (formData.senha && formData.senha.trim() !== '') {
        dataToUpdate.senha = formData.senha;
      }

      // Se for indicador, incluir CPF
      if (tipo === 'indicador') {
        dataToUpdate.cpf = formData.cpf;
      }

      if (tipo === 'vendedor') {
        await editarVendedor(usuario.id, dataToUpdate);
      } else if (tipo === 'indicador') {
        await editarIndicador(usuario.id, dataToUpdate);
      } else if (tipo === 'admin') {
        await editarAdmin(usuario.id, dataToUpdate);
      }
      
      // Aguardar um pouco para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        await onSuccess();
      }
      
      alert('Usuário atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Editar Usuário: {usuario.nome}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          {tipo === 'indicador' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nova Senha (deixe em branco para não alterar)
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Digite a nova senha se quiser alterar"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de monitoramento
function MonitorUsuarioModal({ onClose, usuario, tipo }: { onClose: () => void; usuario: any; tipo: 'vendedor' | 'indicador' | 'admin' }) {
  const logsAuditoria = useAdminStore((state) => state.logsAuditoria);
  
  // Filtrar logs do usuário
  const logsUsuario = logsAuditoria.filter(log => log.usuarioId === usuario.id).slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Monitorar Usuário: {usuario.nome}
        </h3>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Email</p>
              <p className="font-medium text-slate-800">{usuario.email}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Data de Cadastro</p>
              <p className="font-medium text-slate-800">{usuario.dataCadastro}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600">Último Acesso</p>
              <p className="font-medium text-slate-800">{usuario.ultimoAcesso || 'Nunca'}</p>
            </div>
          </div>

          {tipo === 'vendedor' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Leads Ativos</p>
                <p className="text-2xl font-bold text-blue-700">{usuario.leadsAtivos}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Conversões</p>
                <p className="text-2xl font-bold text-green-700">{usuario.conversoes}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Taxa</p>
                <p className="text-2xl font-bold text-purple-700">{usuario.taxaConversao.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {tipo === 'indicador' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Indicações</p>
                <p className="text-2xl font-bold text-blue-700">{usuario.totalIndicacoes}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Convertidas</p>
                <p className="text-2xl font-bold text-green-700">{usuario.indicacoesConvertidas}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Saldo</p>
                <p className="text-2xl font-bold text-purple-700">R$ {usuario.saldoDisponivel.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Atividades Recentes</h4>
          {logsUsuario.length > 0 ? (
            <div className="space-y-2">
              {logsUsuario.map((log) => (
                <div key={log.id} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-800">{log.acao}</p>
                    <p className="text-sm text-slate-500">{log.data}</p>
                  </div>
                  <p className="text-sm text-slate-600">{log.descricao}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">Nenhuma atividade registrada</p>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosListView() {
  const usuarioLogado = useAdminStore((state) => state.usuarioLogado);
  const vendedores = useAdminStore((state) => state.getVendedoresPorHierarquia());
  const indicadores = useAdminStore((state) => state.getIndicadores());
  const admins = useAdminStore((state) => state.admins); // Usar admins direto do store
  const editarVendedor = useAdminStore((state) => state.editarVendedor);
  const editarIndicador = useAdminStore((state) => state.editarIndicador);
  const editarAdmin = useAdminStore((state) => state.editarAdmin);
  const fetchVendedores = useAdminStore((state) => state.fetchVendedores);
  const fetchIndicadores = useAdminStore((state) => state.fetchIndicadores);
  const fetchAdmins = useAdminStore((state) => state.fetchAdmins);
  const isLoadingVendedores = useAdminStore((state) => state.isLoadingVendedores);
  const isLoadingIndicadores = useAdminStore((state) => state.isLoadingIndicadores);
  
  const [filtro, setFiltro] = useState<'todos' | 'admins' | 'gerentes' | 'supervisores' | 'vendedores' | 'indicadores'>('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [showConfirmarDelecao, setShowConfirmarDelecao] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<any>(null);
  const [usuarioMonitor, setUsuarioMonitor] = useState<any>(null);
  const [usuarioDeletar, setUsuarioDeletar] = useState<{ id: number | string; tipo: 'vendedor' | 'indicador' | 'admin'; nome: string } | null>(null);
  const [tipoEditar, setTipoEditar] = useState<'vendedor' | 'indicador' | 'admin'>('vendedor');
  const [tipoMonitor, setTipoMonitor] = useState<'vendedor' | 'indicador' | 'admin'>('vendedor');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados ao montar o componente
  useEffect(() => {
    console.log('[UsuariosListView] Montando componente, carregando dados...');
    fetchVendedores();
    fetchIndicadores();
    fetchAdmins();
  }, [fetchVendedores, fetchIndicadores, fetchAdmins]);

  // Função para recarregar todas as listas manualmente
  const recarregarListas = async () => {
    console.log('[UsuariosListView] Recarregando todas as listas...');
    await Promise.all([
      fetchVendedores(),
      fetchIndicadores(),
      fetchAdmins()
    ]);
    console.log('[UsuariosListView] Listas recarregadas!');
  };

  // Filtrar admins baseado na hierarquia do usuário logado
  const adminsVisiveis = (() => {
    if (!usuarioLogado) return admins;
    
    if (usuarioLogado.role === 'diretor') {
      // Diretor vê todos os admins
      return admins;
    } else if (usuarioLogado.role === 'gerente') {
      // Gerente NÃO vê diretores nem outros gerentes, apenas supervisores
      return Array.isArray(admins) ? admins.filter(a => a.role === 'supervisor') : [];
    } else if (usuarioLogado.role === 'supervisor') {
      // Supervisor não vê nenhum admin
      return [];
    }
    
    return [];
  })();

  // Separar admins visíveis por role para contadores
  const diretores = Array.isArray(adminsVisiveis) ? adminsVisiveis.filter(a => a.role === 'diretor') : [];
  const gerentes = Array.isArray(adminsVisiveis) ? adminsVisiveis.filter(a => a.role === 'gerente') : [];
  const supervisores = Array.isArray(adminsVisiveis) ? adminsVisiveis.filter(a => a.role === 'supervisor') : [];

  // Combinar todos os usuários visíveis (com verificação de array)
  const todosUsuarios = [
    ...(Array.isArray(vendedores) ? vendedores.map(v => ({ ...v, tipo: 'vendedor' as const })) : []),
    ...(Array.isArray(indicadores) ? indicadores.map(i => ({ ...i, tipo: 'indicador' as const })) : []),
    ...(Array.isArray(adminsVisiveis) ? adminsVisiveis.map(a => ({ ...a, tipo: 'admin' as const })) : []),
  ];

  // Filtrar usuários
  let usuariosExibidos = todosUsuarios;
  if (filtro === 'vendedores') {
    usuariosExibidos = todosUsuarios.filter(u => u.tipo === 'vendedor');
  } else if (filtro === 'indicadores') {
    usuariosExibidos = todosUsuarios.filter(u => u.tipo === 'indicador');
  } else if (filtro === 'admins') {
    usuariosExibidos = todosUsuarios.filter(u => u.tipo === 'admin' && 'role' in u && u.role === 'diretor');
  } else if (filtro === 'gerentes') {
    usuariosExibidos = todosUsuarios.filter(u => u.tipo === 'admin' && 'role' in u && u.role === 'gerente');
  } else if (filtro === 'supervisores') {
    usuariosExibidos = todosUsuarios.filter(u => u.tipo === 'admin' && 'role' in u && u.role === 'supervisor');
  }

  // Aplicar busca
  if (searchTerm) {
    usuariosExibidos = usuariosExibidos.filter(u => 
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const handleToggleAtivo = (id: number | string, tipo: 'vendedor' | 'indicador' | 'admin', ativoAtual: boolean) => {
    if (tipo === 'vendedor') {
      editarVendedor(id as number, { ativo: !ativoAtual });
    } else if (tipo === 'indicador') {
      editarIndicador(id as number, { ativo: !ativoAtual });
    } else if (tipo === 'admin') {
      editarAdmin(id as number, { ativo: !ativoAtual });
    }
  };

  const handleMonitorar = (usuario: any, tipo: 'vendedor' | 'indicador' | 'admin') => {
    setUsuarioMonitor(usuario);
    setTipoMonitor(tipo);
    setShowMonitorModal(true);
  };

  const handleEditar = (usuario: any, tipo: 'vendedor' | 'indicador' | 'admin') => {
    setUsuarioEditar(usuario);
    setTipoEditar(tipo);
    setShowEditModal(true);
  };

  const deletarVendedor = useAdminStore((state) => state.deletarVendedor);
  const deletarIndicador = useAdminStore((state) => state.deletarIndicador);
  const deletarAdmin = useAdminStore((state) => state.deletarAdmin);

  const handleClickDeletar = (e: React.MouseEvent, id: number | string, tipo: 'vendedor' | 'indicador' | 'admin', nome: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('handleClickDeletar chamado:', { id, tipo, nome });
    
    // Abrir modal de confirmação
    setUsuarioDeletar({ id, tipo, nome });
    setShowConfirmarDelecao(true);
  };

  // Loading state - mostrar enquanto carrega (DEPOIS de todos os hooks)
  if (isLoadingVendedores || isLoadingIndicadores) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const handleConfirmarDelecao = async () => {
    if (!usuarioDeletar) return;

    const { id, tipo, nome } = usuarioDeletar;

    try {
      console.log('Iniciando deleção...', { id, tipo, nome });
      
      if (tipo === 'vendedor') {
        console.log('Deletando vendedor:', id);
        await deletarVendedor(id as number);
      } else if (tipo === 'indicador') {
        console.log('Deletando indicador:', id);
        await deletarIndicador(id as number);
      } else if (tipo === 'admin') {
        console.log('Deletando admin:', id);
        await deletarAdmin(id as number);
      }
      
      console.log('Usuário deletado, recarregando listas...');
      
      // Fechar modal
      setShowConfirmarDelecao(false);
      setUsuarioDeletar(null);
      
      // Recarregar listas
      await fetchVendedores();
      await fetchIndicadores();
      await fetchAdmins();
      
      console.log('Listas recarregadas com sucesso');
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário. Verifique o console para mais detalhes.');
      setShowConfirmarDelecao(false);
      setUsuarioDeletar(null);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg ${
              filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
            }`}
          >
            Todos ({todosUsuarios.length})
          </button>
          
          {/* Apenas Diretor vê botões de Admins e Gerentes */}
          {usuarioLogado?.role === 'diretor' && (
            <>
              <button
                onClick={() => setFiltro('admins')}
                className={`px-4 py-2 rounded-lg ${
                  filtro === 'admins' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                Admins ({diretores.length})
              </button>
              <button
                onClick={() => setFiltro('gerentes')}
                className={`px-4 py-2 rounded-lg ${
                  filtro === 'gerentes' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                Gerentes ({gerentes.length})
              </button>
            </>
          )}
          
          {/* Diretor e Gerente veem botão de Supervisores */}
          {(usuarioLogado?.role === 'diretor' || usuarioLogado?.role === 'gerente') && (
            <button
              onClick={() => setFiltro('supervisores')}
              className={`px-4 py-2 rounded-lg ${
                filtro === 'supervisores' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              Supervisores ({supervisores.length})
            </button>
          )}
          
          <button
            onClick={() => setFiltro('vendedores')}
            className={`px-4 py-2 rounded-lg ${
              filtro === 'vendedores' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
            }`}
          >
            Vendedores ({vendedores.length})
          </button>
          <button
            onClick={() => setFiltro('indicadores')}
            className={`px-4 py-2 rounded-lg ${
              filtro === 'indicadores' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
            }`}
          >
            Indicadores ({indicadores.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar usuário..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Métricas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gestor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usuariosExibidos.map((usuario) => (
                <tr key={`${usuario.tipo}-${usuario.id}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        usuario.tipo === 'vendedor' ? 'bg-blue-100 text-blue-600' :
                        usuario.tipo === 'indicador' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {usuario.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{usuario.nome}</p>
                        {usuario.tipo === 'admin' && 'role' in usuario && (
                          <p className="text-sm text-slate-500 capitalize">{usuario.role}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.telefone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      usuario.tipo === 'vendedor' ? 'bg-blue-100 text-blue-700' :
                      usuario.tipo === 'indicador' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {usuario.tipo === 'vendedor' ? 'Vendedor' : 
                       usuario.tipo === 'indicador' ? 'Indicador' : 
                       usuario.tipo === 'admin' && 'role' in usuario ? 
                         (usuario.role === 'diretor' ? 'Admin' : 
                          usuario.role === 'gerente' ? 'Gerente' : 
                          usuario.role === 'supervisor' ? 'Supervisor' : 'Admin') 
                       : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {usuario.tipo === 'vendedor' && 'conversoes' in usuario && (
                      <span>{usuario.conversoes} vendas • {usuario.taxaConversao.toFixed(0)}%</span>
                    )}
                    {usuario.tipo === 'indicador' && 'totalIndicacoes' in usuario && (
                      <span>{usuario.totalIndicacoes} indicações • {usuario.indicacoesConvertidas} convertidas</span>
                    )}
                    {usuario.tipo === 'admin' && '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {('gestorNome' in usuario ? usuario.gestorNome : '-') as string}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Botão Ativar/Inativar */}
                      <button
                        onClick={() => handleToggleAtivo(usuario.id, usuario.tipo, usuario.ativo)}
                        className={`p-2 rounded-lg transition-colors ${
                          usuario.ativo
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                        title={usuario.ativo ? 'Inativar' : 'Ativar'}
                      >
                        {usuario.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>

                      {/* Botão Editar */}
                      <button
                        onClick={() => handleEditar(usuario, usuario.tipo)}
                        className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>

                      {/* Botão Monitorar */}
                      <button
                        onClick={() => handleMonitorar(usuario, usuario.tipo)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Monitorar"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Botão Apagar */}
                      <button
                        onClick={(e) => handleClickDeletar(e, usuario.id, usuario.tipo, usuario.nome)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Apagar Usuário"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosExibidos.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {showAddModal && (
        <AddUsuarioModal
          onClose={() => setShowAddModal(false)}
          onSuccess={recarregarListas}
        />
      )}

      {showEditModal && usuarioEditar && (
        <EditarUsuarioModal
          onClose={() => {
            setShowEditModal(false);
            setUsuarioEditar(null);
          }}
          usuario={usuarioEditar}
          tipo={tipoEditar}
          onSuccess={recarregarListas}
        />
      )}

      {showMonitorModal && usuarioMonitor && (
        <MonitorUsuarioModal
          onClose={() => setShowMonitorModal(false)}
          usuario={usuarioMonitor}
          tipo={tipoMonitor}
        />
      )}

      {showConfirmarDelecao && usuarioDeletar && (
        <ConfirmarDelecaoModal
          onClose={() => {
            setShowConfirmarDelecao(false);
            setUsuarioDeletar(null);
          }}
          onConfirm={handleConfirmarDelecao}
          nome={usuarioDeletar.nome}
        />
      )}
    </div>
  );
}
