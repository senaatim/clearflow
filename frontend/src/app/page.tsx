'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for zustand persist rehydration
    const check = () => {
      const { isAuthenticated, accessToken } = useAuthStore.getState();
      if (isAuthenticated && accessToken) {
        router.replace('/dashboard');
      } else {
        router.replace('/landing');
      }
      setIsChecking(false);
    };

    if (useAuthStore.persist.hasHydrated()) {
      check();
    } else {
      useAuthStore.persist.onFinishHydration(check);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading ClearFlow...</span>
        </div>
      </div>
    );
  }

  return null;
}
