'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import HeaderAdminSimples from '@/components/admin/HeaderAdminSimples';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Se for página de login, não verifica autenticação
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Verificar autenticação no localStorage
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const adminStorage = localStorage.getItem('admin-storage');
        if (adminStorage) {
          try {
            const parsed = JSON.parse(adminStorage);
            if (parsed.state && parsed.state.isAuthenticated) {
              setIsAuthenticated(true);
            } else {
              router.push('/admin/login');
            }
          } catch (e) {
            router.push('/admin/login');
          }
        } else {
          router.push('/admin/login');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, isLoginPage]);

  // Se for página de login, renderizar sem layout
  if (isLoginPage) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <HeaderAdminSimples />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
