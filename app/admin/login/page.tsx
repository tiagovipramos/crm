'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    console.log('[LOGIN] Iniciando login...');
    console.log('[LOGIN] Email:', email);
    console.log('[LOGIN] Senha length:', senha.length);

    try {
      console.log('[LOGIN] Chamando função login do store...');
      const sucesso = await login(email, senha);
      
      console.log('[LOGIN] Resultado do login:', sucesso);

      if (sucesso) {
        console.log('[LOGIN] Login bem-sucedido! Redirecionando...');
        router.push('/admin');
      }
    } catch (error: any) {
      console.error('[LOGIN] Erro ao fazer login:', error);
      // Exibir a mensagem de erro do backend
      setErro(error.message || 'Erro ao conectar ao servidor');
      setCarregando(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 100%)'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1e293b' }}>
            Painel Admin
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Protecar CRM - Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={carregando}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Senha
            </label>
            <input 
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              disabled={carregando}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {erro && (
            <div style={{
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {erro}
            </div>
          )}

          <button 
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              padding: '14px',
              background: carregando ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: carregando ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>

      </div>
    </div>
  );
}
