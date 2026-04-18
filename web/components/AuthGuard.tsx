'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user session
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setSession({ user } as any);
      } catch (e) {
        console.error('Invalid user session');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!session && pathname !== '/') {
      // Unauthenticated users trying to access protected routes
      router.push('/');
    } else if (session && pathname === '/') {
      // Authenticated users trying to access landing page
      router.push('/dashboard');
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  if (!session && pathname !== '/') return null;
  if (session && pathname === '/') return null;

  return <>{children}</>;
}
