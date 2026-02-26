'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { BackgroundEffects } from '@/components/layout/background-effects';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { subscriptionApi } from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const { setSubscription, setLoading: setSubLoading } = useSubscriptionStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand persist rehydration
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
      setLoading(false);
    });
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      setLoading(false);
    }
    return unsub;
  }, [setLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!hydrated) return;
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isLoading, isAuthenticated, router]);

  // Load subscription data when authenticated
  useEffect(() => {
    const loadSubscription = async () => {
      if (!isAuthenticated) return;
      setSubLoading(true);
      try {
        const response = await subscriptionApi.getCurrent();
        if (response.data) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.log('No subscription found:', error);
      } finally {
        setSubLoading(false);
      }
    };
    loadSubscription();
  }, [isAuthenticated, setSubscription, setSubLoading]);

  if (!hydrated || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading ClearFlow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <BackgroundEffects />
      <Sidebar />
      {/* Main content - responsive margins */}
      <main className="md:ml-[280px] p-4 pt-16 md:pt-8 md:p-8 lg:p-10 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
