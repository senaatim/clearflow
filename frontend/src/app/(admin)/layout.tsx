'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { BackgroundEffects } from '@/components/layout/background-effects';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, setLoading } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
      setLoading(false);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      setLoading(false);
    }
    return unsub;
  }, [setLoading]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && user && user.role === 'user') {
      router.push('/dashboard');
    }
  }, [hydrated, isLoading, isAuthenticated, user, router]);

  if (!hydrated || isLoading || !isAuthenticated || !user || user.role === 'user') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading Admin Panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <BackgroundEffects />
      <AdminSidebar />
      <main className="md:ml-[280px] p-4 pt-16 md:pt-8 md:p-8 lg:p-10 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
